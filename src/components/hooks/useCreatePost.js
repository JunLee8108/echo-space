// hooks/useCreatePost.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";
import { useCharacters } from "./useCharacters";
import { savePostWithCommentsAndLikes } from "../../services/postService";
import { fetchAIComment } from "../../services/openaiService";

export const useCreatePost = (user, options = {}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
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
          const reply = await fetchAIComment(char, post.content);
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
          })) || [], // 임시 해시태그 표시
        like: 0,
        created_at: new Date().toISOString(),
        user_id: user.id,
        isLoading: true,
      };

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

      return { tempId, previousData };
    },
    onSuccess: (data, variables, context) => {
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

      // Profile 페이지에서 작성한 경우 Home으로 이동
      if (location.pathname === "/profile") {
        navigate("/");
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
