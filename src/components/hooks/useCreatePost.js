import { useNavigate, useLocation } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCharacterActions } from "../../stores/characterStore";
import { useUserId } from "../../stores/userStore";
import { incrementNotification } from "../../stores/notificationStore";
import {
  savePostWithCommentsAndLikes,
  fetchPostsWithCommentsAndLikes,
} from "../../services/postService";
import { fetchAIComment } from "../../services/openaiService";
import { showAffinityToast } from "../utils/toastUtils";

// 페이지당 포스트 개수
const POSTS_PER_PAGE = 5;

export const useCreatePost = (options = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryClient = useQueryClient();
  const userId = useUserId();
  const { getRandomCharacters, updateCharacterAffinities } =
    useCharacterActions();

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

      // Affinity 업데이트 결정 (댓글 단 캐릭터만)
      const affinityUpdates = commentCharacters
        .map((char) => {
          // 기본 확률 50%
          let probability = 0.5;

          // 현재 affinity에 따라 확률 조정
          const currentAffinity = char.affinity || 0;
          if (currentAffinity > 30) probability = 0.1;
          else if (currentAffinity > 20) probability = 0.2;
          else if (currentAffinity > 10) probability = 0.3;

          const shouldIncrement = Math.random() < probability;

          return shouldIncrement
            ? { characterId: char.id, increment: 1 }
            : null;
        })
        .filter(Boolean);

      // 비동기로 affinity 업데이트 (포스트 저장과 별개로 처리)
      if (affinityUpdates.length > 0) {
        updateCharacterAffinities(affinityUpdates)
          .then((results) => {
            const successResults = results.filter((r) => r.success !== false);
            const successCount = successResults.length;

            // console.log(
            //   `✅ Affinity 업데이트: ${successCount}/${affinityUpdates.length} 성공`
            // );

            // Toast 표시
            // console.log("success: ", successResults);
            // console.log("comment: ", commentCharacters);
            // console.log("affinity: ", affinityUpdates);
            if (successCount > 0) {
              showAffinityToast(
                successResults,
                commentCharacters,
                affinityUpdates
              );
            }
          })
          .catch((error) => {
            console.error("❌ Affinity 업데이트 실패:", error);
          });
      }

      return {
        tempId,
        savedPost,
      };
    },
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      const previousData = queryClient.getQueryData(["posts", userId]);

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
        user_id: userId,
        isLoading: true,
      };

      const isEmptyCache = !previousData;

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

      return { tempId, previousData, isEmptyCache };
    },

    onSuccess: async (data, variables, context) => {
      const savedPostId = data.savedPost.id;

      incrementNotification();

      // 첫 번째 setQueryData는 이미 잘 작성됨
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page, pageIndex) => {
          if (pageIndex !== 0) return page;

          const updatedPosts = page.posts.map((post) => {
            if (post.id === context.tempId) {
              return {
                ...data.savedPost,
                isLoading: false,
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

      // 캐시가 비어있었다면, 기존 posts를 fetch
      if (context.isEmptyCache) {
        setTimeout(async () => {
          try {
            const result = await fetchPostsWithCommentsAndLikes(userId, {
              limit: POSTS_PER_PAGE,
              cursor: null,
            });

            // 두 번째 setQueryData - map으로 개선
            queryClient.setQueryData(["posts", userId], (old) => {
              if (!old) return old;

              const filteredPosts = result.posts.filter(
                (post) => post.id !== savedPostId
              );

              // map을 사용하여 불변성 유지
              const newPages = old.pages.map((page, pageIndex) => {
                if (pageIndex !== 0) return page;

                const savedPost = page.posts.find(
                  (post) => post.id === savedPostId
                );

                if (savedPost) {
                  return {
                    posts: [savedPost, ...filteredPosts],
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  };
                } else {
                  return {
                    posts: [...page.posts, ...filteredPosts],
                    nextCursor: result.nextCursor,
                    hasMore: result.hasMore,
                  };
                }
              });

              return {
                ...old,
                pages: newPages,
              };
            });
          } catch (error) {
            console.error("Error fetching existing posts:", error);
          }
        }, 100);
      }

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      // 다른 페이지에서 작성한 경우 Home으로 이동
      if (location.pathname !== "/") {
        navigate("/");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", userId], context.previousData);
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
