// hooks/useCreatePost.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserId } from "../../stores/userStore";
import { incrementNotification } from "../../stores/notificationStore";
import { createPostImmediate } from "../../services/postService";
import { processContentImages } from "../../services/imageService";

export const useCreatePost = (options = {}) => {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (post) => {
      try {
        // 1. 콘텐츠의 base64 이미지를 URL로 변환 (클라이언트에서 처리)
        let processedContent = post.content;

        if (post.content && post.content.includes("data:image")) {
          processedContent = await processContentImages(post.content, userId);
        }

        // 2. 처리된 콘텐츠로 post 객체 업데이트
        const processedPost = {
          ...post,
          content: processedContent,
        };

        // 3. 즉시 Post 저장 (AI 처리는 백그라운드에서)
        const savedPost = await createPostImmediate(processedPost, userId);

        return savedPost;
      } catch (error) {
        console.error("❌ Post creation failed:", error);
        throw error;
      }
    },

    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      const previousData = queryClient.getQueryData(["posts", userId]);
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 낙관적 업데이트 - 즉시 UI에 표시
      const optimisticPost = {
        ...post,
        id: tempId,
        mood: post.mood || null,
        Comment: [], // 빈 댓글로 시작
        Post_Like: [], // 빈 좋아요로 시작
        Post_Hashtag:
          post.hashtags?.map((tag) => ({
            hashtag_id: `temp-${tag}`,
            name: tag,
          })) || [],
        like: 0,
        created_at: new Date().toISOString(),
        user_id: userId,
        isLoading: true, // 로딩 상태 표시
        isWaitingForAI: true, // AI 처리 대기 중 표시
      };

      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) {
          return {
            pages: [
              {
                posts: [optimisticPost],
                nextCursor: null,
                hasMore: false,
              },
            ],
            pageParams: [null],
          };
        }

        const newPages = [...old.pages];
        if (!newPages[0]) {
          newPages[0] = {
            posts: [],
            nextCursor: null,
            hasMore: false,
          };
        }

        newPages[0] = {
          ...newPages[0],
          posts: [optimisticPost, ...(newPages[0].posts || [])],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      return { tempId, previousData };
    },

    onSuccess: async (savedPost, variables, context) => {
      incrementNotification();

      // 실제 저장된 데이터로 캐시 업데이트
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page, pageIndex) => {
          if (pageIndex !== 0) return page;

          const updatedPosts = page.posts.map((post) => {
            if (post.id === context.tempId) {
              return {
                ...savedPost,
                isLoading: false,
                isWaitingForAI: true, // AI 처리 대기 중
              };
            }
            return post;
          });

          return {
            ...page,
            posts: updatedPosts,
          };
        });

        return {
          ...old,
          pages: newPages,
        };
      });

      // 성공 콜백
      if (options.onSuccess) {
        options.onSuccess(savedPost);
      }

      // Realtime 구독은 다음 단계에서 구현
      console.log("📡 Ready for Realtime subscription for post:", savedPost.id);
    },

    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", userId], context.previousData);
      }

      console.error("Error creating post:", error);

      if (options.onError) {
        options.onError(error);
      } else {
        let errorMessage = "포스트 작성 중 오류가 발생했습니다.";

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
