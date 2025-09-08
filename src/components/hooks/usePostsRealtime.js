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
import { useFollowedCharacterIds } from "../../stores/characterStore";

export const usePostsRealtime = (posts) => {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const followedCharacterIds = useFollowedCharacterIds();

  // Map 구조: postId -> {channel, timer, subscribedAt, lastActivityAt, activityCount}
  const subscriptionsRef = useRef(new Map());

  // 구독이 필요한 포스트 필터링
  const getPostsNeedingSubscription = (posts) => {
    if (!posts || !userId) return [];

    // Phase 1: 팔로우한 캐릭터 체크 (가장 먼저)
    if (followedCharacterIds.size === 0) {
      console.log("⚡ No followed characters - skipping ALL subscriptions");
      return [];
    }

    console.log(`✅ Found ${followedCharacterIds.size} followed characters`);

    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    const eligiblePosts = [];

    posts.forEach((post) => {
      // 기본 유효성 체크
      if (!post.id || post.isTemp) {
        return;
      }

      // 이미 구독 중이면 스킵
      if (subscriptionsRef.current.has(post.id)) {
        return;
      }

      // Phase 1: AI 댓글 비활성화 체크
      if (post.allow_ai_comments === false) {
        console.log(`🚫 Post ${post.id}: AI comments disabled`);
        return;
      }

      // 시간 조건 체크
      const isRecent = now - new Date(post.created_at) < FIVE_MINUTES;
      const recentlyUpdated =
        post.updated_at &&
        now - new Date(post.updated_at) < FIVE_MINUTES &&
        post.updated_at !== post.created_at;

      if (!isRecent && !recentlyUpdated) {
        return;
      }

      // AI 활동량 체크
      const aiCommentCount =
        post.Comment?.filter((c) => c.character_id !== null).length || 0;
      const aiLikeCount =
        post.Post_Like?.filter((l) => l.character_id !== null).length || 0;
      const totalAIActivity = aiCommentCount + aiLikeCount;

      if (totalAIActivity >= 5) {
        console.log(
          `✓ Post ${post.id}: Already has enough AI activity (${totalAIActivity})`
        );
        return;
      }

      // Phase 2: 우선순위 계산
      const priority = calculatePriority(post, followedCharacterIds.size);

      eligiblePosts.push({ post, priority });
    });

    // 우선순위 정렬 후 상위 5개만 반환
    return eligiblePosts
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map((item) => item.post);
  };

  // Phase 2: 우선순위 계산 시스템
  const calculatePriority = (post, followedCount) => {
    let priority = 0;
    const now = Date.now();

    // 1. 시간 가중치 (최신일수록 높음)
    const ageMinutes = (now - new Date(post.created_at)) / (60 * 1000);
    priority += Math.max(0, 5 - ageMinutes); // 0-5점

    // 2. 팔로우 수 가중치
    priority += Math.min(followedCount, 10) * 0.5; // 최대 5점

    // 3. 기존 AI 활동 역가중치 (적을수록 우선순위 높음)
    const aiActivity =
      (post.Comment?.filter((c) => c.character_id !== null).length || 0) +
      (post.Post_Like?.filter((l) => l.character_id !== null).length || 0);
    priority += Math.max(0, 5 - aiActivity); // 0-5점

    // 4. 수정된 포스트 보너스
    if (post.updated_at && post.updated_at !== post.created_at) {
      priority += 2;
    }

    return priority;
  };

  // 구독 해제가 필요한 포스트 확인
  const getPostsToUnsubscribe = (currentPosts) => {
    const postsToUnsubscribe = [];
    const now = Date.now();

    // Phase 2: 동적 시간 조정
    const baseTimeout =
      followedCharacterIds.size > 5 ? 4 * 60 * 1000 : 3 * 60 * 1000;
    const INACTIVITY_THRESHOLD =
      followedCharacterIds.size > 3 ? 45 * 1000 : 30 * 1000;

    subscriptionsRef.current.forEach((subscription, postId) => {
      const post = currentPosts?.find((p) => p.id === postId);

      // 포스트가 목록에서 사라짐
      if (!post) {
        postsToUnsubscribe.push(postId);
        return;
      }

      // Phase 1: 팔로우가 0이 되면 즉시 해제
      if (followedCharacterIds.size === 0) {
        console.log(
          `⚡ No followers - immediately unsubscribing from ${postId}`
        );
        postsToUnsubscribe.push(postId);
        return;
      }

      // 절대 타임아웃
      const isExpired = now - subscription.subscribedAt > baseTimeout;

      // 활동 기반 완료 판단
      const inactiveDuration = now - subscription.lastActivityAt;
      const hasBeenInactive = inactiveDuration > INACTIVITY_THRESHOLD;

      // AI 활동 수 계산
      const aiCommentCount =
        post.Comment?.filter((c) => c.character_id !== null).length || 0;
      const aiLikeCount =
        post.Post_Like?.filter((l) => l.character_id !== null).length || 0;
      const totalAIActivity = aiCommentCount + aiLikeCount;

      // Phase 2: 지능형 완료 판단
      const activityPerMinute =
        subscription.activityCount /
        ((now - subscription.subscribedAt) / 60000);
      const seemsDead = activityPerMinute < 0.5 && hasBeenInactive;

      // 충분한 활동 또는 활동 정체
      const seemsComplete =
        (totalAIActivity >= 5 && hasBeenInactive) ||
        (totalAIActivity >= 3 && inactiveDuration > 60000) ||
        seemsDead;

      // AI 댓글이 비활성화됨
      const aiDisabled = post.allow_ai_comments === false;

      if (isExpired || seemsComplete || aiDisabled) {
        console.log(`📊 Unsubscribe decision - Post ${postId}:`, {
          reason: isExpired ? "timeout" : aiDisabled ? "disabled" : "complete",
          activity: totalAIActivity,
          activityRate: activityPerMinute.toFixed(2),
          inactive: `${(inactiveDuration / 1000).toFixed(0)}s`,
        });
        postsToUnsubscribe.push(postId);
      }
    });

    return postsToUnsubscribe;
  };

  // 개별 포스트 구독
  const subscribeToPost = (post) => {
    if (subscriptionsRef.current.has(post.id)) return;

    console.log(
      `🔔 Subscribing to post: ${post.id} (${followedCharacterIds.size} followers)`
    );

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

          // 현재 사용자의 댓글은 무시
          if (comment.user_id === userId) {
            console.log(`⭕ Skipping user's own comment for post ${post.id}`);
            return;
          }

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
                `💬 AI comment from ${data?.name} for post ${post.id}`
              );
            } catch (error) {
              console.error("Error fetching character:", error);
            }
          } else if (comment.user_id) {
            // 다른 사용자의 댓글 (public 포스트에서만 가능)
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

              console.log(
                `💬 User comment received from another user for post ${post.id}`
              );
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
          console.log(`✅ Subscribed to post ${post.id}`);
        } else if (error) {
          console.error(`❌ Failed to subscribe to post ${post.id}:`, error);
        }
      });

    // 동적 타임아웃 설정
    const timeout =
      followedCharacterIds.size > 5 ? 4 * 60 * 1000 : 3 * 60 * 1000;
    const timer = setTimeout(() => {
      console.log(`⏰ Auto-unsubscribing from post ${post.id} (timeout)`);
      unsubscribeFromPost(post.id);
    }, timeout);

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
      `📕 Unsubscribing from post: ${postId} (활동: ${subscription.activityCount}개)`
    );

    clearTimeout(subscription.timer);
    supabase.removeChannel(subscription.channel);
    subscriptionsRef.current.delete(postId);
  };

  // Phase 2: 팔로우 상태 변경 감지
  useEffect(() => {
    // 팔로우가 0이 되면 모든 구독 해제
    if (followedCharacterIds.size === 0 && subscriptionsRef.current.size > 0) {
      console.log("⚡ No followers detected - clearing all subscriptions");
      subscriptionsRef.current.forEach((_, postId) => {
        unsubscribeFromPost(postId);
      });
      return;
    }

    // 팔로우가 0에서 1+로 변경되면 재평가
    if (followedCharacterIds.size > 0 && posts && posts.length > 0) {
      const eligiblePosts = getPostsNeedingSubscription(posts);
      eligiblePosts.forEach((post) => subscribeToPost(post));
    }
  }, [followedCharacterIds.size]);

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
  }, [posts, userId]);

  // Cleanup
  useEffect(() => {
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
