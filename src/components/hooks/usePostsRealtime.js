// hooks/usePostsRealtime.js
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import supabase from "../../services/supabaseClient";
import { useUserId } from "../../stores/userStore";

export const usePostsRealtime = (posts) => {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!posts || posts.length === 0 || !userId) return;

    // 이전 구독 정리
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // 유효한 posts만 필터링 (최대 10개)
    const validPosts = posts
      .filter((post) => post.id && !post.isTemp && !post.isLoading)
      .slice(0, 10);

    // 각 post에 대해 구독 설정
    validPosts.forEach((post) => {
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
            // 새 댓글 처리
            const comment = payload.new;

            // Character 정보 가져오기
            let enrichedComment = { ...comment };

            if (comment.character_id) {
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
                  affinity: data.User_Character?.[0]?.affinity || 0,
                  isLikedByUser: false,
                  like: 0,
                };
              }
            } else if (comment.user_id) {
              // 사용자 댓글
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
            }

            // 캐시 업데이트
            queryClient.setQueryData(["posts", userId], (old) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  posts: page.posts.map((p) => {
                    if (p.id === post.id) {
                      // 중복 체크
                      if (p.Comment?.some((c) => c.id === comment.id)) return p;

                      return {
                        ...p,
                        Comment: [
                          ...(p.Comment || []),
                          {
                            ...enrichedComment,
                            animateIn: true, // 애니메이션용
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
            // 새 좋아요 처리
            const like = payload.new;

            // Character 정보 가져오기
            const { data } = await supabase
              .from("Character")
              .select("*, User_Character!inner(affinity)")
              .eq("id", like.character_id)
              .eq("User_Character.user_id", userId)
              .single();

            const enrichedLike = data
              ? {
                  character_id: like.character_id,
                  character: data.name,
                  avatar_url: data.avatar_url,
                  affinity: data.User_Character?.[0]?.affinity || 0,
                }
              : like;

            // 캐시 업데이트
            queryClient.setQueryData(["posts", userId], (old) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  posts: page.posts.map((p) => {
                    if (p.id === post.id) {
                      // 중복 체크
                      if (
                        p.Post_Like?.some(
                          (l) => l.character_id === like.character_id
                        )
                      )
                        return p;

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
        .subscribe();

      channelsRef.current.push(channel);
    });

    // Cleanup
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [posts?.map((p) => p.id).join(","), userId, queryClient]);

  return {
    isActive: channelsRef.current.length > 0,
  };
};
