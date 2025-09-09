// pages/Home.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Sun,
  CloudRain,
  Plus,
} from "lucide-react";

import {
  useRecentPosts,
  usePostsLoading,
  usePostActions,
} from "../../stores/postStore";
import { useUserId } from "../../stores/userStore";
import { postStorage } from "../../components/utils/postStorage";
import "./Home.css";

const WEATHER_ICONS = {
  happy: { icon: Sun, label: "맑음" },
  neutral: { icon: Cloud, label: "흐림" },
  sad: { icon: CloudRain, label: "비" },
};

const Home = () => {
  const userId = useUserId();
  const navigate = useNavigate();

  const recentPosts = useRecentPosts();
  const loading = usePostsLoading();
  const { loadRecentPosts } = usePostActions();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 데이터 로드
  useEffect(() => {
    if (userId && !recentPosts) {
      loadRecentPosts(userId);
    }
  }, [userId]);

  // 캘린더 데이터
  const calendarData = useMemo(() => {
    if (!recentPosts?.entries) return {};

    const calendar = {};
    Object.keys(recentPosts.entries).forEach((dateStr) => {
      const [year, month, day] = dateStr.split("-");
      const key = `${parseInt(year)}-${parseInt(month) - 1}-${parseInt(day)}`;
      calendar[key] = recentPosts.entries[dateStr];
    });
    return calendar;
  }, [recentPosts]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${month}-${day}`;
  };

  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // 날짜 유효성 검사 (미래 날짜 방지)
  const isValidDate = (year, month, day) => {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  };

  // 날짜 클릭 핸들러 - 수정됨
  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateKey = formatDateKey(year, month, day);
    const posts = calendarData[dateKey];

    if (posts && posts.length > 0) {
      // 기존: 작성된 일기가 있으면 해당 날짜 페이지로 이동
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      navigate(`/post/${year}-${monthStr}-${dayStr}`);
    } else if (isValidDate(year, month, day)) {
      // 새로운: 빈 날짜이고 유효한 날짜면 일기 작성
      const selectedDate = new Date(year, month, day);
      postStorage.saveSelectedDate(selectedDate.toISOString());
      navigate("/post/new");
    }
  };

  const handleRecentEntryClick = (dateStr) => {
    navigate(`/post/${dateStr}`);
  };

  const sortedDates = Object.keys(recentPosts?.entries || {})
    .sort()
    .reverse()
    .slice(0, 3);

  if (loading || !recentPosts) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-100 rounded mb-6"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button onClick={() => handleMonthChange(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-md font-medium">
            {currentMonth.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </h2>
          <button onClick={() => handleMonthChange(1)}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-gray-500 font-medium py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map(
              (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              )
            )}

            {Array.from({ length: getDaysInMonth(currentMonth) }).map(
              (_, i) => {
                const day = i + 1;
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const dateKey = formatDateKey(year, month, day);
                const hasEntry = calendarData[dateKey];
                const isToday =
                  new Date().toDateString() ===
                  new Date(year, month, day).toDateString();
                const isFuture = !isValidDate(year, month, day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`
                     aspect-square rounded-full flex items-center justify-center text-sm
                     relative 
                     ${
                       hasEntry
                         ? "bg-black text-white font-medium cursor-pointer"
                         : isToday
                         ? "ring-1 ring-gray-400 text-black font-medium hover:bg-gray-200"
                         : isFuture
                         ? "text-gray-300 cursor-not-allowed"
                         : "text-gray-700 hover:bg-gray-200 cursor-pointer"
                     }
                   `}
                    disabled={isFuture}
                  >
                    {String(day)}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <h3 className="p-2 mb-2 uppercase text-xs tracking-widest text-gray-500">
          Recent
        </h3>
        {/* Recent Entries */}
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const posts = recentPosts.entries[date];
            const [year, month, day] = date.split("-");
            const dateObj = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            const firstPost = posts[0];
            const WeatherIcon = firstPost.mood
              ? WEATHER_ICONS[firstPost.mood].icon
              : null;

            return (
              <button
                key={date}
                onClick={() => handleRecentEntryClick(date)}
                className="w-full text-left rounded-lg p-2 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-bold">
                    {String(dateObj.getDate()).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      {dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {dateObj.toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </span>
                      {WeatherIcon && (
                        <WeatherIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {firstPost.content
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 100)}
                      ...
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
