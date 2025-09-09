import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Smile, Meh, Frown } from "lucide-react";

import { usePostsByDate, usePostActions } from "../../stores/postStore";
import { useUserId } from "../../stores/userStore";

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

const PostDetail = () => {
  const { date } = useParams(); // "2024-01-15" 형식
  const navigate = useNavigate();
  const userId = useUserId();

  const posts = usePostsByDate(date);
  const { loadMonthData, hasMonthCache } = usePostActions();

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
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 -m-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Date Display */}
        <div className="flex items-baseline gap-4 mb-1">
          <span className="text-5xl font-bold">
            {String(dateObj.getDate()).padStart(2, "0")}
          </span>
          <p className="text-gray-500 text-sm">
            {dateObj.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-gray-500 text-sm">
            {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
          </span>
          {posts[0]?.mood &&
            (() => {
              const WeatherIcon = MOOD_ICONS[posts[0].mood].icon;
              return <WeatherIcon className="w-4.5 h-4.5 text-gray-600" />;
            })()}
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

              {/* AI Reflections */}
              {post.aiReflections.length > 0 && (
                <div className="space-y-6 pt-4 mt-6 border-t border-gray-100">
                  {post.aiReflections.map((reflection) => (
                    <div key={reflection.id} className="flex gap-3">
                      <img
                        src={reflection.character.avatarUrl}
                        alt={reflection.character.name}
                        className="w-8 h-8 cursor-pointer rounded-2xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          {reflection.character.koreanName ||
                            reflection.character.name}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {reflection.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
