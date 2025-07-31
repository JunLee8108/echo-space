// hooks/useCreatePost.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCharacters } from "./useCharacters";
import {
  savePostWithCommentsAndLikes,
  fetchPostsWithCommentsAndLikes,
} from "../../services/postService";
import { fetchAIComment } from "../../services/openaiService";

export const useCreatePost = (user, options = {}) => {
  // 페이지당 포스트 개수
  const POSTS_PER_PAGE = 5;

  const queryClient = useQueryClient();
  const { getRandomCharacters } = useCharacters();

  return useMutation({
    mutationFn: async (post) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 랜덤 캐릭터 선택
      const commentCharacters = getRandomCharacters(2);
      const likeCharacters = getRandomCharacters(
        Math.floor(Math.random() * 5) + 1
      );

      // AI 댓글 생성
      const comments = await Promise.all(
        commentCharacters.map(async (char) => {
          const reply = await fetchAIComment(
            char,
            post.content,
            post.hashtags || [], // 해시태그 배열 전달
            post.mood || null
          );
          return {
            character: char,
            message: reply,
          };
        })
      );

      // DB에 저장 (해시태그 포함)
      const savedPost = await savePostWithCommentsAndLikes(
        post,
        comments,
        likeCharacters,
        post.hashtags || [] // 해시태그 추가
      );

      return {
        tempId,
        savedPost,
      };
    },
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ["posts", user?.id] });

      const previousData = queryClient.getQueryData(["posts", user?.id]);

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticPost = {
        ...post,
        id: tempId,
        mood: post.mood || null,
        Comment: [],
        Post_Like: [],
        Post_Hashtag:
          post.hashtags?.map((tag) => ({
            hashtag_id: `temp-${tag}`,
            name: tag,
          })) || [],
        like: 0,
        created_at: new Date().toISOString(),
        user_id: user.id,
        isLoading: true,
      };

      const isEmptyCache = !previousData;

      queryClient.setQueryData(["posts", user?.id], (old) => {
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

      return { tempId, previousData, isEmptyCache };
    },

    onSuccess: async (data, variables, context) => {
      const savedPostId = data.savedPost.id;

      // 먼저 임시 포스트를 실제 포스트로 교체
      queryClient.setQueryData(["posts", user?.id], (old) => {
        if (!old) return old;

        const newPages = [...old.pages];
        if (newPages[0] && newPages[0].posts) {
          const postIndex = newPages[0].posts.findIndex(
            (post) => post.id === context.tempId
          );

          if (postIndex !== -1) {
            newPages[0].posts[postIndex] = {
              ...data.savedPost,
              isLoading: false,
            };
          }
        }

        return {
          ...old,
          pages: newPages,
        };
      });

      // 캐시가 비어있었다면, 이제 기존 posts를 fetch
      if (context.isEmptyCache) {
        setTimeout(async () => {
          try {
            // 기존 posts를 직접 fetch
            const result = await fetchPostsWithCommentsAndLikes(user.id, {
              limit: POSTS_PER_PAGE,
              cursor: null,
            });

            queryClient.setQueryData(["posts", user?.id], (old) => {
              if (!old) return old;

              // 방금 저장한 post를 제외한 나머지 posts만 추가
              const filteredPosts = result.posts.filter(
                (post) => post.id !== savedPostId
              );

              // 첫 페이지에 기존 posts 추가
              const newPages = [...old.pages];
              if (newPages[0] && newPages[0].posts) {
                // 현재 posts 중에서 방금 저장한 post 찾기
                const savedPost = newPages[0].posts.find(
                  (post) => post.id === savedPostId
                );

                if (savedPost) {
                  // 저장된 post를 맨 앞에 유지하고 나머지 추가
                  newPages[0] = {
                    posts: [savedPost, ...filteredPosts],
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  };
                } else {
                  // 예외 상황: 저장된 post가 없다면 그냥 추가
                  newPages[0] = {
                    posts: [...newPages[0].posts, ...filteredPosts],
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  };
                }
              }

              return {
                ...old,
                pages: newPages,
              };
            });
          } catch (error) {
            console.error("Error fetching existing posts:", error);
            // 에러가 발생해도 새로 작성한 post는 유지됨
          }
        }, 100);
      }

      // 콜백 실행 (incrementNotificationCount 등)
      if (options.onSuccess) {
        options.onSuccess(data);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", user?.id], context.previousData);
      }
      console.error("Error creating post:", error);

      if (options.onError) {
        options.onError(error);
      } else {
        alert("포스트 작성 중 오류가 발생했습니다.");
      }
    },
  });
};
