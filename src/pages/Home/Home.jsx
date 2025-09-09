// pages/Home.jsx
import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Loader2,
} from "lucide-react";
import {
  useMonthlyCache,
  useCurrentMonth,
  useViewMonth,
  useMonthLoading,
  usePostActions,
} from "../../stores/postStore";
import { useUserId } from "../../stores/userStore";
import { postStorage } from "../../components/utils/postStorage";
import "./Home.css";

const MOOD_ICONS = {
  happy: {
    icon: Smile,
    label: "기쁨",
    color: "text-emerald-500",
  },
  neutral: {
    icon: Meh,
    label: "보통",
    color: "text-gray-500",
  },
  sad: {
    icon: Frown,
    label: "슬픔",
    color: "text-blue-400",
  },
};

const Home = () => {
  const userId = useUserId();
  const navigate = useNavigate();

  const [justCreatedDate, setJustCreatedDate] = useState(null);

  const monthlyCache = useMonthlyCache();
  const currentMonthKey = useCurrentMonth();
  const viewMonth = useViewMonth(); // store에서 가져옴
  const {
    loadCurrentMonth,
    loadMonthData,
    prefetchAdjacentMonths,
    hasMonthCache,
    setViewMonth, // store의 setter 사용
  } = usePostActions();

  const viewMonthKey = `${viewMonth.getFullYear()}-${String(
    viewMonth.getMonth() + 1
  ).padStart(2, "0")}`;
  const isLoading = useMonthLoading(viewMonthKey);

  // 초기 로드: 현재 월 데이터
  useEffect(() => {
    if (userId && !currentMonthKey) {
      loadCurrentMonth(userId).then(() => {
        // 현재 월 로드 후 인접 월 프리페치 (선택적)
        const currentKey = `${new Date().getFullYear()}-${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}`;
        prefetchAdjacentMonths(userId, currentKey);
      });
    }
  }, [userId]);

  // sessionStorage에서 방금 작성한 날짜 확인
  useEffect(() => {
    const createdDate = sessionStorage.getItem("just_created_date");
    if (createdDate && userId) {
      const [year, month] = createdDate.split("-").map(Number);
      const createdMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      // 작성한 날짜의 월이 현재 뷰 월과 같으면 강제 리로드
      if (createdMonthKey === viewMonthKey) {
        console.log("Force reloading month after post creation:", viewMonthKey);
        loadMonthData(userId, viewMonthKey, true); // true = forceReload
      }

      setJustCreatedDate(createdDate);
      sessionStorage.removeItem("just_created_date");

      setTimeout(() => {
        setJustCreatedDate(null);
      }, 3000);
    }
  }, [userId, viewMonthKey, loadMonthData]);

  // 뷰 월이 변경되면 해당 월 데이터 로드
  useEffect(() => {
    if (userId && viewMonthKey && !hasMonthCache(viewMonthKey)) {
      loadMonthData(userId, viewMonthKey);
    }
  }, [userId, viewMonthKey]);

  // 현재 보고 있는 월의 캘린더 데이터
  const calendarData = useMemo(() => {
    const monthData = monthlyCache[viewMonthKey];
    if (!monthData?.entries) return {};

    const calendar = {};
    Object.keys(monthData.entries).forEach((dateStr) => {
      const [year, month, day] = dateStr.split("-");
      const key = `${parseInt(year)}-${parseInt(month) - 1}-${parseInt(day)}`;
      calendar[key] = monthData.entries[dateStr];
    });
    return calendar;
  }, [monthlyCache, viewMonthKey]);

  // 최근 엔트리 (모든 캐시된 데이터에서)
  const recentEntries = useMemo(() => {
    const allEntries = [];

    Object.values(monthlyCache).forEach((monthData) => {
      if (monthData?.entries) {
        Object.entries(monthData.entries).forEach(([dateStr, posts]) => {
          allEntries.push({ dateStr, posts });
        });
      }
    });

    // 날짜순 정렬하고 최근 4개만
    return allEntries
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
      .slice(0, 4);
  }, [monthlyCache]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${month}-${day}`;
  };

  const handleMonthChange = async (direction) => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    // 미래 월로 이동 방지
    if (isCurrentOrFutureMonth(newMonth)) {
      return; // 또는 토스트 메시지 표시
    }

    setViewMonth(newMonth); // store의 setter 사용

    // 새로운 월로 이동 시 데이터 로드 (useEffect에서 처리됨)
    const newMonthKey = `${newMonth.getFullYear()}-${String(
      newMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    // 인접 월 프리페치
    if (userId) {
      prefetchAdjacentMonths(userId, newMonthKey);
    }
  };

  const isCurrentOrFutureMonth = (date) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return (
      date.getFullYear() > currentYear ||
      (date.getFullYear() === currentYear && date.getMonth() > currentMonth)
    );
  };

  const isValidDate = (year, month, day) => {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  };

  const handleDateClick = (day) => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const dateKey = formatDateKey(year, month, day);
    const posts = calendarData[dateKey];

    if (posts && posts.length > 0) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      navigate(`/post/${year}-${monthStr}-${dayStr}`);
    } else if (isValidDate(year, month, day)) {
      const selectedDate = new Date(year, month, day);
      postStorage.saveSelectedDate(selectedDate.toISOString());
      navigate("/post/new");
    }
  };

  const handleRecentEntryClick = (dateStr) => {
    navigate(`/post/${dateStr}`);
  };

  // 로딩 상태
  if (!userId) {
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
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-md font-medium min-w-[120px] text-center">
            {viewMonth.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-7 gap-3 mb-4">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-gray-500 font-medium py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: getFirstDayOfMonth(viewMonth) }).map(
              (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              )
            )}

            {Array.from({ length: getDaysInMonth(viewMonth) }).map((_, i) => {
              const day = i + 1;
              const year = viewMonth.getFullYear();
              const month = viewMonth.getMonth();
              const dateKey = formatDateKey(year, month, day);
              const hasEntry = calendarData[dateKey];
              const isToday =
                new Date().toDateString() ===
                new Date(year, month, day).toDateString();
              const isFuture = !isValidDate(year, month, day);
              const isJustCreated = justCreatedDate === dateKey;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                     aspect-square rounded-full flex items-center justify-center text-sm
                     relative 
                     ${
                       hasEntry
                         ? isJustCreated
                           ? "bg-blue-500 text-white font-medium animate-pulse ring-2 ring-blue-300"
                           : "text-shadow-sm text-gray-900 underline underline-offset-4 font-semibold cursor-pointer hover:bg-gray-300"
                         : isToday
                         ? "text-black font-medium hover:bg-gray-200"
                         : isFuture
                         ? "text-gray-300 cursor-not-allowed"
                         : "text-gray-500 hover:bg-gray-200 cursor-pointer"
                     }
                   `}
                  disabled={isFuture || isLoading}
                >
                  {String(day)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <>
            <h3 className="p-2 mb-2 uppercase text-xs tracking-widest text-gray-500">
              Recent
            </h3>
            <div className="space-y-6">
              {recentEntries.map(({ dateStr, posts }) => {
                const [year, month, day] = dateStr.split("-");
                const dateObj = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day)
                );
                const firstPost = posts[0];
                const MoodIcon = firstPost.mood
                  ? MOOD_ICONS[firstPost.mood].icon
                  : null;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleRecentEntryClick(dateStr)}
                    className="w-full text-left rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl font-bold">
                        {String(dateObj.getDate()).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {dateObj.toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {MoodIcon && (
                            <MoodIcon
                              className={`w-4.5 h-4.5 ${
                                firstPost.mood
                                  ? MOOD_ICONS[firstPost.mood].color
                                  : "text-gray-600"
                              }`}
                            />
                          )}
                        </div>

                        <span className="text-sm text-gray-500">
                          {dateObj.toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </span>

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
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
