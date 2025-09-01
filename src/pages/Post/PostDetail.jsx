// src/pages/Post/PostDetail.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Smile,
  Meh,
  Frown,
  Hash,
  MessageCircleOff,
  Globe,
  Lock,
  ArrowLeft,
  Loader,
} from "lucide-react";

import { usePostsRealtime } from "../../components/hooks/usePostsRealtime";
import { usePost } from "../../components/hooks/usePost";
import { showAffinityToast } from "../../components/utils/toastUtils";

import ConfirmationModal from "../../components/UI/ConfirmationModal";
import ProfileModal from "../../components/UI/ProfileModal";
import ImageModal from "../Home/ImageModal";
import CommentInput from "../Home/CommentInput";

import {
  deletePostById,
  toggleCommentLike,
  updateComment,
  deleteComment,
} from "../../services/postService";

import { useAddComment } from "../../components/hooks/useAddComment";
import { useUserId, useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";
import { useCharacterActions } from "../../stores/characterStore";
import { useCharacters } from "../../stores/characterStore";

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

const PostDetail = () => {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const userId = useUserId();
  const language = useUserLanguage();
  const translate = createTranslator(language);
  const queryClient = useQueryClient();

  // 포스트 데이터 가져오기
  const { data: post, isLoading, error } = usePost(postId);

  // characterStore에서 캐릭터 정보 가져오기
  const characters = useCharacters();
  const { updateLocalCharacterAffinity } = useCharacterActions();

  // 댓글 추가 mutation
  const addCommentMutation = useAddComment({
    onSuccess: () => {
      console.log("댓글이 성공적으로 추가되었습니다.");
      // PostDetail에서는 단일 포스트만 다루므로 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["post", postId, userId] });
    },
    onError: (error) => {
      console.error("댓글 추가 실패:", error);
    },
  });

  // 댓글 입력 표시 상태
  const [showCommentInput, setShowCommentInput] = useState(false);

  // 모달 상태들
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

  // 댓글 관련 상태
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentOptionsModal, setCommentOptionsModal] = useState({
    show: false,
    commentId: null,
    postId: null,
  });
  const [confirmDeleteComment, setConfirmDeleteComment] = useState({
    show: false,
    commentId: null,
    postId: null,
    postUserId: null,
    commentText: null,
  });

  const modalRef = useRef(null);
  const optionsModalRef = useRef(null);
  const commentOptionsModalRef = useRef(null);

  // Realtime subscription
  usePostsRealtime(post ? [post] : []);

  // 삭제 mutation
  const deletePostMutation = useMutation({
    mutationFn: ({ postId }) => deletePostById(postId, userId),
    onSuccess: () => {
      navigate("/");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      alert("삭제 중 오류가 발생했습니다.");
    },
  });

  // 댓글 수정 mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, message }) =>
      updateComment(commentId, userId, message),
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["post", postId, userId] });
    },
    onError: (error) => {
      console.error("댓글 수정 실패:", error);
      alert("댓글 수정에 실패했습니다.");
    },
  });

  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId, postUserId }) =>
      deleteComment(commentId, userId, postUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId, userId] });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    },
  });

  // Modal 외부 클릭 처리
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

      if (
        commentOptionsModal.show &&
        commentOptionsModalRef.current &&
        !commentOptionsModalRef.current.contains(e.target) &&
        !e.target.closest(".comment-options-button")
      ) {
        setCommentOptionsModal({ show: false, commentId: null, postId: null });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [likeModal.show, optionsModal.show, commentOptionsModal.show]);

  // 이미지 클릭 처리
  useEffect(() => {
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

    document.addEventListener("click", handleContentImageClick);
    return () => {
      document.removeEventListener("click", handleContentImageClick);
    };
  }, []);

  // Helper functions (Home.jsx에서 가져옴)
  const extractText = (html) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent.trim();

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
    if (post) {
      navigate(`/post/edit/${postId}`, {
        state: {
          post: {
            id: post.id,
            content: post.content,
            mood: post.mood,
            visibility: post.visibility,
            allow_ai_comments: post.allow_ai_comments,
            Post_Hashtag: post.Post_Hashtag || [],
          },
        },
      });

      setOptionsModal({ show: false, postId: null });
    }
  };

  const handleDeleteClick = (postId) => {
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

  const getEnrichedCharacter = (basicCharInfo) => {
    const characterId = basicCharInfo.character_id;
    const latestCharInfo = characters.find((c) => c.id === characterId);

    if (latestCharInfo) {
      return {
        ...basicCharInfo,
        id: latestCharInfo.id,
        name: latestCharInfo.name,
        personality: latestCharInfo.personality,
        avatar_url: latestCharInfo.avatar_url,
        description: latestCharInfo.description,
        prompt_description: latestCharInfo.prompt_description,
        affinity: latestCharInfo.affinity,
        character: latestCharInfo.name,
      };
    }

    return basicCharInfo;
  };

  const handleCommentLike = async (commentId, postId) => {
    try {
      const comment = post?.Comment?.find((c) => c.id === commentId);
      if (!comment) return;

      // 디버깅 1: 현재 post 상태 확인
      console.log("=== COMMENT LIKE DEBUG START ===");
      console.log("Current post state:", post);
      console.log("Target comment:", comment);
      console.log("Comment ID:", commentId, "Post ID:", postId);

      // 디버깅 2: 캐시 업데이트 전 상태
      const cacheBeforeUpdate = queryClient.getQueryData([
        "post",
        postId,
        userId,
      ]);
      console.log("Cache before update:", cacheBeforeUpdate);

      // 현재 상태 저장 (롤백용)
      const previousData = queryClient.getQueryData(["post", postId, userId]);

      // 서버 요청
      const result = await toggleCommentLike(commentId, userId);
      console.log("Server response:", result);

      // 캐시 업데이트
      queryClient.setQueryData(["post", postId, userId], (old) => {
        console.log("setQueryData old value:", old);

        if (!old) {
          console.log("Old data is null, returning null");
          return old;
        }

        const updated = {
          ...old,
          Comment: old.Comment.map((c) => {
            if (c.id === commentId) {
              const updatedComment = {
                ...c,
                like: result.like_count,
                isLikedByUser: result.liked,
                affinity: result.affinity_increased
                  ? (c.affinity || 0) + 1
                  : c.affinity,
              };
              console.log("Updated comment:", updatedComment);
              return updatedComment;
            }
            return c;
          }),
        };

        console.log("Updated post object:", updated);
        return updated;
      });

      // 디버깅 3: 캐시 업데이트 직후 확인
      const cacheAfterUpdate = queryClient.getQueryData([
        "post",
        postId,
        userId,
      ]);
      console.log("Cache immediately after update:", cacheAfterUpdate);

      // 디버깅 4: 100ms 후 캐시 확인 (비동기 업데이트 체크)
      setTimeout(() => {
        const cacheDelayed = queryClient.getQueryData(["post", postId, userId]);
        console.log("Cache after 100ms:", cacheDelayed);

        // 디버깅 5: 현재 컴포넌트의 post prop 확인
        console.log("Component post prop after 100ms:", post);
      }, 100);

      // 디버깅 6: 500ms 후 최종 확인
      setTimeout(() => {
        const cacheFinal = queryClient.getQueryData(["post", postId, userId]);
        console.log("Cache after 500ms (final):", cacheFinal);
        console.log("=== COMMENT LIKE DEBUG END ===");
      }, 500);

      // affinity 처리
      if (result.affinity_increased && comment.character_id) {
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
      // 롤백
      if (previousData) {
        queryClient.setQueryData(["post", postId, userId], previousData);
      }
      queryClient.invalidateQueries({ queryKey: ["post", postId, userId] });
    }
  };

  const handleCommentDoubleTap = (() => {
    let lastTap = 0;
    let tapTimeout = null;

    return (e, commentId, postId) => {
      e.preventDefault();

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapTimeout) {
        clearTimeout(tapTimeout);
        tapTimeout = null;
      }

      if (tapLength < 300 && tapLength > 0) {
        handleCommentLike(commentId, postId);
        lastTap = 0;
      } else {
        lastTap = currentTime;
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

  const toggleCommentInput = () => {
    setShowCommentInput(!showCommentInput);
  };

  const handleAddComment = async (message) => {
    await addCommentMutation.mutateAsync({ postId, message });
    setShowCommentInput(false);
  };

  const handleCommentOptionsClick = (e, commentId, postId) => {
    e.stopPropagation();

    if (
      commentOptionsModal.show &&
      commentOptionsModal.commentId === commentId
    ) {
      setCommentOptionsModal({ show: false, commentId: null, postId: null });
      return;
    }

    setCommentOptionsModal({
      show: true,
      commentId: commentId,
      postId: postId,
    });
  };

  const handleEditCommentClick = (commentId) => {
    setEditingCommentId(commentId);
    setCommentOptionsModal({ show: false, commentId: null, postId: null });
  };

  const handleDeleteCommentClick = (
    commentId,
    postId,
    postUserId,
    commentText
  ) => {
    setConfirmDeleteComment({
      show: true,
      commentId: commentId,
      postId: postId,
      postUserId: postUserId,
      commentText: commentText,
    });
    setCommentOptionsModal({ show: false, commentId: null, postId: null });
  };

  const handleDeleteCommentConfirm = () => {
    deleteCommentMutation.mutate({
      commentId: confirmDeleteComment.commentId,
      postId: confirmDeleteComment.postId,
      postUserId: confirmDeleteComment.postUserId,
    });
    setConfirmDeleteComment({
      show: false,
      commentId: null,
      postId: null,
      postUserId: null,
      commentText: null,
    });
  };

  const handleUpdateComment = async (commentId, postId, newMessage) => {
    await updateCommentMutation.mutateAsync({
      commentId,
      postId,
      message: newMessage,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-stone-900">Post</h1>
          </div>

          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-stone-600 mb-4">
              {error.message || "포스트를 찾을 수 없습니다."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-stone-900">Post</h1>
        </div>

        {/* Post Content - Home.jsx와 동일한 구조 */}
        <article className="bg-white rounded-2xl border border-stone-200 overflow-visible">
          {/* Post Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {post.ai_generated ? (
                <img
                  src={post.Character.avatar_url}
                  alt={post.Character.name}
                  className="w-8 h-8 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                  onClick={(e) => {
                    const character = {
                      ...post.Character,
                      affinity:
                        post.Character?.User_Character?.[0]?.affinity ?? null,
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
                    {extractText(post.content).charAt(0).toUpperCase()}
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

                  {/* Visibility Badge */}
                  {post.visibility === "public" ? (
                    <div className="flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                      <Globe className="w-2.5 h-2.5 mr-1" />
                      <span className="text-xs font-medium">Public</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      <span className="text-xs font-medium">Private</span>
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
                            className={`w-4 h-4 ${MOODS[post.mood].color}`}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-500">
                  {formatRelativeTime(post.updated_at || post.created_at)}
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span className="text-stone-400">
                      {" "}
                      • {translate("home.edited")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Options button */}
            <div className="relative">
              <button
                className="options-button p-2 hover:bg-stone-50 rounded-lg transition-colors"
                onClick={(e) => handleOptionsClick(e, post.id)}
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
                  className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[140px]"
                >
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

          {/* Comments Section */}
          {post.Comment && post.Comment.length > 0 && (
            <div className="px-6 pb-3">
              <div className="border-t border-stone-100 pt-4 space-y-3">
                {post.Comment.map((c, idx) => {
                  const isLiked = c.isLikedByUser;
                  const likeCount = c.like || 0;
                  const isUserComment = c.isUserComment || c.user_id === userId;
                  const isMyComment = c.user_id === userId;
                  const isAIComment = c.character_id !== null;
                  const isPostOwner = post.user_id === userId;
                  const canEdit = isMyComment;
                  const canDelete = isMyComment || (isAIComment && isPostOwner);
                  const isEditing = editingCommentId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`${c.isLoading ? "opacity-70" : ""}`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-start space-x-2">
                        {/* Avatar */}
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.character}
                            className="w-8 h-8 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isUserComment) {
                                setProfileModal({
                                  show: true,
                                  character: getEnrichedCharacter(c),
                                });
                              }
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isMyComment
                              ? "bg-gradient-to-br from-blue-500 to-blue-700"
                              : "bg-gradient-to-br from-stone-500 to-stone-700"
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

                        {/* Comment Content */}
                        <div className="flex-1">
                          {/* 수정 모드 */}
                          {isEditing ? (
                            <CommentInput
                              initialValue={c.message}
                              onSubmit={(newMessage) =>
                                handleUpdateComment(c.id, post.id, newMessage)
                              }
                              onCancel={() => setEditingCommentId(null)}
                              isSubmitting={updateCommentMutation.isLoading}
                              placeholder="Edit comment..."
                              autoFocus={true}
                              isEditMode={true}
                            />
                          ) : (
                            <>
                              {/* 일반 댓글 표시 */}
                              <div
                                className="rounded-2xl px-4 py-2.5 select-none relative group bg-stone-50"
                                onClick={(e) => {
                                  handleCommentDoubleTap(e, c.id, post.id);
                                }}
                                onTouchEnd={(e) => {
                                  handleCommentDoubleTap(e, c.id, post.id);
                                }}
                              >
                                <p className="text-sm font-medium">
                                  {c.character}
                                  {isMyComment && (
                                    <span className="text-xs ml-1 opacity-60">
                                      (You)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-stone-400 mb-1">
                                  {formatRelativeTime(c.created_at)}
                                </p>
                                <p className="text-sm leading-relaxed text-stone-600 break-words">
                                  {c.message}
                                </p>

                                {!isUserComment && (
                                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />
                                )}

                                {c.isLoading && (
                                  <div className="absolute right-2 top-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  </div>
                                )}
                              </div>

                              {/* 액션 버튼들 */}
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                {/* 좋아요 버튼 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCommentLike(c.id, post.id);
                                  }}
                                  className={`group inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${
                                    isLiked
                                      ? "text-pink-500 hover:bg-pink-50"
                                      : "text-stone-400 hover:text-stone-500 hover:bg-stone-50"
                                  }`}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill={isLiked ? "currentColor" : "none"}
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
                                  {likeCount > 0 && (
                                    <span className="text-xs font-medium">
                                      {likeCount}
                                    </span>
                                  )}
                                </button>

                                {/* 옵션 메뉴 */}
                                {(canEdit || canDelete) && (
                                  <>
                                    <span className="text-stone-300">·</span>
                                    <div className="relative">
                                      <button
                                        className="comment-options-button px-2 py-1 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                        onClick={(e) =>
                                          handleCommentOptionsClick(
                                            e,
                                            c.id,
                                            post.id
                                          )
                                        }
                                      >
                                        More
                                      </button>

                                      {/* 댓글 옵션 모달 */}
                                      {commentOptionsModal.show &&
                                        commentOptionsModal.commentId ===
                                          c.id && (
                                          <div
                                            ref={commentOptionsModalRef}
                                            className="absolute top-full mb-1 right-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[120px]"
                                          >
                                            {canEdit && (
                                              <button
                                                onClick={() =>
                                                  handleEditCommentClick(c.id)
                                                }
                                                className="w-full px-4 py-3 mb-1 text-left text-sm text-stone-600 hover:bg-stone-50 transition-colors flex items-center space-x-2"
                                              >
                                                <svg
                                                  className="w-3 h-3"
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
                                                <span>
                                                  {translate("common.edit")}
                                                </span>
                                              </button>
                                            )}
                                            {canDelete && (
                                              <button
                                                onClick={() =>
                                                  handleDeleteCommentClick(
                                                    c.id,
                                                    post.id,
                                                    post.user_id,
                                                    c.message.substring(0, 50)
                                                  )
                                                }
                                                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                                              >
                                                <svg
                                                  className="w-3 h-3"
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
                                                <span>
                                                  {translate("common.delete")}
                                                </span>
                                              </button>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment Input */}
          {showCommentInput && (
            <CommentInput
              onSubmit={(message) => handleAddComment(message)}
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
                  onClick={(e) => handleLikeClick(e, post.id, post.Post_Like)}
                >
                  <svg
                    className="w-5 h-5 text-stone-600"
                    fill={post.like > 0 ? "#FF8DA1" : "none"}
                    stroke={post.like > 0 ? "#FF8DA1" : "currentColor"}
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-xs text-stone-600">
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
                                  character: getEnrichedCharacter(like),
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
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              display: like.avatar_url ? "none" : "flex",
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

              {/* Comment Button */}
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                onClick={toggleCommentInput}
              >
                {showCommentInput ? (
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
                  {showCommentInput ? "Cancel" : ""}
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
      </div>

      {/* Modals */}
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

      <ConfirmationModal
        isOpen={confirmDeleteComment.show}
        onClose={() =>
          setConfirmDeleteComment({
            show: false,
            commentId: null,
            postId: null,
            postUserId: null,
            commentText: null,
          })
        }
        onConfirm={handleDeleteCommentConfirm}
        title="Delete Comment?"
        message={`Are you sure you want to delete this comment? "${confirmDeleteComment.commentText}..."`}
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

export default PostDetail;
