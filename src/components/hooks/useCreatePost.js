// React Query 제거, zustand만 사용
import { useState } from "react";
import usePostStore from "../../stores/postStore";
import { useUserId } from "../../stores/userStore";
import { createPostImmediate } from "../../services/postService";
import { processContentImages } from "../../services/imageService";

export const useCreatePost = (options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const userId = useUserId();
  const addNewPost = usePostStore((state) => state.addNewPost);

  const createPost = async (post) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. 이미지 처리
      let processedContent = post.content;
      if (post.content?.includes("data:image")) {
        processedContent = await processContentImages(post.content, userId);
      }

      // 2. 포스트 생성 (formatPostForHome 형식으로 반환됨)
      const savedPost = await createPostImmediate(
        {
          ...post,
          content: processedContent,
        },
        userId
      );

      // 3. postStore에 추가
      addNewPost(savedPost);

      // 4. 성공 콜백
      if (options.onSuccess) {
        options.onSuccess(savedPost);
      }

      setIsLoading(false);
      return savedPost;
    } catch (error) {
      setError(error);
      setIsLoading(false);

      if (options.onError) {
        options.onError(error);
      }

      throw error;
    }
  };

  return {
    mutate: createPost,
    mutateAsync: createPost,
    isLoading,
    error,
  };
};
