// // hooks/usePostsRealtime.js
// import { useEffect, useRef } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import supabase from "../../services/supabaseClient";
// import { useUserId } from "../../stores/userStore";

// export const usePostsRealtime = (posts) => {
//   const queryClient = useQueryClient();
//   const userId = useUserId();
//   const channelsRef = useRef([]);

//   useEffect(() => {
//     if (!posts || posts.length === 0 || !userId) return;

//     // 이전 구독 정리
//     channelsRef.current.forEach((channel) => {
//       supabase.removeChannel(channel);
//     });
//     channelsRef.current = [];

//     // 유효한 posts만 필터링 (최대 10개)
//     const validPosts = posts
//       .filter((post) => post.id && !post.isTemp && !post.isLoading)
//       .slice(0, 10);

//     // 각 post에 대해 구독 설정
//     validPosts.forEach((post) => {
//       const channel = supabase
//         .channel(`post-${post.id}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "Comment",
//             filter: `post_id=eq.${post.id}`,
//           },
//           async (payload) => {
//             // 새 댓글 처리
//             const comment = payload.new;

//             // Character 정보 가져오기
//             let enrichedComment = { ...comment };

//             if (comment.character_id) {
//               const { data } = await supabase
//                 .from("Character")
//                 .select("*, User_Character!inner(affinity)")
//                 .eq("id", comment.character_id)
//                 .eq("User_Character.user_id", userId)
//                 .single();

//               if (data) {
//                 enrichedComment = {
//                   ...comment,
//                   character: data.name,
//                   avatar_url: data.avatar_url,
//                   personality: data.personality,
//                   description: data.description,
//                   affinity: data.User_Character?.[0]?.affinity || 0,
//                   isLikedByUser: false,
//                   like: 0,
//                 };
//               }
//             } else if (comment.user_id) {
//               // 사용자 댓글
//               const { data } = await supabase
//                 .from("User_Profile")
//                 .select("display_name")
//                 .eq("id", comment.user_id)
//                 .single();

//               enrichedComment = {
//                 ...comment,
//                 isUserComment: true,
//                 character: data?.display_name || "User",
//                 avatar_url: null,
//                 isLikedByUser: false,
//                 like: 0,
//               };
//             }

//             // 캐시 업데이트
//             queryClient.setQueryData(["posts", userId], (old) => {
//               if (!old) return old;

//               return {
//                 ...old,
//                 pages: old.pages.map((page) => ({
//                   ...page,
//                   posts: page.posts.map((p) => {
//                     if (p.id === post.id) {
//                       // 중복 체크
//                       if (p.Comment?.some((c) => c.id === comment.id)) return p;

//                       return {
//                         ...p,
//                         Comment: [
//                           ...(p.Comment || []),
//                           {
//                             ...enrichedComment,
//                             animateIn: true, // 애니메이션용
//                           },
//                         ].sort((a, b) => {
//                           if (b.like !== a.like) return b.like - a.like;
//                           return a.id - b.id;
//                         }),
//                       };
//                     }
//                     return p;
//                   }),
//                 })),
//               };
//             });
//           }
//         )
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "Post_Like",
//             filter: `post_id=eq.${post.id}`,
//           },
//           async (payload) => {
//             // 새 좋아요 처리
//             const like = payload.new;

//             // Character 정보 가져오기
//             const { data } = await supabase
//               .from("Character")
//               .select("*, User_Character!inner(affinity)")
//               .eq("id", like.character_id)
//               .eq("User_Character.user_id", userId)
//               .single();

//             const enrichedLike = data
//               ? {
//                   character_id: like.character_id,
//                   character: data.name,
//                   avatar_url: data.avatar_url,
//                   affinity: data.User_Character?.[0]?.affinity || 0,
//                 }
//               : like;

//             // 캐시 업데이트
//             queryClient.setQueryData(["posts", userId], (old) => {
//               if (!old) return old;

//               return {
//                 ...old,
//                 pages: old.pages.map((page) => ({
//                   ...page,
//                   posts: page.posts.map((p) => {
//                     if (p.id === post.id) {
//                       // 중복 체크
//                       if (
//                         p.Post_Like?.some(
//                           (l) => l.character_id === like.character_id
//                         )
//                       )
//                         return p;

//                       return {
//                         ...p,
//                         like: (p.like || 0) + 1,
//                         Post_Like: [...(p.Post_Like || []), enrichedLike],
//                       };
//                     }
//                     return p;
//                   }),
//                 })),
//               };
//             });
//           }
//         )
//         .subscribe();

//       channelsRef.current.push(channel);
//     });

//     // Cleanup
//     return () => {
//       channelsRef.current.forEach((channel) => {
//         supabase.removeChannel(channel);
//       });
//       channelsRef.current = [];
//     };
//   }, [posts?.map((p) => p.id).join(","), userId, queryClient]);

//   return {
//     isActive: channelsRef.current.length > 0,
//   };
// };

// hooks/usePostsRealtime.js
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import supabase from "../../services/supabaseClient";
import { useUserId } from "../../stores/userStore";

export const usePostsRealtime = (posts) => {
  const queryClient = useQueryClient();
  const userId = useUserId();

  // Map 구조: postId -> {channel, timer, subscribedAt, lastActivityAt, activityCount}
  const subscriptionsRef = useRef(new Map());

  // 구독이 필요한 포스트 필터링
  const getPostsNeedingSubscription = (posts) => {
    if (!posts || !userId) return [];

    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    return posts
      .filter((post) => {
        // 기본 유효성 체크
        if (!post.id || post.isTemp) return false;

        // 이미 구독 중이면 스킵
        if (subscriptionsRef.current.has(post.id)) return false;

        // AI 댓글이 비활성화된 포스트 제외
        if (post.allow_ai_comments === false) return false;

        // 구독 조건:
        // 1. 5분 이내 생성된 포스트
        const isRecent = now - new Date(post.created_at) < FIVE_MINUTES;

        // 2. AI 활동이 아직 충분하지 않은 포스트
        const aiCommentCount =
          post.Comment?.filter((c) => c.character_id !== null).length || 0;
        const aiLikeCount =
          post.Post_Like?.filter((l) => l.character_id !== null).length || 0;
        const totalAIActivity = aiCommentCount + aiLikeCount;
        const needsMoreActivity = totalAIActivity < 5; // 평균 예상 활동 수

        // 3. 최근 수정되었고 AI 활동이 부족한 경우
        const recentlyUpdated =
          post.updated_at &&
          now - new Date(post.updated_at) < FIVE_MINUTES &&
          post.updated_at !== post.created_at;

        return (isRecent || recentlyUpdated) && needsMoreActivity;
      })
      .slice(0, 5); // 최대 5개만 동시 구독
  };

  // 구독 해제가 필요한 포스트 확인
  const getPostsToUnsubscribe = (currentPosts) => {
    const postsToUnsubscribe = [];
    const now = Date.now();
    const MAX_SUBSCRIPTION_TIME = 3 * 60 * 1000; // 3분
    const INACTIVITY_THRESHOLD = 30 * 1000; // 30초

    subscriptionsRef.current.forEach((subscription, postId) => {
      const post = currentPosts?.find((p) => p.id === postId);

      // 포스트가 목록에서 사라짐
      if (!post) {
        postsToUnsubscribe.push(postId);
        return;
      }

      // 1. 절대 타임아웃 (3분 경과)
      const isExpired = now - subscription.subscribedAt > MAX_SUBSCRIPTION_TIME;

      // 2. 활동 기반 완료 판단
      const inactiveDuration = now - subscription.lastActivityAt;
      const hasBeenInactive = inactiveDuration > INACTIVITY_THRESHOLD;

      // AI 활동 수 계산
      const aiCommentCount =
        post.Comment?.filter((c) => c.character_id !== null).length || 0;
      const aiLikeCount =
        post.Post_Like?.filter((l) => l.character_id !== null).length || 0;
      const totalAIActivity = aiCommentCount + aiLikeCount;

      // 충분한 활동(5개 이상) + 30초 비활성 = 완료
      const seemsComplete = totalAIActivity >= 5 && hasBeenInactive;

      // 또는 적어도 2개의 댓글과 일부 좋아요를 받고 30초 경과
      const hasMinimumActivity =
        aiCommentCount >= 2 && totalAIActivity >= 3 && hasBeenInactive;

      // 3. AI 댓글이 비활성화됨
      const aiDisabled = post.allow_ai_comments === false;

      if (isExpired || seemsComplete || hasMinimumActivity || aiDisabled) {
        console.log(`📊 구독 해제 판단 - Post ${postId}:`, {
          expired: isExpired,
          complete: seemsComplete,
          minimum: hasMinimumActivity,
          disabled: aiDisabled,
          activity: totalAIActivity,
          inactive: `${inactiveDuration / 1000}초`,
        });
        postsToUnsubscribe.push(postId);
      }
    });

    return postsToUnsubscribe;
  };

  // 개별 포스트 구독
  const subscribeToPost = (post) => {
    if (subscriptionsRef.current.has(post.id)) return;

    console.log(`🔔 Subscribing to post: ${post.id}`);

    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Comment",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          const comment = payload.new;

          // 활동 기록 업데이트
          const subscription = subscriptionsRef.current.get(post.id);
          if (subscription) {
            subscription.lastActivityAt = Date.now();
            subscription.activityCount++;
          }

          // 중복 체크
          const currentData = queryClient.getQueryData(["posts", userId]);
          const isDuplicate = currentData?.pages?.some((page) =>
            page.posts.some(
              (p) =>
                p.id === post.id && p.Comment?.some((c) => c.id === comment.id)
            )
          );

          if (isDuplicate) {
            console.log(`⚠️ Duplicate comment detected for post ${post.id}`);
            return;
          }

          // 댓글 데이터 보강
          let enrichedComment = { ...comment };

          if (comment.character_id) {
            try {
              const { data } = await supabase
                .from("Character")
                .select("*, User_Character!inner(affinity)")
                .eq("id", comment.character_id)
                .eq("User_Character.user_id", userId)
                .single();

              if (data) {
                enrichedComment = {
                  ...comment,
                  character: data.name,
                  avatar_url: data.avatar_url,
                  personality: data.personality,
                  description: data.description,
                  korean_description: data.korean_description,
                  affinity: data.User_Character?.[0]?.affinity || 0,
                  isLikedByUser: false,
                  like: 0,
                };
              }

              console.log(
                `💬 AI comment received from ${data?.name} for post ${post.id}`
              );
            } catch (error) {
              console.error("Error fetching character:", error);
            }
          } else if (comment.user_id) {
            try {
              const { data } = await supabase
                .from("User_Profile")
                .select("display_name")
                .eq("id", comment.user_id)
                .single();

              enrichedComment = {
                ...comment,
                isUserComment: true,
                character: data?.display_name || "User",
                avatar_url: null,
                isLikedByUser: false,
                like: 0,
              };
            } catch (error) {
              console.error("Error fetching user:", error);
            }
          }

          // React Query 캐시 업데이트
          queryClient.setQueryData(["posts", userId], (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                posts: page.posts.map((p) => {
                  if (p.id === post.id) {
                    return {
                      ...p,
                      Comment: [
                        ...(p.Comment || []),
                        {
                          ...enrichedComment,
                          animateIn: true,
                        },
                      ].sort((a, b) => {
                        if (b.like !== a.like) return b.like - a.like;
                        return a.id - b.id;
                      }),
                    };
                  }
                  return p;
                }),
              })),
            };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Post_Like",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          const like = payload.new;

          // 활동 기록 업데이트
          const subscription = subscriptionsRef.current.get(post.id);
          if (subscription) {
            subscription.lastActivityAt = Date.now();
            subscription.activityCount++;
          }

          // 중복 체크
          const currentData = queryClient.getQueryData(["posts", userId]);
          const isDuplicate = currentData?.pages?.some((page) =>
            page.posts.some(
              (p) =>
                p.id === post.id &&
                p.Post_Like?.some((l) => l.character_id === like.character_id)
            )
          );

          if (isDuplicate) {
            console.log(`⚠️ Duplicate like detected for post ${post.id}`);
            return;
          }

          // 좋아요 데이터 보강
          let enrichedLike = like;

          try {
            const { data } = await supabase
              .from("Character")
              .select("*, User_Character!inner(affinity)")
              .eq("id", like.character_id)
              .eq("User_Character.user_id", userId)
              .single();

            if (data) {
              enrichedLike = {
                character_id: like.character_id,
                character: data.name,
                avatar_url: data.avatar_url,
                affinity: data.User_Character?.[0]?.affinity || 0,
                korean_description: data.korean_description,
              };

              console.log(
                `❤️ Like received from ${data.name} for post ${post.id}`
              );
            }
          } catch (error) {
            console.error("Error fetching character for like:", error);
          }

          // React Query 캐시 업데이트
          queryClient.setQueryData(["posts", userId], (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                posts: page.posts.map((p) => {
                  if (p.id === post.id) {
                    return {
                      ...p,
                      like: (p.like || 0) + 1,
                      Post_Like: [...(p.Post_Like || []), enrichedLike],
                    };
                  }
                  return p;
                }),
              })),
            };
          });
        }
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Successfully subscribed to post ${post.id}`);
        } else if (error) {
          console.error(`❌ Failed to subscribe to post ${post.id}:`, error);
        }
      });

    // 최대 시간 타이머 (3분)
    const timer = setTimeout(() => {
      console.log(`⏰ Auto-unsubscribing from post ${post.id} (max timeout)`);
      unsubscribeFromPost(post.id);
    }, 3 * 60 * 1000);

    // 구독 정보 저장
    subscriptionsRef.current.set(post.id, {
      channel,
      timer,
      subscribedAt: Date.now(),
      lastActivityAt: Date.now(),
      activityCount: 0,
    });
  };

  // 개별 포스트 구독 해제
  const unsubscribeFromPost = (postId) => {
    const subscription = subscriptionsRef.current.get(postId);
    if (!subscription) return;

    console.log(
      `🔕 Unsubscribing from post: ${postId} (활동: ${subscription.activityCount}개)`
    );

    clearTimeout(subscription.timer);
    supabase.removeChannel(subscription.channel);
    subscriptionsRef.current.delete(postId);
  };

  // 메인 Effect
  useEffect(() => {
    if (!posts || posts.length === 0 || !userId) return;

    // 1. 새로 구독할 포스트 찾기
    const postsToSubscribe = getPostsNeedingSubscription(posts);

    // 2. 구독 해제할 포스트 찾기
    const postsToUnsubscribe = getPostsToUnsubscribe(posts);

    // 3. 새 구독 추가
    postsToSubscribe.forEach((post) => {
      subscribeToPost(post);
    });

    // 4. 만료된 구독 해제
    postsToUnsubscribe.forEach((postId) => {
      unsubscribeFromPost(postId);
    });

    // 디버깅 로그
    if (subscriptionsRef.current.size > 0) {
      console.log(
        `📡 Active subscriptions: ${subscriptionsRef.current.size}`,
        Array.from(subscriptionsRef.current.keys())
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, userId]);

  // Cleanup
  useEffect(() => {
    // ref를 로컬 변수에 복사 (권장)
    const subscriptions = subscriptionsRef.current;

    return () => {
      console.log("🧹 Cleaning up all subscriptions");
      subscriptions.forEach((subscription) => {
        clearTimeout(subscription.timer);
        supabase.removeChannel(subscription.channel);
      });
      subscriptions.clear();
    };
  }, []);

  return {
    isActive: subscriptionsRef.current.size > 0,
    subscribedCount: subscriptionsRef.current.size,
    subscribedPostIds: Array.from(subscriptionsRef.current.keys()),
  };
};
