import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Smile,
  Meh,
  Frown,
  EllipsisVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { usePostsByDate, usePostActions } from "../../stores/postStore";
import { useUserId } from "../../stores/userStore";
import {
  fetchSinglePost,
  updatePostAIProcessingStatus,
} from "../../services/postService";
import { postStorage } from "../../components/utils/postStorage";
import ActionModal from "../../components/UI/ActionModal";

const MOOD_ICONS = {
  happy: {
    icon: Smile,
    label: "기쁨",
    color: "text-yellow-500",
  },
  neutral: {
    icon: Meh,
    label: "보통",
    color: "text-gray-500",
  },
  sad: {
    icon: Frown,
    label: "슬픔",
    color: "text-blue-500",
  },
};

// Collapsible Comments Component with Performance Optimization
const CollapsibleComments = ({ postId, reflections }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Memoized toggle handler
  const handleToggle = useCallback(() => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    // Use requestAnimationFrame for smooth animation
    const animate = () => {
      if (!contentRef.current) {
        isAnimatingRef.current = false;
        return;
      }

      if (!isExpanded) {
        // Expanding
        const targetHeight = contentRef.current.scrollHeight;
        setHeight(targetHeight);

        animationRef.current = requestAnimationFrame(() => {
          setIsExpanded(true);

          // Reset height to auto after animation completes
          setTimeout(() => {
            setHeight("auto");
            isAnimatingRef.current = false;
          }, 300);
        });
      } else {
        // Collapsing
        const currentHeight = contentRef.current.scrollHeight;
        setHeight(currentHeight);

        animationRef.current = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHeight(0);
            setIsExpanded(false);

            setTimeout(() => {
              isAnimatingRef.current = false;
            }, 300);
          });
        });
      }
    };

    animate();
  }, [isExpanded]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const commentCount = reflections.length;
  const displayAvatars = reflections.slice(0, 3);
  const remainingCount = Math.max(0, commentCount - 3);

  return (
    <div className="space-y-3 pt-4 mt-6 border-t border-gray-100">
      {/* Collapsed View */}
      <button
        onClick={handleToggle}
        className="w-full group"
        aria-expanded={isExpanded}
        aria-controls={`comments-${postId}`}
      >
        <div className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
          <div
            className={`flex items-center gap-3 transition-opacity duration-200 ${
              isExpanded ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Stacked Avatars */}
            <div className="flex items-center">
              {displayAvatars.map((reflection, index) => (
                <div
                  key={reflection.id}
                  className="relative transition-all duration-200"
                  style={{
                    marginLeft: index > 0 ? "-12px" : "0",
                    zIndex: displayAvatars.length - index,
                  }}
                >
                  <img
                    src={reflection.character.avatarUrl}
                    alt={reflection.character.name}
                    className="w-8 h-8 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className="relative flex items-center justify-center w-8 h-8 rounded-2xl bg-gray-100 border-2 border-white shadow-sm"
                  style={{
                    marginLeft: "-8px",
                    zIndex: 0,
                  }}
                >
                  <span className="text-xs font-medium text-gray-600">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>

            {/* Comment Count */}
            <span className="text-xs text-gray-600 font-medium">
              {commentCount} {commentCount === 1 ? "response" : "responses"}
            </span>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="p-1 rounded-md group-hover:bg-gray-100 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Comments */}
      <div
        id={`comments-${postId}`}
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: height === "auto" ? "auto" : `${height}px`,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="space-y-6 pt-2">
          {reflections.map((reflection, index) => (
            <div
              key={reflection.id}
              className="flex gap-3 animate-fadeIn"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <img
                src={reflection.character.avatarUrl}
                alt={reflection.character.name}
                className="w-8 h-8 cursor-pointer rounded-2xl object-cover flex-shrink-0 transition-transform hover:scale-105"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 mb-1">
                  {reflection.character.koreanName || reflection.character.name}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {reflection.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PostDetail = () => {
  const { date } = useParams(); // "2024-01-15" 형식
  const navigate = useNavigate();
  const userId = useUserId();
  const posts = usePostsByDate(date);
  const { updateSinglePost } = usePostActions();
  const { loadMonthData, hasMonthCache } = usePostActions();

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  useEffect(() => {
    // Store에 데이터가 없으면 해당 월 데이터 로드
    if (!posts && userId && date) {
      const monthKey = date.substring(0, 7); // "2024-01"

      // 해당 월 캐시가 없으면 로드
      if (!hasMonthCache(monthKey)) {
        loadMonthData(userId, monthKey)
          .then((data) => {
            // 로드 후에도 해당 날짜 데이터가 없으면 홈으로
            if (!data?.entries?.[date]) {
              console.log(`No posts found for date ${date}`);
              navigate("/");
            }
          })
          .catch((error) => {
            console.error("Failed to load month data:", error);
            navigate("/");
          });
      }
    }
  }, [posts, userId, date]);

  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const post = posts[0];
    if (post.aiProcessingStatus === "fetched") return;

    const handleStatus = async () => {
      // Edge case: 이미 completed이고 댓글도 있음
      if (
        post.aiProcessingStatus === "completed" &&
        post.aiReflections?.length > 0
      ) {
        await updatePostAIProcessingStatus(post.id, "fetched");
        // 상태만 업데이트
        updateSinglePost(date, {
          id: post.id,
          aiProcessingStatus: "fetched",
        });

        return;
      }

      // 나머지 경우: fetch 필요
      try {
        const updatedPost = await fetchSinglePost(post.id);

        if (
          updatedPost.aiProcessingStatus === "completed" &&
          updatedPost.aiReflections?.length > 0
        ) {
          await updatePostAIProcessingStatus(post.id, "fetched");
          updatedPost.aiProcessingStatus = "fetched";
        }

        updateSinglePost(date, updatedPost);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      }
    };

    handleStatus();
  }, [posts?.[0]?.id, posts?.[0]?.aiProcessingStatus]);

  // Action handlers
  const handleAddEntry = () => {
    const [year, month, day] = date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    postStorage.saveSelectedDate(selectedDate.toISOString());
    navigate("/post/new");
  };

  const handleEdit = () => {
    // TODO: Implement edit
    console.log("Edit post");
  };

  const handleDelete = () => {
    // TODO: Implement delete
    console.log("Delete post");
  };

  if (!posts) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-5 py-8">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-100 rounded mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 날짜 파싱
  const [year, month, day] = date.split("-");
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 -m-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Date Display */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">
              {String(dateObj.getDate()).padStart(2, "0")}
            </span>
            <div className="flex flex-col items-start">
              <p className="text-gray-500 text-sm">
                {dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-sm">
                  {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
                {posts[0]?.mood &&
                  (() => {
                    const WeatherIcon = MOOD_ICONS[posts[0].mood].icon;
                    return <WeatherIcon className="w-4 h-4 text-gray-600" />;
                  })()}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsActionModalOpen(true)}
            className="p-2 -m-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <EllipsisVertical className="w-6 h-6" />
          </button>
        </div>

        {/* Posts */}
        <div className="space-y-8">
          {posts.map((post, index) => (
            <div key={post.id}>
              {/* 여러 포스트가 있을 때 구분선 */}
              {index > 0 && (
                <div className="border-t border-gray-200 pt-8 -mt-4"></div>
              )}

              {/* Content */}
              <div
                className="text-gray-700 text-base leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Reflections - Now Collapsible */}
              {post.aiReflections.length > 0 && (
                <CollapsibleComments
                  postId={post.id}
                  reflections={post.aiReflections}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onAddEntry={handleAddEntry}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default PostDetail;
