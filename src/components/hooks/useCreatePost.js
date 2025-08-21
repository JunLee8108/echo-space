// // hooks/useCreatePost.js
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useCharacterActions } from "../../stores/characterStore";
// import { useUserId } from "../../stores/userStore";
// import { incrementNotification } from "../../stores/notificationStore";
// import {
//   savePostWithCommentsAndLikes,
//   fetchPostsWithCommentsAndLikes,
// } from "../../services/postService";
// import { fetchAIComment } from "../../services/openaiService";
// import { processContentImages } from "../../services/imageService";
// import { showAffinityToast } from "../utils/toastUtils";

// // 페이지당 포스트 개수
// const POSTS_PER_PAGE = 5;

// export const useCreatePost = (options = {}) => {
//   const queryClient = useQueryClient();
//   const userId = useUserId();
//   const { getRandomCharacters, updateCharacterAffinities } =
//     useCharacterActions();

//   return useMutation({
//     mutationFn: async (post) => {
//       const tempId = `temp-${Date.now()}-${Math.random()}`;

//       try {
//         // 1. 콘텐츠의 base64 이미지를 URL로 변환
//         let processedContent = post.content;

//         if (post.content && post.content.includes("data:image")) {
//           console.log("🖼️ Processing images in content...");

//           // 진행 상황 추적 (옵션)
//           processedContent = await processContentImages(
//             post.content,
//             userId,
//             (progress) => {
//               console.log(
//                 `📤 Image upload progress: ${progress.current}/${progress.total} - ${progress.status}`
//               );
//             }
//           );

//           console.log("✅ Images processed successfully");
//         }

//         // 2. 처리된 콘텐츠로 post 객체 업데이트
//         const processedPost = {
//           ...post,
//           content: processedContent,
//         };

//         // 3. 랜덤 캐릭터 선택
//         const commentCharacters = getRandomCharacters(2);
//         const likeCharacters = getRandomCharacters(
//           Math.floor(Math.random() * 5) + 1
//         );

//         // 4. AI 댓글 생성 (처리된 콘텐츠 사용)
//         const comments = await Promise.all(
//           commentCharacters.map(async (char) => {
//             const reply = await fetchAIComment(
//               char,
//               processedPost.content, // 처리된 콘텐츠 사용
//               processedPost.hashtags || [],
//               processedPost.mood || null
//             );
//             return {
//               character: char,
//               message: reply,
//             };
//           })
//         );

//         // 5. DB에 저장 (이미지 URL이 포함된 콘텐츠)
//         const savedPost = await savePostWithCommentsAndLikes(
//           processedPost, // 처리된 post 전달
//           comments,
//           likeCharacters,
//           processedPost.hashtags || []
//         );

//         // 6. Affinity 업데이트 결정 (댓글 단 캐릭터만)
//         const affinityUpdates = commentCharacters
//           .map((char) => {
//             // 기본 확률 50%
//             let probability = 0.5;

//             // 현재 affinity에 따라 확률 조정
//             const currentAffinity = char.affinity || 0;
//             if (currentAffinity > 30) probability = 0.1;
//             else if (currentAffinity > 20) probability = 0.2;
//             else if (currentAffinity > 10) probability = 0.3;

//             const shouldIncrement = Math.random() < probability;

//             return shouldIncrement
//               ? { characterId: char.id, increment: 1 }
//               : null;
//           })
//           .filter(Boolean);

//         // 7. 비동기로 affinity 업데이트 (포스트 저장과 별개로 처리)
//         if (affinityUpdates.length > 0) {
//           updateCharacterAffinities(affinityUpdates)
//             .then((results) => {
//               const successResults = results.filter((r) => r.success !== false);
//               const successCount = successResults.length;

//               if (successCount > 0) {
//                 showAffinityToast(
//                   successResults,
//                   commentCharacters,
//                   affinityUpdates
//                 );
//               }
//             })
//             .catch((error) => {
//               console.error("❌ Affinity 업데이트 실패:", error);
//             });
//         }

//         return {
//           tempId,
//           savedPost,
//         };
//       } catch (error) {
//         console.error("❌ Post creation failed:", error);
//         throw error;
//       }
//     },

//     onMutate: async (post) => {
//       await queryClient.cancelQueries({ queryKey: ["posts", userId] });

//       const previousData = queryClient.getQueryData(["posts", userId]);

//       const tempId = `temp-${Date.now()}-${Math.random()}`;

//       // 낙관적 업데이트 - base64 그대로 표시 (빠른 UI 반응)
//       const optimisticPost = {
//         ...post,
//         id: tempId,
//         mood: post.mood || null,
//         Comment: [],
//         Post_Like: [],
//         Post_Hashtag:
//           post.hashtags?.map((tag) => ({
//             hashtag_id: `temp-${tag}`,
//             name: tag,
//           })) || [],
//         like: 0,
//         created_at: new Date().toISOString(),
//         user_id: userId,
//         isLoading: true,
//       };

//       const isEmptyCache = !previousData;

//       queryClient.setQueryData(["posts", userId], (old) => {
//         if (!old) {
//           return {
//             pages: [
//               {
//                 posts: [optimisticPost],
//                 nextCursor: null,
//                 hasMore: false,
//               },
//             ],
//             pageParams: [null],
//           };
//         }

//         const newPages = [...old.pages];
//         if (!newPages[0]) {
//           newPages[0] = {
//             posts: [],
//             nextCursor: null,
//             hasMore: false,
//           };
//         }

//         newPages[0] = {
//           ...newPages[0],
//           posts: [optimisticPost, ...(newPages[0].posts || [])],
//         };

//         return {
//           ...old,
//           pages: newPages,
//         };
//       });

//       return { tempId, previousData, isEmptyCache };
//     },

//     onSuccess: async (data, variables, context) => {
//       const savedPostId = data.savedPost.id;

//       incrementNotification();

//       // 실제 저장된 데이터로 캐시 업데이트 (URL로 변환된 이미지 포함)
//       queryClient.setQueryData(["posts", userId], (old) => {
//         if (!old) return old;

//         const newPages = old.pages.map((page, pageIndex) => {
//           if (pageIndex !== 0) return page;

//           const updatedPosts = page.posts.map((post) => {
//             if (post.id === context.tempId) {
//               return {
//                 ...data.savedPost,
//                 isLoading: false,
//               };
//             }
//             return post;
//           });

//           return {
//             ...page,
//             posts: updatedPosts,
//           };
//         });

//         return {
//           ...old,
//           pages: newPages,
//         };
//       });

//       // 캐시가 비어있었다면, 기존 posts를 fetch
//       if (context.isEmptyCache) {
//         setTimeout(async () => {
//           try {
//             const result = await fetchPostsWithCommentsAndLikes(userId, {
//               limit: POSTS_PER_PAGE,
//               cursor: null,
//             });

//             queryClient.setQueryData(["posts", userId], (old) => {
//               if (!old) return old;

//               const filteredPosts = result.posts.filter(
//                 (post) => post.id !== savedPostId
//               );

//               const newPages = old.pages.map((page, pageIndex) => {
//                 if (pageIndex !== 0) return page;

//                 const savedPost = page.posts.find(
//                   (post) => post.id === savedPostId
//                 );

//                 if (savedPost) {
//                   return {
//                     posts: [savedPost, ...filteredPosts],
//                     nextCursor: result.nextCursor,
//                     hasMore: result.hasMore,
//                   };
//                 } else {
//                   return {
//                     posts: [...page.posts, ...filteredPosts],
//                     nextCursor: result.nextCursor,
//                     hasMore: result.hasMore,
//                   };
//                 }
//               });

//               return {
//                 ...old,
//                 pages: newPages,
//               };
//             });
//           } catch (error) {
//             console.error("Error fetching existing posts:", error);
//           }
//         }, 100);
//       }

//       if (options.onSuccess) {
//         options.onSuccess(data);
//       }
//     },

//     onError: (error, variables, context) => {
//       if (context?.previousData) {
//         queryClient.setQueryData(["posts", userId], context.previousData);
//       }
//       console.error("Error creating post:", error);

//       if (options.onError) {
//         options.onError(error);
//       } else {
//         // 구체적인 에러 메시지 제공
//         let errorMessage = "포스트 작성 중 오류가 발생했습니다.";

//         if (error.message?.includes("exceeds maximum allowed size")) {
//           errorMessage =
//             "이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 사용해주세요.";
//         } else if (error.message?.includes("Image upload")) {
//           errorMessage = "이미지 업로드에 실패했습니다. 다시 시도해주세요.";
//         }

//         alert(errorMessage);
//       }
//     },
//   });
// };

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
          console.log("🖼️ Processing images in content...");

          processedContent = await processContentImages(
            post.content,
            userId,
            (progress) => {
              console.log(
                `📤 Image upload progress: ${progress.current}/${progress.total} - ${progress.status}`
              );
            }
          );

          console.log("✅ Images processed successfully");
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
