import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Smile,
  Meh,
  Frown,
  Hash,
  MessageCircleOff,
  Globe,
  Lock,
  Filter, // ✅ 추가
  Users, // ✅ 추가
  Sparkles, // ✅ 추가
} from "lucide-react";

import { usePostsRealtime } from "../../components/hooks/usePostsRealtime";

// Toast
import { showAffinityToast } from "../../components/utils/toastUtils";

// Modal
import ConfirmationModal from "../../components/UI/ConfirmationModal";
import ProfileModal from "../../components/UI/ProfileModal";
import ImageModal from "./ImageModal";
import CommentInput from "./CommentInput";

import {
  deletePostById,
  fetchPostsWithCommentsAndLikes,
  toggleCommentLike,
} from "../../services/postService";
import "./Home.css";

// Custom hooks
import { useAddComment } from "../../components/hooks/useAddComment";

// userStore imports
import { useUserId, useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";

// characterStore
import { useCharacterActions } from "../../stores/characterStore";
import { useCharacters } from "../../stores/characterStore";

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

const Home = () => {
  const userId = useUserId();
  const language = useUserLanguage();
  const translate = createTranslator(language);

  const navigate = useNavigate();

  // characterStore에서 캐릭터 정보 가져오기
  const characters = useCharacters();
  const { updateLocalCharacterAffinity } = useCharacterActions();

  /* ──────────────────────── 댓글 추가 ────────────────────────── */
  // 댓글 추가 mutation
  const addCommentMutation = useAddComment({
    onSuccess: () => {
      console.log("댓글이 성공적으로 추가되었습니다.");
    },
    onError: (error) => {
      console.error("댓글 추가 실패:", error);
    },
  });
  // 댓글 입력 표시 상태 (포스트별)
  const [showCommentInput, setShowCommentInput] = useState({});

  const extractText = (html) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent.trim();

  const queryClient = useQueryClient();

  /* ──────────────────────── Modal state ────────────────────────── */
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
  const [imageModal, setImageModal] = useState({
    show: false,
    imageSrc: null,
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
    queryKey: ["posts", userId],
    queryFn: async ({ pageParam = null }) => {
      const result = await fetchPostsWithCommentsAndLikes(userId, {
        limit: POSTS_PER_PAGE,
        cursor: pageParam,
      });

      return {
        posts: result.posts,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: !!userId,
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

  /* ───────── React Query: Delete Post Mutation ───────── */
  const deletePostMutation = useMutation({
    mutationFn: ({ postId }) => deletePostById(postId, userId),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", userId] });

      const previousData = queryClient.getQueryData(["posts", userId]);

      queryClient.setQueryData(["posts", userId], (old) => {
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
        queryClient.setQueryData(["posts", userId], context.previousData);
      }
      console.error("Error deleting post:", error);
      alert("삭제 중 오류가 발생했습니다.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", userId] });
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

  useEffect(() => {
    // 모든 포스트 내 이미지에 클릭 이벤트 추가
    const handleContentImageClick = (e) => {
      if (
        e.target.tagName === "IMG" &&
        e.target.classList.contains("editor-image")
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleImageClick(e.target.src);
      }
    };

    // 이벤트 위임을 사용하여 동적으로 추가되는 이미지도 처리
    document.addEventListener("click", handleContentImageClick);

    return () => {
      document.removeEventListener("click", handleContentImageClick);
    };
  }, []);

  const formatRelativeTime = (isoString) => {
    const now = new Date();
    const created = new Date(isoString);
    const diffMin = Math.floor((now - created) / 1000 / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return translate("home.justNow");

    if (diffHour < 1) {
      if (diffMin === 1) {
        return `1 ${translate("home.minuteAgo")}`;
      }
      return `${diffMin}${translate("home.minutesAgo")}`;
    }

    if (diffHour < 4) {
      if (diffHour === 1) {
        return `1 ${translate("home.hourAgo")}`;
      }
      return `${diffHour}${translate("home.hoursAgo")}`;
    }

    // 4시간 이상은 날짜로 표시 (언어별 로케일 적용)
    const locale = language === "ko" ? "ko-KR" : "en-US";
    return created.toLocaleDateString(locale, {
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

  const handleEditClick = (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      // 수정 페이지로 이동하면서 포스트 데이터 전달
      navigate(`/post/edit/${postId}`, {
        state: {
          post: {
            id: post.id,
            content: post.content,
            mood: post.mood,
            visibility: post.visibility, // ✅ visibility 추가
            Post_Hashtag: post.Post_Hashtag || [],
          },
        },
      });

      setOptionsModal({ show: false, postId: null });
    }
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

  // ProfileModal에 전달할 캐릭터 정보를 보강하는 함수
  const getEnrichedCharacter = (basicCharInfo) => {
    // character_id가 있는 경우 (댓글, 좋아요)
    const characterId = basicCharInfo.character_id;

    // characterStore에서 최신 정보 찾기
    const latestCharInfo = characters.find((c) => c.id === characterId);

    if (latestCharInfo) {
      // 최신 정보가 있으면 병합
      return {
        ...basicCharInfo,
        // characterStore의 최신 데이터로 덮어쓰기
        id: latestCharInfo.id,
        name: latestCharInfo.name,
        personality: latestCharInfo.personality,
        avatar_url: latestCharInfo.avatar_url,
        description: latestCharInfo.description,
        prompt_description: latestCharInfo.prompt_description,
        affinity: latestCharInfo.affinity, // 최신 affinity
        // ProfileModal에서 사용하는 필드명 맞추기
        character: latestCharInfo.name,
      };
    }

    // characterStore에 없으면 기본 정보 사용
    return basicCharInfo;
  };

  // 댓글 좋아요 토글 핸들러 추가
  const handleCommentLike = async (commentId, postId) => {
    try {
      const post = posts.find((p) => p.id === postId);
      const comment = post?.Comment?.find((c) => c.id === commentId);
      if (!comment) return;

      // 1. RPC 호출 (이제 단 한 번의 네트워크 요청)
      const result = await toggleCommentLike(commentId, userId);

      // 2. React Query 캐시 업데이트
      queryClient.setQueryData(["posts", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  Comment: p.Comment.map((c) => {
                    if (c.id === commentId) {
                      return {
                        ...c,
                        like: result.like_count,
                        isLikedByUser: result.liked,
                        // RPC 결과에 따라 친밀도 즉시 반영
                        affinity: result.affinity_increased
                          ? (c.affinity || 0) + 1
                          : c.affinity,
                      };
                    }
                    return c;
                  }),
                };
              }
              return p;
            }),
          })),
        };
      });

      // 3. 친밀도 증가 시 Store 업데이트 및 Toast 표시
      if (result.affinity_increased && comment.character_id) {
        // characterStore의 로컬 상태만 업데이트
        updateLocalCharacterAffinity(comment.character_id, 1);

        const characterInfo = {
          id: comment.character_id,
          name: comment.character,
          avatar_url: comment.avatar_url,
        };

        showAffinityToast(
          [{ character_id: comment.character_id, success: true }],
          [characterInfo],
          [{ characterId: comment.character_id, increment: 1 }]
        );
      }
    } catch (error) {
      console.error("댓글 좋아요 처리 실패:", error);
      queryClient.invalidateQueries({ queryKey: ["posts", userId] });
    }
  };

  // 더블 탭 핸들러 수정 (모바일 지원)
  const handleCommentDoubleTap = (() => {
    let lastTap = 0;
    let tapTimeout = null;

    return (e, commentId, postId) => {
      e.preventDefault(); // 모바일에서 확대 방지

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      // 이전 타임아웃 클리어
      if (tapTimeout) {
        clearTimeout(tapTimeout);
        tapTimeout = null;
      }

      if (tapLength < 300 && tapLength > 0) {
        // 더블 탭 감지
        handleCommentLike(commentId, postId);
        lastTap = 0; // 리셋
      } else {
        lastTap = currentTime;
        // 300ms 후에 리셋 (다음 탭을 위해)
        tapTimeout = setTimeout(() => {
          lastTap = 0;
        }, 300);
      }
    };
  })();

  const handleImageClick = (imageSrc) => {
    setImageModal({
      show: true,
      imageSrc: imageSrc,
    });
  };

  // 댓글 입력창 토글
  const toggleCommentInput = (postId) => {
    setShowCommentInput((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // 댓글 추가 핸들러
  const handleAddComment = async (postId, message) => {
    await addCommentMutation.mutateAsync({ postId, message });
    // 성공 시 입력창 닫기
    setShowCommentInput((prev) => ({
      ...prev,
      [postId]: false,
    }));
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

  usePostsRealtime(posts);

  // 초기 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
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
      {/* ✅ 새로운 필터 헤더 추가 */}
      <div className="bg-white/80 backdrop-blur-lg z-40 border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          {/* 헤더 타이틀과 필터 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-md font-bold bg-gradient-to-r from-stone-900 to-stone-600 bg-clip-text text-transparent">
                Feed
              </h1>
              <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                <span className="text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {posts.length} posts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 min-h-[70dvh]">
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
                {translate("home.startConversation")}
              </p>
              <p className="text-stone-400 text-sm mt-1">
                {translate("home.shareFirstThought")}
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => {
                const isLoading = post.isLoading || false;

                return (
                  <article
                    key={post.id}
                    className={`bg-white rounded-2xl border border-stone-200 overflow-visible hover:border-stone-200 transition-all duration-200 ${
                      isLoading ? "animate-pulse" : ""
                    }`}
                  >
                    {/* Post Header */}
                    <div className="px-6 pt-6 pb-2 flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {post.ai_generated ? (
                          <img
                            src={post.Character.avatar_url}
                            alt={post.Character.name}
                            className="w-9 h-9 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                            onClick={(e) => {
                              const character = {
                                ...post.Character,
                                affinity:
                                  post.Character?.User_Character?.[0]
                                    ?.affinity ?? null,
                              };
                              e.stopPropagation();
                              setProfileModal({
                                show: true,
                                character: getEnrichedCharacter(character),
                              });
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {extractText(post.content)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-stone-900 text-sm">
                              {post.ai_generated
                                ? post.Character.name || "AI"
                                : post.User_Profile?.display_name || "User"}
                            </h3>

                            {/* ✅ Visibility Badge 추가 */}
                            {post.visibility === "public" ? (
                              <div className="flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                <Globe className="w-2.5 h-2.5 mr-1" />
                                <span className="text-xs font-medium">
                                  Public
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                                <Lock className="w-2.5 h-2.5 mr-1" />
                                <span className="text-xs font-medium">
                                  Private
                                </span>
                              </div>
                            )}

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
                            {formatRelativeTime(
                              post.updated_at || post.created_at
                            )}
                            {post.updated_at &&
                              post.updated_at !== post.created_at && (
                                <span className="text-stone-400">
                                  {" "}
                                  • {translate("home.edited")}
                                </span>
                              )}
                          </p>
                        </div>
                      </div>

                      {/* Options button - 기존 코드 유지 */}
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

                        {/* Options Modal - 기존 코드 유지 */}
                        {optionsModal.show &&
                          optionsModal.postId === post.id && (
                            <div
                              ref={optionsModalRef}
                              className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[140px]"
                            >
                              {/* Edit 버튼 - 자신의 포스트만 */}
                              {!post.Character && post.user_id === userId && (
                                <button
                                  onClick={() => handleEditClick(post.id)}
                                  className="w-full px-4 py-3 mb-1 text-left text-sm text-stone-600 hover:bg-stone-50 transition-colors flex items-center space-x-2"
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
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  <span>{translate("common.edit")}</span>
                                </button>
                              )}

                              {/* Delete 버튼 - 자신의 포스트만 */}
                              {post.user_id === userId && (
                                <button
                                  onClick={() => handleDeleteClick(post.id)}
                                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
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
                                  <span>{translate("common.delete")}</span>
                                </button>
                              )}

                              {/* Report 버튼 - 다른 사람의 public 포스트 */}
                              {post.user_id !== userId &&
                                post.visibility === "public" && (
                                  <button
                                    onClick={() =>
                                      console.log("Report post:", post.id)
                                    }
                                    className="w-full px-4 py-3 text-left text-sm text-stone-600 hover:bg-stone-50 transition-colors flex items-center space-x-2"
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
                                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                                      />
                                    </svg>
                                    <span>Report</span>
                                  </button>
                                )}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-6 pb-5">
                      <div
                        className="text-stone-700 leading-relaxed prose max-w-none post-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </div>

                    {/* Hashtags Display */}
                    {post.Post_Hashtag && post.Post_Hashtag.length > 0 && (
                      <div className="px-6 pb-2">
                        <div className="flex flex-wrap gap-1.5">
                          {post.Post_Hashtag.map((hashtag) => (
                            <span
                              key={hashtag.hashtag_id}
                              className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-full text-xs cursor-pointer transition-colors"
                            >
                              <Hash className="w-3 h-3" />
                              {hashtag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loading indicator for AI responses */}
                    {isLoading && post.Comment.length === 0 && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-stone-100 pt-5">
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
                          {post.Comment.map((c, idx) => {
                            // 서버에서 받은 데이터 사용
                            const isLiked = c.isLikedByUser;
                            const likeCount = c.like || 0;
                            const isUserComment =
                              c.isUserComment || c.user_id === userId;
                            const isMyComment = c.user_id === userId;

                            return (
                              <div
                                key={c.id}
                                className={`flex items-start space-x-2 ${
                                  c.isLoading ? "opacity-70" : ""
                                }`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                              >
                                {/* Avatar */}
                                {c.avatar_url ? (
                                  <img
                                    src={c.avatar_url}
                                    alt={c.character}
                                    className="w-9 h-9 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // 사용자 댓글이 아닌 경우에만 프로필 모달 열기
                                      if (!isUserComment) {
                                        setProfileModal({
                                          show: true,
                                          character: getEnrichedCharacter(c),
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
                                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isMyComment
                                      ? "bg-gradient-to-br from-blue-500 to-blue-700" // 내 댓글만 파란색
                                      : "bg-gradient-to-br from-stone-500 to-stone-700" // 나머지는 모두 회색
                                  }`}
                                  style={{
                                    display: c.avatar_url ? "none" : "flex",
                                  }}
                                >
                                  <span className="text-white text-xs font-medium">
                                    {isUserComment
                                      ? c.character?.charAt(0) || "U"
                                      : c.character?.charAt(0) || "A"}
                                  </span>
                                </div>

                                <div className="flex-1 flex items-center gap-1.5">
                                  <div
                                    className="flex-1 rounded-2xl px-4 py-2.5 select-none relative group bg-stone-50"
                                    onClick={(e) => {
                                      // AI 댓글만 더블탭 좋아요 가능
                                      if (!isUserComment) {
                                        handleCommentDoubleTap(
                                          e,
                                          c.id,
                                          post.id
                                        );
                                      }
                                    }}
                                    onTouchEnd={(e) => {
                                      if (!isUserComment) {
                                        handleCommentDoubleTap(
                                          e,
                                          c.id,
                                          post.id
                                        );
                                      }
                                    }}
                                  >
                                    <p className="text-sm font-medium mb-0.5">
                                      {c.character}
                                      {/* 선택적: 내 댓글에 "(You)" 표시 */}
                                      {isMyComment && (
                                        <span className="text-xs ml-1 opacity-60">
                                          (You)
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm leading-relaxed text-stone-600">
                                      {c.message}
                                    </p>

                                    {/* 더블 탭 힌트 - AI 댓글에만 */}
                                    {!isUserComment && (
                                      <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />
                                    )}

                                    {/* 로딩 인디케이터 */}
                                    {c.isLoading && (
                                      <div className="absolute right-2 top-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 댓글 좋아요 버튼 - AI 댓글에만 표시 */}
                                  {!isUserComment && (
                                    <div className="flex flex-col items-center justify-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCommentLike(c.id, post.id);
                                        }}
                                        className={`group p-1.5 rounded-full transition-colors duration-200 ${
                                          isLiked
                                            ? "text-pink-500 hover:bg-pink-50"
                                            : "text-stone-400 hover:text-stone-500 hover:bg-stone-50"
                                        }`}
                                      >
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill={
                                            isLiked ? "currentColor" : "none"
                                          }
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                          />
                                        </svg>
                                      </button>

                                      {/* 좋아요 수 */}
                                      {likeCount > 0 && (
                                        <span
                                          className={`text-[10px] ${
                                            isLiked
                                              ? "text-pink-500"
                                              : "text-stone-400"
                                          }`}
                                        >
                                          {likeCount}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Comment Input - 포스트별로 표시 여부 제어 */}
                    {showCommentInput[post.id] && (
                      <CommentInput
                        onSubmit={(message) =>
                          handleAddComment(post.id, message)
                        }
                        isSubmitting={addCommentMutation.isLoading}
                        placeholder="Add a comment..."
                        autoFocus={true}
                      />
                    )}

                    {/* Post Actions */}
                    <div className="px-6 py-2 border-t border-stone-100 flex items-center justify-between">
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
                              className={`text-xs ${
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
                                  {translate("home.likes")}
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
                                        className="w-9 h-9 cursor-pointer rounded-full object-cover flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProfileModal({
                                            show: true,
                                            character:
                                              getEnrichedCharacter(like),
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

                        {/* Comment Button - 댓글 입력창 토글 */}
                        <button
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                          onClick={() => toggleCommentInput(post.id)}
                        >
                          {showCommentInput[post.id] ? (
                            <MessageCircleOff className="w-4 h-4 text-stone-600" />
                          ) : (
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
                          )}

                          <span className="text-sm text-stone-600">
                            {showCommentInput[post.id] ? "Cancel" : "Comment"}
                          </span>
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
              {!hasNextPage && posts.length > 5 && (
                <div className="text-center py-8">
                  <p className="text-stone-400 text-sm mb-4">
                    {translate("home.allCaughtUp")}
                  </p>
                  <button
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
                    <span className="text-sm font-medium">
                      {translate("home.backToTop")}
                    </span>
                  </button>
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

      <ImageModal
        isOpen={imageModal.show}
        onClose={() => setImageModal({ show: false, imageSrc: null })}
        imageSrc={imageModal.imageSrc}
      />
    </div>
  );
};

export default Home;
