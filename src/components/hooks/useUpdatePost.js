import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserId } from "../../stores/userStore";
import { updatePost } from "../../services/postService";

export const useUpdatePost = (options = {}) => {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ postId, content, mood, hashtags }) => {
      // postService에서 updatePost 호출
      const updatedPost = await updatePost(postId, {
        content,
        mood,
        hashtags,
        userId,
      });

      return updatedPost;
    },

    onMutate: async ({ postId, content, mood, hashtags }) => {
      // 낙관적 업데이트를 위해 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      // 이전 데이터 저장
      const previousData = queryClient.getQueryData(["posts", userId]);

      // 낙관적 업데이트
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                content,
                mood,
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
      // 서버에서 받은 데이터로 캐시 업데이트
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
        alert("포스트 수정 중 오류가 발생했습니다.");
      }
    },
  });
};
