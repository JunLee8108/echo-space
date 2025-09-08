// hooks/useUpdatePost.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserId } from "../../stores/userStore";
import { updatePost } from "../../services/postService";
import { processContentImages } from "../../services/imageService";

export const useUpdatePost = (options = {}) => {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      mood,
      hashtags,
      visibility,
      allowAIComments,
    }) => {
      try {
        // 1. 콘텐츠의 base64 이미지를 URL로 변환
        let processedContent = content;

        if (content && content.includes("data:image")) {
          processedContent = await processContentImages(content, userId);
        }

        // 2. postService에서 updatePost 호출 (처리된 콘텐츠 사용)
        const updatedPost = await updatePost(postId, {
          content: processedContent, // 처리된 콘텐츠 사용
          mood,
          hashtags,
          visibility,
          allowAIComments, // AI 댓글 허용 여부 추가
          userId,
        });

        return updatedPost;
      } catch (error) {
        console.error("❌ Post update failed:", error);
        throw error;
      }
    },

    onMutate: async ({
      postId,
      content,
      mood,
      hashtags,
      visibility,
      allowAIComments,
    }) => {
      // 낙관적 업데이트를 위해 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      // 이전 데이터 저장
      const previousData = queryClient.getQueryData(["posts", userId]);

      // 낙관적 업데이트 (base64 그대로 표시)
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                content, // 일단 base64 그대로 표시
                mood,
                visibility,
                allow_ai_comments: allowAIComments, // AI 댓글 허용 여부 추가
                Post_Hashtag:
                  hashtags?.map((tag) => ({
                    hashtag_id: `temp-${tag}`,
                    name: tag,
                  })) || [],
                isUpdating: true, // 업데이트 중 표시
              };
            }
            return post;
          }),
        }));

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousData };
    },

    onSuccess: (updatedPost) => {
      // 서버에서 받은 데이터로 캐시 업데이트 (URL로 변환된 이미지 포함)
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => {
            if (post.id === updatedPost.id) {
              return {
                ...updatedPost,
                isUpdating: false,
              };
            }
            return post;
          }),
        }));

        return {
          ...old,
          pages: newPages,
        };
      });

      if (options.onSuccess) {
        options.onSuccess(updatedPost);
      }
    },

    onError: (error, variables, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(["posts", userId], context.previousData);
      }

      console.error("Error updating post:", error);

      if (options.onError) {
        options.onError(error);
      } else {
        // 구체적인 에러 메시지 제공
        let errorMessage = "포스트 수정 중 오류가 발생했습니다.";

        if (error.message?.includes("exceeds maximum allowed size")) {
          errorMessage =
            "이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 사용해주세요.";
        } else if (error.message?.includes("Image upload")) {
          errorMessage = "이미지 업로드에 실패했습니다. 다시 시도해주세요.";
        }

        alert(errorMessage);
      }
    },
  });
};
