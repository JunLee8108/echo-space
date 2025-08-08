// services/imageService.js
import supabase from "./supabaseClient";

/**
 * Base64 이미지를 Blob으로 변환
 */
function base64ToBlob(base64, mimeType) {
  try {
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error("Failed to convert base64 to blob:", error);
    throw error;
  }
}

/**
 * Supabase Storage URL에서 파일 경로 추출
 */
function extractStoragePathFromUrl(url) {
  try {
    // Supabase Storage URL 패턴:
    // https://[project-id].supabase.co/storage/v1/object/public/post-images/[user-id]/[filename]
    // 예: https://xxx.supabase.co/storage/v1/object/public/post-images/db5f4f8e-6177-4f1b-8bc3-4056ff6c5eef/1754622568313-0d62b04hz8da.png

    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/post-images\/(.+)/
    );

    if (pathMatch && pathMatch[1]) {
      // pathMatch[1] = "db5f4f8e-6177-4f1b-8bc3-4056ff6c5eef/1754622568313-0d62b04hz8da.png"
      return pathMatch[1];
    }

    return null;
  } catch {
    console.error("Invalid URL:", url);
    return null;
  }
}

/**
 * HTML 콘텐츠에서 Supabase Storage 이미지 URL 추출
 */
function extractImageUrlsFromContent(htmlContent) {
  if (!htmlContent) return [];

  const imageUrls = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const images = doc.querySelectorAll("img");

  images.forEach((img) => {
    const src = img.getAttribute("src");
    // Supabase Storage URL인지 확인
    if (
      src &&
      src.includes("supabase.co/storage/v1/object/public/post-images")
    ) {
      imageUrls.push(src);
    }
  });

  return imageUrls;
}

/**
 * 이미지 파일을 Supabase Storage에 업로드
 */
export async function uploadImage(file, userId) {
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.type.split("/")[1] || "png";
    const fileName = `${userId}/${timestamp}-${randomStr}.${extension}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Image upload error:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-images").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload image:", error);
    throw error;
  }
}

/**
 * Base64 이미지를 Supabase Storage에 업로드하고 URL 반환
 */
export async function uploadBase64Image(base64String, userId) {
  try {
    const mimeMatch = base64String.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    const blob = base64ToBlob(base64String, mimeType);

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error(
        `Image size (${(blob.size / 1024 / 1024).toFixed(
          1
        )}MB) exceeds maximum allowed size (10MB)`
      );
    }

    const file = new File([blob], "pasted-image", { type: mimeType });

    return await uploadImage(file, userId);
  } catch (error) {
    console.error("Failed to upload base64 image:", error);
    throw error;
  }
}

/**
 * HTML 콘텐츠 내의 모든 base64 이미지를 찾아서 URL로 교체
 */
export async function processContentImages(
  htmlContent,
  userId,
  onProgress = null
) {
  try {
    if (!htmlContent || !htmlContent.includes("data:image")) {
      return htmlContent;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const images = doc.querySelectorAll('img[src^="data:image"]');

    if (images.length === 0) {
      return htmlContent;
    }

    if (onProgress) {
      onProgress({ total: images.length, current: 0, status: "starting" });
    }

    const uploadPromises = Array.from(images).map(async (img, index) => {
      const base64String = img.src;

      try {
        const sizeInBytes = Math.ceil((base64String.length - 22) * 0.75);
        const sizeInKB = sizeInBytes / 1024;

        // 100KB 이하는 그대로 유지 (옵션)
        if (sizeInKB < 100) {
          console.log(
            `Image ${index + 1} is small (${sizeInKB.toFixed(
              1
            )}KB), keeping as base64`
          );
          return null;
        }

        const imageUrl = await uploadBase64Image(base64String, userId);

        if (onProgress) {
          onProgress({
            total: images.length,
            current: index + 1,
            status: "uploading",
            currentFile: `image_${index + 1}`,
          });
        }

        return { img, newUrl: imageUrl };
      } catch (error) {
        console.error(`Failed to process image ${index + 1}:`, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);

    results.forEach((result) => {
      if (result && result.img && result.newUrl) {
        result.img.src = result.newUrl;
        // 클래스나 다른 속성은 유지
      }
    });

    if (onProgress) {
      onProgress({
        total: images.length,
        current: images.length,
        status: "completed",
      });
    }

    return doc.body.innerHTML;
  } catch (error) {
    console.error("Failed to process content images:", error);
    throw error;
  }
}

/**
 * Supabase Storage에서 단일 이미지 삭제
 */
export async function deleteImageFromStorage(imageUrl, userId) {
  try {
    const filePath = extractStoragePathFromUrl(imageUrl);

    if (!filePath) {
      console.warn("Could not extract file path from URL:", imageUrl);
      return false;
    }

    // filePath 예시: "db5f4f8e-6177-4f1b-8bc3-4056ff6c5eef/1754622568313-0d62b04hz8da.png"
    console.log(`Attempting to delete: ${filePath}`);

    // 보안: userId가 파일 경로에 포함되어 있는지 확인
    if (!filePath.startsWith(`${userId}/`)) {
      console.error(
        `Unauthorized: Cannot delete files from other users. Expected userId: ${userId}, Found path: ${filePath}`
      );
      return false;
    }

    // Supabase Storage에서 파일 삭제
    // remove() 메서드는 전체 경로를 배열로 받음
    const { data, error } = await supabase.storage
      .from("post-images")
      .remove([filePath]); // 예: ["db5f4f8e-6177-4f1b-8bc3-4056ff6c5eef/1754622568313-0d62b04hz8da.png"]

    if (error) {
      console.error(`Failed to delete image ${filePath}:`, error);
      console.error("Error details:", error.message, error.statusCode);

      // RLS 정책 확인 필요
      if (error.statusCode === 400 || error.statusCode === 403) {
        console.error(
          "⚠️ Storage 정책 확인 필요: DELETE 권한이 있는지 확인하세요"
        );
      }
      return false;
    }

    console.log(`✅ Successfully deleted image: ${filePath}`);
    if (data) {
      console.log("Deletion response:", data);
    }

    return true;
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    return false;
  }
}

/**
 * 포스트 콘텐츠에서 모든 이미지를 찾아 Storage에서 삭제
 */
export async function deletePostImages(htmlContent, userId) {
  try {
    if (!htmlContent) return;

    // HTML 콘텐츠에서 모든 Supabase Storage 이미지 URL 추출
    const imageUrls = extractImageUrlsFromContent(htmlContent);

    if (imageUrls.length === 0) {
      console.log("No storage images found in content");
      return;
    }

    console.log(`Found ${imageUrls.length} images to delete`);

    // 모든 이미지 삭제 (병렬 처리)
    const deletePromises = imageUrls.map((url) =>
      deleteImageFromStorage(url, userId)
    );

    const results = await Promise.all(deletePromises);
    const successCount = results.filter(Boolean).length;

    console.log(
      `✅ Deleted ${successCount}/${imageUrls.length} images from storage`
    );

    if (successCount < imageUrls.length) {
      console.warn(`⚠️ Some images could not be deleted`);
    }
  } catch (error) {
    console.error("Error deleting post images:", error);
    throw error;
  }
}

/**
 * 포스트 업데이트 시 사용하지 않는 이미지 정리
 * (이전 콘텐츠와 새 콘텐츠를 비교하여 제거된 이미지만 삭제)
 */
export async function cleanupUnusedImages(oldContent, newContent, userId) {
  try {
    if (!oldContent) return;

    const oldImageUrls = extractImageUrlsFromContent(oldContent);
    const newImageUrls = extractImageUrlsFromContent(newContent);

    // 이전 콘텐츠에는 있지만 새 콘텐츠에는 없는 이미지 찾기
    const removedImages = oldImageUrls.filter(
      (url) => !newImageUrls.includes(url)
    );

    if (removedImages.length === 0) {
      console.log("No images to clean up");
      return;
    }

    console.log(`Found ${removedImages.length} unused images to delete`);

    // 제거된 이미지들 삭제
    const deletePromises = removedImages.map((url) =>
      deleteImageFromStorage(url, userId)
    );

    const results = await Promise.all(deletePromises);
    const successCount = results.filter(Boolean).length;

    console.log(
      `✅ Cleaned up ${successCount}/${removedImages.length} unused images`
    );
  } catch (error) {
    console.error("Error cleaning up unused images:", error);
    // 정리 실패는 치명적이지 않으므로 에러를 throw하지 않음
  }
}

/**
 * 클립보드에서 이미지 붙여넣기 처리
 */
export async function handlePasteImage(items, userId) {
  const imageUrls = [];

  for (const item of items) {
    if (item.type.indexOf("image") === 0) {
      const file = item.getAsFile();
      if (file) {
        try {
          const url = await uploadImage(file, userId);
          imageUrls.push(url);
        } catch (error) {
          console.error("Failed to upload pasted image:", error);
        }
      }
    }
  }

  return imageUrls;
}
