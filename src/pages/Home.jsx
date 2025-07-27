import { useState, useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Smile, Meh, Frown } from "lucide-react";

// Modal
import ConfirmationModal from "../components/UI/ConfirmationModal";
import ProfileModal from "../components/UI/ProfileModal";

import PostForm from "../components/PostForm";
import { useCharacters } from "../components/hooks/useCharacters";
import { fetchAIComment } from "../services/openaiService";
import {
  savePostWithCommentsAndLikes,
  deletePostById,
  fetchPostsWithCommentsAndLikes,
} from "../services/postService";
import "./Home.css";

// 페이지당 포스트 개수
const POSTS_PER_PAGE = 5;

const MOODS = {
  happy: {
    icon: Smile,
    label: "Happy",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  neutral: {
    icon: Meh,
    label: "Neutral",
    color: "text-stone-500",
    bgColor: "bg-stone-50",
  },
  sad: {
    icon: Frown,
    label: "Sad",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
};

const Home = ({ user, incrementNotificationCount }) => {
  const queryClient = useQueryClient();
  const { getRandomCharacters } = useCharacters();

  /* ──────────────────────── Modal state ──────────────────────────── */
  const [likeModal, setLikeModal] = useState({
    show: false,
    likes: [],
    postId: null,
  });
  const [optionsModal, setOptionsModal] = useState({
    show: false,
    postId: null,
  });
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    postId: null,
    postTitle: null,
  });
  const [profileModal, setProfileModal] = useState({
    show: false,
    character: null,
  });

  const modalRef = useRef(null);
  const optionsModalRef = useRef(null);

  // Intersection Observer를 위한 ref
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  /* ───────── React Query: Infinite Query with Cursor ───────── */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts", user?.id],
    queryFn: async ({ pageParam = null }) => {
      const result = await fetchPostsWithCommentsAndLikes(user.id, {
        limit: POSTS_PER_PAGE,
        cursor: pageParam, // cursor 사용 (null이면 처음부터)
      });

      return {
        posts: result.posts,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    getNextPageParam: (lastPage) => {
      // 다음 페이지의 cursor 반환
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: !!user,
  });

  // 모든 페이지의 포스트를 평면화 (중복 제거를 위해 Map 사용)
  const postsMap = new Map();
  data?.pages.forEach((page) => {
    page.posts?.forEach((post) => {
      postsMap.set(post.id, post);
    });
  });
  const posts = Array.from(postsMap.values());

  /* ───────── Intersection Observer 설정 ───────── */
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ───────── React Query: Create Post Mutation ───────── */
  const createPostMutation = useMutation({
    mutationFn: async (post) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const commentCharacters = getRandomCharacters(2);
      const likeCharacters = getRandomCharacters(
        Math.floor(Math.random() * 5) + 1
      );

      const comments = await Promise.all(
        commentCharacters.map(async (char) => {
          const reply = await fetchAIComment(char, post.title, post.content);
          return {
            character: char,
            message: reply,
          };
        })
      );

      const savedPost = await savePostWithCommentsAndLikes(
        post,
        comments,
        likeCharacters
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
        mood: post.mood || null, // mood 추가
        Comment: [],
        Post_Like: [],
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

      incrementNotificationCount();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", user?.id], context.previousData);
      }
      console.error("Error creating post:", error);
      alert("포스트 작성 중 오류가 발생했습니다.");
    },
  });

  /* ───────── React Query: Delete Post Mutation ───────── */
  const deletePostMutation = useMutation({
    mutationFn: ({ postId }) => deletePostById(postId, user.id),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", user?.id] });

      const previousData = queryClient.getQueryData(["posts", user?.id]);

      queryClient.setQueryData(["posts", user?.id], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((post) => post.id !== postId),
        }));

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", user?.id], context.previousData);
      }
      console.error("Error deleting post:", error);
      alert("삭제 중 오류가 발생했습니다.");
    },
    onSuccess: () => {
      // 삭제 성공 후 전체 데이터 다시 동기화
      queryClient.invalidateQueries({ queryKey: ["posts", user?.id] });
    },
  });

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        likeModal.show &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        !e.target.closest(".like-button")
      ) {
        setLikeModal({ show: false, likes: [], postId: null });
      }

      if (
        optionsModal.show &&
        optionsModalRef.current &&
        !optionsModalRef.current.contains(e.target) &&
        !e.target.closest(".options-button")
      ) {
        setOptionsModal({ show: false, postId: null });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [likeModal.show, optionsModal.show]);

  const handlePostSubmit = (post) => {
    createPostMutation.mutate(post);
  };

  const formatRelativeTime = (isoString) => {
    const now = new Date();
    const created = new Date(isoString);
    const diffMin = Math.floor((now - created) / 1000 / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffHour < 1) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 4) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    return created.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLikeClick = (e, postId, postLikes) => {
    e.stopPropagation();

    if (!postLikes || postLikes.length === 0) return;

    if (likeModal.show && likeModal.postId === postId) {
      setLikeModal({ show: false, likes: [], postId: null });
      return;
    }

    setLikeModal({
      show: true,
      likes: postLikes,
      postId: postId,
    });
  };

  const handleOptionsClick = (e, postId) => {
    e.stopPropagation();

    if (optionsModal.show && optionsModal.postId === postId) {
      setOptionsModal({ show: false, postId: null });
      return;
    }

    setOptionsModal({
      show: true,
      postId: postId,
    });
  };

  const handleDeleteClick = (postId) => {
    const post = posts.find((p) => p.id === postId);
    setConfirmDelete({
      show: true,
      postId: postId,
      postTitle: post?.title || "this post",
    });
    setOptionsModal({ show: false, postId: null });
  };

  const handleDeletePost = async () => {
    deletePostMutation.mutate({ postId: confirmDelete.postId });
    setConfirmDelete({ show: false, postId: null, postTitle: null });
  };

  // 스켈레톤 로더 컴포넌트
  const PostSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-stone-200 rounded"></div>
            <div className="h-3 w-16 bg-stone-100 rounded"></div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="h-5 w-48 bg-stone-200 rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-stone-100 rounded"></div>
          <div className="h-4 w-3/4 bg-stone-100 rounded"></div>
        </div>
      </div>
      <div className="px-6 py-3 border-t border-stone-100">
        <div className="flex space-x-4">
          <div className="h-8 w-16 bg-stone-100 rounded"></div>
          <div className="h-8 w-16 bg-stone-100 rounded"></div>
        </div>
      </div>
    </div>
  );

  // 초기 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="bg-stone-50 rounded-2xl p-1">
              <div className="bg-white rounded-xl shadow-sm">
                <PostForm
                  onPostSubmit={handlePostSubmit}
                  isSubmitting={false}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">포스트를 불러올 수 없습니다.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8 min-h-[70dvh]">
        {/* Enhanced Post Form */}
        <div className="mb-8">
          <div className="bg-stone-50 rounded-2xl p-1">
            <div className="bg-white rounded-xl shadow-sm">
              <PostForm
                onPostSubmit={handlePostSubmit}
                isSubmitting={createPostMutation.isLoading}
              />
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-stone-500 font-medium">
                Start the conversation
              </p>
              <p className="text-stone-400 text-sm mt-1">
                Share your first thought
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => {
                const isLoading = post.isLoading || false;

                return (
                  <article
                    key={post.id}
                    className={`bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 transition-all duration-200 ${
                      isLoading ? "animate-pulse" : ""
                    }`}
                  >
                    {/* Post Header */}
                    <div className="px-6 pt-6 pb-2 flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {post.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-stone-900">
                              {user.user_metadata.display_name}
                            </h3>
                            {/* Mood indicator */}
                            {post.mood && MOODS[post.mood] && (
                              <div
                                className={`flex items-center justify-center w-4 h-4 rounded-full ${
                                  MOODS[post.mood].bgColor
                                }`}
                              >
                                {(() => {
                                  const MoodIcon = MOODS[post.mood].icon;
                                  return (
                                    <MoodIcon
                                      className={`w-4 h-4 ${
                                        MOODS[post.mood].color
                                      }`}
                                    />
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-stone-500">
                            {formatRelativeTime(post.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className="options-button p-2 hover:bg-stone-50 rounded-lg transition-colors"
                          onClick={(e) => handleOptionsClick(e, post.id)}
                          disabled={isLoading}
                        >
                          <svg
                            className="w-5 h-5 text-stone-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>

                        {/* Options Modal */}
                        {optionsModal.show &&
                          optionsModal.postId === post.id && (
                            <div
                              ref={optionsModalRef}
                              className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[160px]"
                            >
                              <button
                                onClick={() => handleDeleteClick(post.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-6 pb-4">
                      <h2 className="text-lg font-semibold text-stone-900 mb-2">
                        {post.title}
                      </h2>
                      <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    {/* Loading indicator for AI responses */}
                    {isLoading && post.Comment.length === 0 && (
                      <div className="px-6 pb-3">
                        <div className="border-t border-stone-100 pt-4">
                          <div className="flex items-center space-x-2 text-stone-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-400"></div>
                            <span className="text-sm">
                              AI friends are thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments Section with fade-in animation */}
                    {post.Comment && post.Comment.length > 0 && (
                      <div className="px-6 pb-3 animate-fadeIn">
                        <div className="border-t border-stone-100 pt-4 space-y-3">
                          {post.Comment.map((c, idx) => (
                            <div
                              key={c.id}
                              className="flex items-start space-x-3 animate-slideIn"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              {c.avatar_url ? (
                                <img
                                  src={c.avatar_url}
                                  alt={c.character}
                                  className="w-10 h-10 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProfileModal({
                                      show: true,
                                      character: {
                                        name: c.character,
                                        avatar_url: c.avatar_url,
                                        prompt_description:
                                          c.prompt_description,
                                      },
                                    });
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-10 h-10 bg-gradient-to-br from-stone-500 to-stone-700 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                  display: c.avatar_url ? "none" : "flex",
                                }}
                              >
                                <span className="text-white text-xs font-medium">
                                  {c.character?.charAt(0) || "A"}
                                </span>
                              </div>

                              <div className="flex-1 bg-stone-50 rounded-2xl px-4 py-2">
                                <p className="text-sm font-medium text-stone-800 mb-0.5">
                                  {c.character || "AI Friend"}
                                </p>
                                <p className="text-sm text-stone-600">
                                  {c.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <div className="relative">
                          <button
                            className="like-button flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                            onClick={(e) =>
                              handleLikeClick(e, post.id, post.Post_Like)
                            }
                            disabled={isLoading}
                          >
                            <svg
                              className={`w-5 h-5 ${
                                isLoading ? "text-stone-300" : "text-stone-600"
                              }`}
                              fill={
                                post.like > 0 && !isLoading ? "#FF8DA1" : "none"
                              }
                              stroke={
                                post.like > 0 && !isLoading
                                  ? "#FF8DA1"
                                  : "currentColor"
                              }
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span
                              className={`text-sm ${
                                isLoading ? "text-stone-300" : "text-stone-600"
                              }`}
                            >
                              {post.like > 0 ? post.like : "Like"}
                            </span>
                          </button>

                          {/* Like Modal */}
                          {likeModal.show && likeModal.postId === post.id && (
                            <div
                              ref={modalRef}
                              className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 p-4 min-w-[200px] max-w-xs"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-stone-900 text-sm">
                                  Likes
                                </h3>
                                <span className="text-xs text-stone-500">
                                  {likeModal.likes.length}
                                </span>
                              </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {likeModal.likes.map((like) => (
                                  <div
                                    key={like.character_id}
                                    className="flex items-center space-x-2 py-1"
                                  >
                                    {like.avatar_url ? (
                                      <img
                                        src={like.avatar_url}
                                        alt={like.character}
                                        className="w-10 h-10 cursor-pointer rounded-full object-cover flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProfileModal({
                                            show: true,
                                            character: {
                                              name: like.character,
                                              avatar_url: like.avatar_url,
                                              prompt_description:
                                                like.prompt_description,
                                            },
                                          });
                                          if (likeModal.show) {
                                            setLikeModal({
                                              show: false,
                                              likes: [],
                                              postId: null,
                                            });
                                          }
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextSibling.style.display =
                                            "flex";
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        display: like.avatar_url
                                          ? "none"
                                          : "flex",
                                      }}
                                    >
                                      <span className="text-white text-xs font-medium">
                                        {like.character?.charAt(0) || "?"}
                                      </span>
                                    </div>
                                    <span className="text-sm text-stone-700">
                                      {like.character || "Unknown"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-stone-200 transform rotate-45"></div>
                            </div>
                          )}
                        </div>

                        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                          <svg
                            className="w-5 h-5 text-stone-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="text-sm text-stone-600"></span>
                        </button>
                      </div>

                      <button className="p-2 rounded-lg hover:bg-stone-50 transition-colors">
                        <svg
                          className="w-5 h-5 text-stone-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* 로딩 인디케이터 / 스켈레톤 로더 */}
              {isFetchingNextPage && (
                <div className="space-y-6">
                  {[...Array(2)].map((_, i) => (
                    <PostSkeleton key={`skeleton-${i}`} />
                  ))}
                </div>
              )}

              {/* Intersection Observer 타겟 */}
              <div ref={loadMoreRef} className="h-10" />

              {/* 더 이상 포스트가 없을 때 */}
              {!hasNextPage && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-stone-400 text-sm mb-4">
                    모든 포스트를 확인했습니다
                  </p>
                  {/* <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span className="text-sm font-medium">맨 위로</span>
                  </button> */}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.show}
        onClose={() =>
          setConfirmDelete({ show: false, postId: null, postTitle: null })
        }
        onConfirm={handleDeletePost}
        title="Delete Post?"
        message={`Are you sure you want to delete "${confirmDelete.postTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon="danger"
      />

      <ProfileModal
        isOpen={profileModal.show}
        onClose={() => setProfileModal({ show: false, character: null })}
        character={profileModal.character}
      />
    </div>
  );
};

export default Home;
