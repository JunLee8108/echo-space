// components/hooks/useAddComment.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUserComment } from "../../services/postService";
import { useUserId, useDisplayName } from "../../stores/userStore";

export const useAddComment = (options = {}) => {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const displayName = useDisplayName();

  return useMutation({
    mutationFn: async ({ postId, message }) => {
      if (!postId) throw new Error("postId가 필요합니다.");
      if (!message || message.trim() === "") {
        throw new Error("댓글 내용을 입력해주세요.");
      }

      // 서버에 댓글 저장
      const savedComment = await addUserComment(postId, userId, message);

      return {
        postId,
        savedComment,
      };
    },

    onMutate: async ({ postId, message }) => {
      // 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      // 이전 데이터 스냅샷
      const previousData = queryClient.getQueryData(["posts", userId]);

      // 임시 ID 생성
      const tempId = `temp-comment-${Date.now()}`;

      // Optimistic update - 임시 댓글 추가
      const optimisticComment = {
        id: tempId,
        character_id: null,
        user_id: userId,
        message: message.trim(),
        like: 0,
        created_at: new Date().toISOString(),
        isUserComment: true,
        character: displayName || "User",
        avatar_url: null,
        personality: [],
        description: "",
        prompt_description: "",
        affinity: null,
        isLikedByUser: false,
        User_Profile: {
          id: userId,
          display_name: displayName || "User",
        },
        isLoading: true, // 로딩 상태 표시
        isLocallyAdded: true, // 🔴 로컬에서 추가됨을 표시
      };

      // 캐시 업데이트
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  Comment: [...(post.Comment || []), optimisticComment],
                };
              }
              return post;
            }),
          })),
        };
      });

      return { tempId, previousData };
    },

    onSuccess: (data, variables, context) => {
      const { postId, savedComment } = data;
      const { tempId } = context;

      // 서버 응답으로 임시 댓글 교체
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  Comment: post.Comment.map((comment) => {
                    if (comment.id === tempId) {
                      return {
                        ...savedComment,
                        isLoading: false,
                        isLocallyAdded: true, // 🔴 여전히 로컬 플래그 유지
                      };
                    }
                    return comment;
                  }),
                };
              }
              return post;
            }),
          })),
        };
      });

      // 🔴 3초 후 isLocallyAdded 플래그 제거 (선택적)
      setTimeout(() => {
        queryClient.setQueryData(["posts", userId], (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    Comment: post.Comment.map((comment) => {
                      if (comment.id === savedComment.id) {
                        const { isLocallyAdded: _isLocallyAdded, ...rest } =
                          comment;
                        return rest;
                      }
                      return comment;
                    }),
                  };
                }
                return post;
              }),
            })),
          };
        });
      }, 3000);

      // 성공 콜백
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },

    onError: (error, variables, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(["posts", userId], context.previousData);
      }

      console.error("댓글 추가 실패:", error);

      // 에러 콜백
      if (options.onError) {
        options.onError(error);
      } else {
        alert(error.message || "댓글 작성 중 오류가 발생했습니다.");
      }
    },

    onSettled: () => {
      // 필요시 쿼리 무효화 (선택사항)
      // queryClient.invalidateQueries({ queryKey: ["posts", userId] });
    },
  });
};
