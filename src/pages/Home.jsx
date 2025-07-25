import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  /* ───────── React Query: Fetch Posts ───────── */
  const {
    data: posts = [],
    isLoading,
    error,
    isStale,
  } = useQuery({
    queryKey: ["posts", user?.id],
    queryFn: () => fetchPostsWithCommentsAndLikes(user.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    cacheTime: 10 * 60 * 1000, // 10분간 캐시 보관
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시 refetch
  });

  /* ───────── React Query: Create Post Mutation ───────── */
  const createPostMutation = useMutation({
    mutationFn: async (post) => {
      const tempId = `temp-${Date.now()}`;
      const commentCharacters = getRandomCharacters(2);
      const likeCharacters = getRandomCharacters(
        Math.floor(Math.random() * 5) + 1
      );

      // AI 댓글 생성
      const comments = await Promise.all(
        commentCharacters.map(async (char) => {
          const reply = await fetchAIComment(char, post.title, post.content);
          return {
            character: char,
            message: reply,
          };
        })
      );

      // DB에 저장
      const savedPostId = await savePostWithCommentsAndLikes(
        post,
        comments,
        likeCharacters
      );

      return {
        tempId,
        savedPostId,
        post,
        comments,
        likeCharacters,
      };
    },
    onMutate: async (post) => {
      // 이전 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["posts", user?.id] });

      // 이전 데이터 스냅샷
      const previousPosts = queryClient.getQueryData(["posts", user?.id]);

      // 낙관적 업데이트: 즉시 포스트 추가 (로딩 상태로)
      const tempId = `temp-${Date.now()}`;
      const optimisticPost = {
        ...post,
        id: tempId,
        Comment: [],
        Post_Like: [],
        like: 0,
        created_at: new Date().toISOString(),
        isLoading: true, // 로딩 표시를 위한 플래그
      };

      queryClient.setQueryData(["posts", user?.id], (old) => [
        optimisticPost,
        ...(old || []),
      ]);

      return { previousPosts, tempId };
    },
    onSuccess: (data, variables, context) => {
      // 성공 시 실제 데이터로 업데이트
      queryClient.setQueryData(["posts", user?.id], (old) =>
        old.map((post) =>
          post.id === context.tempId
            ? {
                ...data.post,
                id: data.savedPostId,
                Comment: data.comments.map((c) => ({
                  character: c.character.name,
                  avatar_url: c.character.avatar_url,
                  message: c.message,
                  prompt_description: c.character.prompt_description,
                })),
                Post_Like: data.likeCharacters.map((c) => ({
                  character: c.name,
                  avatar_url: c.avatar_url,
                  prompt_description: c.prompt_description,
                })),
                like: data.likeCharacters.length,
                created_at: new Date().toISOString(),
                isLoading: false,
              }
            : post
        )
      );

      incrementNotificationCount();
    },
    onError: (error, variables, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", user?.id], context.previousPosts);
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
      const previousPosts = queryClient.getQueryData(["posts", user?.id]);

      // 낙관적 업데이트: 즉시 삭제
      queryClient.setQueryData(["posts", user?.id], (old) =>
        old.filter((post) => post.id !== postId)
      );

      return { previousPosts };
    },
    onError: (error, variables, context) => {
      // 에러 시 롤백
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", user?.id], context.previousPosts);
      }
      console.error("Error deleting post:", error);
      alert("삭제 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      // 성공/실패 관계없이 서버 데이터로 동기화
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

  // 초기 로딩 상태
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 mx-auto"></div>
          <p className="mt-4 text-stone-500">포스트를 불러오는 중...</p>
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
            onClick={() => queryClient.invalidateQueries(["posts", user?.id])}
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
        {/* Stale 데이터 표시 (백그라운드 refetch 중) */}
        {isStale && (
          <div className="mb-4 text-center">
            <span className="text-xs text-stone-400">
              새로운 포스트를 확인하는 중...
            </span>
          </div>
        )}

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
            posts.map((post) => {
              const isLoading = post.isLoading || false;

              return (
                <article
                  key={post.id}
                  className={`bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 transition-all duration-200 ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                >
                  {/* Post Header */}
                  <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center">
                        <span className="text-sm text-white font-medium">
                          {post.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-stone-900">
                          {user.user_metadata.display_name}
                        </h3>
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
                      {optionsModal.show && optionsModal.postId === post.id && (
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
                            key={idx}
                            className="flex items-start space-x-3 animate-slideIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            {c.avatar_url ? (
                              <img
                                src={c.avatar_url}
                                alt={c.character}
                                className="w-11 h-11 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfileModal({
                                    show: true,
                                    character: {
                                      name: c.character,
                                      avatar_url: c.avatar_url,
                                      prompt_description: c.prompt_description,
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
                              {likeModal.likes.map((like, idx) => (
                                <div
                                  key={idx}
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
            })
          )}
        </div>

        {/* 수동 새로고침 버튼 (선택적) */}
        <div className="mt-8 text-center">
          <button
            onClick={() => queryClient.invalidateQueries(["posts", user?.id])}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            새로고침
          </button>
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
