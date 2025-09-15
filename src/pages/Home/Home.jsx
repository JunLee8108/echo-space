// // pages/Home.jsx
// import { useMemo, useEffect, useState } from "react";
// import { useNavigate } from "react-router";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Smile,
//   Meh,
//   Frown,
//   Loader2,
// } from "lucide-react";
// import {
//   useMonthlyCache,
//   useCurrentMonth,
//   useViewMonth,
//   useMonthLoading,
//   usePostActions,
// } from "../../stores/postStore";
// import { useUserId } from "../../stores/userStore";
// import { postStorage } from "../../components/utils/postStorage";
// import "./Home.css";

// const MOOD_ICONS = {
//   happy: {
//     icon: Smile,
//     label: "기쁨",
//     color: "text-emerald-500",
//   },
//   neutral: {
//     icon: Meh,
//     label: "보통",
//     color: "text-gray-500",
//   },
//   sad: {
//     icon: Frown,
//     label: "슬픔",
//     color: "text-blue-400",
//   },
// };

// const Home = () => {
//   const userId = useUserId();
//   const navigate = useNavigate();

//   const [justCreatedDate, setJustCreatedDate] = useState(null);

//   const monthlyCache = useMonthlyCache();
//   const currentMonthKey = useCurrentMonth();
//   const viewMonth = useViewMonth(); // store에서 가져옴
//   const {
//     loadCurrentMonth,
//     loadMonthData,
//     prefetchAdjacentMonths,
//     hasMonthCache,
//     setViewMonth, // store의 setter 사용
//   } = usePostActions();

//   const viewMonthKey = `${viewMonth.getFullYear()}-${String(
//     viewMonth.getMonth() + 1
//   ).padStart(2, "0")}`;
//   const isLoading = useMonthLoading(viewMonthKey);

//   // 초기 로드: 현재 월 데이터
//   useEffect(() => {
//     if (userId && !currentMonthKey) {
//       loadCurrentMonth(userId).then(() => {
//         // 현재 월 로드 후 인접 월 프리페치 (선택적)
//         const currentKey = `${new Date().getFullYear()}-${String(
//           new Date().getMonth() + 1
//         ).padStart(2, "0")}`;

//         prefetchAdjacentMonths(userId, currentKey);
//       });
//     }
//   }, [userId]);

//   // sessionStorage에서 방금 작성한 날짜 확인
//   useEffect(() => {
//     const createdDate = sessionStorage.getItem("just_created_date");
//     if (createdDate && userId) {
//       const [year, month, day] = createdDate.split("-").map(Number);

//       const createdMonthKey = `${year}-${String(month).padStart(2, "0")}`;

//       const createdDateKey = `${createdMonthKey}-${String(day).padStart(
//         2,
//         "0"
//       )}`;

//       // 작성한 날짜의 월이 현재 뷰 월과 같으면 강제 리로드
//       if (createdMonthKey === viewMonthKey) {
//         console.log("Force reloading month after post creation:", viewMonthKey);
//         loadMonthData(userId, viewMonthKey, true); // true = forceReload
//       }

//       setJustCreatedDate(createdDateKey);
//       sessionStorage.removeItem("just_created_date");

//       setTimeout(() => {
//         setJustCreatedDate(null);
//       }, 3000);
//     }
//   }, [userId, viewMonthKey, loadMonthData]);

//   // 뷰 월이 변경되면 해당 월 데이터 로드
//   useEffect(() => {
//     if (userId && viewMonthKey && !hasMonthCache(viewMonthKey)) {
//       loadMonthData(userId, viewMonthKey);
//     }
//   }, [userId, viewMonthKey]);

//   // 현재 보고 있는 월의 캘린더 데이터
//   const calendarData = useMemo(() => {
//     const monthData = monthlyCache[viewMonthKey];
//     return monthData?.entries || {};
//   }, [monthlyCache, viewMonthKey]);

//   // 최근 엔트리 (모든 캐시된 데이터에서)
//   const recentEntries = useMemo(() => {
//     const allEntries = [];

//     Object.values(monthlyCache).forEach((monthData) => {
//       if (monthData?.entries) {
//         Object.entries(monthData.entries).forEach(([dateStr, posts]) => {
//           allEntries.push({ dateStr, posts });
//         });
//       }
//     });

//     // 날짜순 정렬하고 최근 4개만
//     return allEntries
//       .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
//       .slice(0, 4);
//   }, [monthlyCache]);

//   const getDaysInMonth = (date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const formatDateKey = (year, month, day) => {
//     const monthStr = String(month + 1).padStart(2, "0");
//     const dayStr = String(day).padStart(2, "0");
//     return `${year}-${monthStr}-${dayStr}`;
//   };

//   const handleMonthChange = async (direction) => {
//     const newMonth = new Date(viewMonth);
//     newMonth.setMonth(newMonth.getMonth() + direction);

//     // 미래 월로 이동 방지
//     if (isCurrentOrFutureMonth(newMonth)) {
//       return; // 또는 토스트 메시지 표시
//     }

//     setViewMonth(newMonth); // store의 setter 사용

//     // 새로운 월로 이동 시 데이터 로드 (useEffect에서 처리됨)
//     const newMonthKey = `${newMonth.getFullYear()}-${String(
//       newMonth.getMonth() + 1
//     ).padStart(2, "0")}`;

//     // 인접 월 프리페치
//     if (userId) {
//       prefetchAdjacentMonths(userId, newMonthKey);
//     }
//   };

//   const isCurrentOrFutureMonth = (date) => {
//     const today = new Date();
//     const currentYear = today.getFullYear();
//     const currentMonth = today.getMonth();

//     return (
//       date.getFullYear() > currentYear ||
//       (date.getFullYear() === currentYear && date.getMonth() > currentMonth)
//     );
//   };

//   const isValidDate = (year, month, day) => {
//     const selectedDate = new Date(year, month, day);
//     const today = new Date();
//     today.setHours(23, 59, 59, 999);
//     return selectedDate <= today;
//   };

//   const handleDateClick = (day) => {
//     const year = viewMonth.getFullYear();
//     const month = viewMonth.getMonth();
//     const dateKey = formatDateKey(year, month, day);
//     const posts = calendarData[dateKey];

//     if (posts && posts.length > 0) {
//       navigate(`/post/${dateKey}`);
//     } else if (isValidDate(year, month, day)) {
//       const selectedDate = new Date(year, month, day);
//       postStorage.saveSelectedDate(selectedDate.toISOString());
//       navigate("/post/new");
//     }
//   };

//   const handleRecentEntryClick = (dateStr) => {
//     navigate(`/post/${dateStr}`);
//   };

//   // 로딩 상태
//   if (!userId) {
//     return (
//       <div className="min-h-screen bg-white">
//         <div className="max-w-2xl mx-auto px-6 py-8">
//           <div className="animate-pulse">
//             <div className="h-12 bg-gray-100 rounded mb-6"></div>
//             <div className="h-96 bg-gray-100 rounded-2xl"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       <div className="max-w-2xl mx-auto px-6 py-8">
//         {/* Month Navigation */}
//         <div className="flex items-center justify-center gap-4 mb-6">
//           <button
//             onClick={() => handleMonthChange(-1)}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <ChevronLeft className="w-6 h-6" />
//           </button>
//           <h2 className="text-md font-medium min-w-[120px] text-center">
//             {viewMonth.toLocaleDateString("en-US", {
//               month: "short",
//               year: "numeric",
//             })}
//           </h2>
//           <button
//             onClick={() => handleMonthChange(1)}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <ChevronRight className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Calendar Grid */}
//         <div className="mb-8">
//           <div className="grid grid-cols-7 gap-3 mb-4">
//             {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
//               <div
//                 key={day}
//                 className="text-center text-xs text-gray-500 font-medium py-2"
//               >
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-3">
//             {Array.from({ length: getFirstDayOfMonth(viewMonth) }).map(
//               (_, i) => (
//                 <div key={`empty-${i}`} className="aspect-square" />
//               )
//             )}

//             {Array.from({ length: getDaysInMonth(viewMonth) }).map((_, i) => {
//               const day = i + 1;
//               const year = viewMonth.getFullYear();
//               const month = viewMonth.getMonth();
//               const dateKey = formatDateKey(year, month, day);
//               const hasEntry = calendarData[dateKey];
//               const isToday =
//                 new Date().toDateString() ===
//                 new Date(year, month, day).toDateString();
//               const isFuture = !isValidDate(year, month, day);
//               const isJustCreated = justCreatedDate === dateKey;

//               return (
//                 <button
//                   key={day}
//                   onClick={() => handleDateClick(day)}
//                   className={`
//                      aspect-square rounded-full flex items-center justify-center text-sm
//                      relative
//                      ${
//                        hasEntry
//                          ? isJustCreated
//                            ? "bg-blue-500 text-white font-medium animate-pulse ring-2 ring-blue-300"
//                            : "text-shadow-sm text-gray-900 underline underline-offset-4 font-semibold cursor-pointer hover:bg-gray-300"
//                          : isToday
//                          ? "text-black font-medium hover:bg-gray-200"
//                          : isFuture
//                          ? "text-gray-300 cursor-not-allowed"
//                          : "text-gray-500 hover:bg-gray-200 cursor-pointer"
//                      }
//                    `}
//                   disabled={isFuture || isLoading}
//                 >
//                   {String(day)}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Recent Entries */}
//         {recentEntries.length > 0 && (
//           <>
//             <h3 className="p-2 mb-2 uppercase text-xs tracking-widest text-gray-500">
//               Recent
//             </h3>
//             <div className="space-y-6">
//               {recentEntries.map(({ dateStr, posts }) => {
//                 const [year, month, day] = dateStr.split("-");
//                 const dateObj = new Date(
//                   parseInt(year),
//                   parseInt(month) - 1,
//                   parseInt(day)
//                 );
//                 const firstPost = posts[0];
//                 const MoodIcon = firstPost.mood
//                   ? MOOD_ICONS[firstPost.mood].icon
//                   : null;

//                 return (
//                   <button
//                     key={dateStr}
//                     onClick={() => handleRecentEntryClick(dateStr)}
//                     className="w-full text-left rounded-lg p-2 transition-colors hover:bg-gray-50"
//                   >
//                     <div className="flex items-start gap-4">
//                       <span className="text-3xl font-bold">
//                         {String(dateObj.getDate()).padStart(2, "0")}
//                       </span>
//                       <div className="flex-1">
//                         <div className="flex justify-between items-center gap-2">
//                           <p className="text-xs text-gray-500">
//                             {dateObj.toLocaleDateString("en-US", {
//                               month: "short",
//                               year: "numeric",
//                             })}
//                           </p>
//                           {MoodIcon && (
//                             <MoodIcon
//                               className={`w-4.5 h-4.5 ${
//                                 firstPost.mood
//                                   ? MOOD_ICONS[firstPost.mood].color
//                                   : "text-gray-600"
//                               }`}
//                             />
//                           )}
//                         </div>

//                         <span className="text-sm text-gray-500">
//                           {dateObj.toLocaleDateString("en-US", {
//                             weekday: "long",
//                           })}
//                         </span>

//                         <p className="text-sm text-gray-700 mt-2 line-clamp-2">
//                           {firstPost.content
//                             .replace(/<[^>]*>/g, "")
//                             .substring(0, 100)}
//                           ...
//                         </p>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;

// pages/Home.jsx
import { useMemo, useEffect, useState, useRef, useCallback } from "react";
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

// 스와이프 관련 상수
const SWIPE_THRESHOLD = 50; // 스와이프 인식 최소 거리 (px)
const SWIPE_VELOCITY_THRESHOLD = 0.3; // 빠른 스와이프 속도 임계값
const ANIMATION_DURATION = 300; // 애니메이션 지속 시간 (ms)
const DRAG_RESISTANCE = 0.5; // 드래그 저항 계수
const BOUNCE_RESISTANCE = 0.2; // 경계에서의 바운스 저항

const Home = () => {
  const userId = useUserId();
  const navigate = useNavigate();

  const [justCreatedDate, setJustCreatedDate] = useState(null);

  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(0);

  // 터치 시작 시간 (속도 계산용)
  const touchStartTime = useRef(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const swipeAreaRef = useRef(null);

  const monthlyCache = useMonthlyCache();
  const currentMonthKey = useCurrentMonth();
  const viewMonth = useViewMonth();
  const {
    loadCurrentMonth,
    loadMonthData,
    prefetchAdjacentMonths,
    hasMonthCache,
    setViewMonth,
  } = usePostActions();

  const viewMonthKey = `${viewMonth.getFullYear()}-${String(
    viewMonth.getMonth() + 1
  ).padStart(2, "0")}`;
  const isLoading = useMonthLoading(viewMonthKey);

  // 이전/다음 월 계산
  const prevMonth = useMemo(() => {
    const date = new Date(viewMonth);
    date.setMonth(date.getMonth() - 1);
    return date;
  }, [viewMonth]);

  const nextMonth = useMemo(() => {
    const date = new Date(viewMonth);
    date.setMonth(date.getMonth() + 1);
    return date;
  }, [viewMonth]);

  // 캘린더 높이 측정
  useEffect(() => {
    if (calendarRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setCalendarHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(calendarRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // 스크롤 방지를 위한 이벤트 리스너
  useEffect(() => {
    const element = swipeAreaRef.current;
    if (!element) return;

    const preventScroll = (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // touchmove 이벤트에 passive: false 설정
    element.addEventListener("touchmove", preventScroll, { passive: false });

    // 드래그 중일 때 body 스크롤도 방지
    if (isDragging) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      element.removeEventListener("touchmove", preventScroll);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isDragging]);

  // 초기 로드: 현재 월 데이터
  useEffect(() => {
    if (userId && !currentMonthKey) {
      loadCurrentMonth(userId).then(() => {
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
      const [year, month, day] = createdDate.split("-").map(Number);
      const createdMonthKey = `${year}-${String(month).padStart(2, "0")}`;
      const createdDateKey = `${createdMonthKey}-${String(day).padStart(
        2,
        "0"
      )}`;

      if (createdMonthKey === viewMonthKey) {
        console.log("Force reloading month after post creation:", viewMonthKey);
        loadMonthData(userId, viewMonthKey, true);
      }

      setJustCreatedDate(createdDateKey);
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
    return monthData?.entries || {};
  }, [monthlyCache, viewMonthKey]);

  // 이전/다음 월 캘린더 데이터
  const prevMonthData = useMemo(() => {
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(
      prevMonth.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthData = monthlyCache[prevMonthKey];
    return monthData?.entries || {};
  }, [monthlyCache, prevMonth]);

  const nextMonthData = useMemo(() => {
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthData = monthlyCache[nextMonthKey];
    return monthData?.entries || {};
  }, [monthlyCache, nextMonth]);

  // 최근 엔트리
  const recentEntries = useMemo(() => {
    const allEntries = [];
    Object.values(monthlyCache).forEach((monthData) => {
      if (monthData?.entries) {
        Object.entries(monthData.entries).forEach(([dateStr, posts]) => {
          allEntries.push({ dateStr, posts });
        });
      }
    });
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
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
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

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback(
    (e) => {
      if (isAnimating) return;

      // 캘린더 영역 내에서만 스와이프 활성화
      const touch = e.touches[0];
      setTouchStart(touch.clientY);
      setTouchEnd(null);
      setIsDragging(true);
      touchStartTime.current = Date.now();
    },
    [isAnimating]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!touchStart || isAnimating) return;

      e.preventDefault(); // 스크롤 방지

      const touch = e.touches[0];
      const currentTouch = touch.clientY;
      setTouchEnd(currentTouch);

      // 드래그 오프셋 계산
      let offset = (currentTouch - touchStart) * DRAG_RESISTANCE;

      // 경계 저항 적용
      // 아래로 드래그(이전 월로 가려는 경우)
      if (offset > 0) {
        // 첫 번째 월인지 체크 (더 이상 이전 월이 없는 경우)
        const isFirstAvailableMonth = false; // 필요시 구현
        if (isFirstAvailableMonth) {
          offset = offset * BOUNCE_RESISTANCE;
          offset = Math.min(offset, 30); // 최대 30px 바운스
        }
      }
      // 위로 드래그(다음 월로 가려는 경우)
      else if (offset < 0) {
        // 미래 월인지 체크
        if (isCurrentOrFutureMonth(nextMonth)) {
          offset = offset * BOUNCE_RESISTANCE;
          offset = Math.max(offset, -30); // 최대 -30px 바운스
        }
      }

      setDragOffset(offset);
    },
    [touchStart, isAnimating, nextMonth]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!touchStart || !touchEnd || isAnimating) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchEnd - touchStart;
    const absDistance = Math.abs(distance);
    const velocity = absDistance / (Date.now() - touchStartTime.current);

    // 스와이프 판정
    if (absDistance > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      setIsAnimating(true);

      if (distance > 0) {
        // 아래로 스와이프 → 이전 월로 이동
        // (이전 월이 위에서 아래로 내려옴)
        setDragOffset(calendarHeight);

        setTimeout(() => {
          setViewMonth(prevMonth);
          setDragOffset(0);
          setIsAnimating(false);

          if (userId) {
            const prevMonthKey = `${prevMonth.getFullYear()}-${String(
              prevMonth.getMonth() + 1
            ).padStart(2, "0")}`;
            prefetchAdjacentMonths(userId, prevMonthKey);
          }
        }, ANIMATION_DURATION);
      } else {
        // 위로 스와이프 → 다음 월로 이동
        // (다음 월이 아래에서 위로 올라옴)
        if (!isCurrentOrFutureMonth(nextMonth)) {
          setDragOffset(-calendarHeight);

          setTimeout(() => {
            setViewMonth(nextMonth);
            setDragOffset(0);
            setIsAnimating(false);

            if (userId) {
              const nextMonthKey = `${nextMonth.getFullYear()}-${String(
                nextMonth.getMonth() + 1
              ).padStart(2, "0")}`;
              prefetchAdjacentMonths(userId, nextMonthKey);
            }
          }, ANIMATION_DURATION);
        } else {
          // 미래 월로는 이동 불가 - 바운스 백
          setDragOffset(0);
          setTimeout(() => {
            setIsAnimating(false);
          }, ANIMATION_DURATION);
        }
      }
    } else {
      // 스와이프 취소 - 원위치로 복귀
      setDragOffset(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  }, [
    touchStart,
    touchEnd,
    isAnimating,
    calendarHeight,
    prevMonth,
    nextMonth,
    userId,
    setViewMonth,
    prefetchAdjacentMonths,
  ]);

  const handleMonthChange = async (direction) => {
    if (isAnimating) return;

    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    // 미래 월로는 이동 불가
    if (direction === 1 && isCurrentOrFutureMonth(newMonth)) {
      return;
    }

    setIsAnimating(true);

    // 버튼 클릭 시에도 자연스러운 애니메이션
    // direction이 -1이면 이전 월 (아래로 스와이프 효과)
    // direction이 1이면 다음 월 (위로 스와이프 효과)
    setDragOffset(direction === -1 ? calendarHeight : -calendarHeight);

    setTimeout(() => {
      setViewMonth(newMonth);
      setDragOffset(0);
      setIsAnimating(false);

      const newMonthKey = `${newMonth.getFullYear()}-${String(
        newMonth.getMonth() + 1
      ).padStart(2, "0")}`;
      if (userId) {
        prefetchAdjacentMonths(userId, newMonthKey);
      }
    }, ANIMATION_DURATION);
  };

  const handleDateClick = (day, monthOffset = 0) => {
    if (isDragging || isAnimating) return; // 드래그 중이거나 애니메이션 중에는 클릭 무시

    const targetMonth = new Date(viewMonth);
    targetMonth.setMonth(targetMonth.getMonth() + monthOffset);

    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const dateKey = formatDateKey(year, month, day);

    let posts;
    if (monthOffset === -1) {
      posts = prevMonthData[dateKey];
    } else if (monthOffset === 1) {
      posts = nextMonthData[dateKey];
    } else {
      posts = calendarData[dateKey];
    }

    if (posts && posts.length > 0) {
      navigate(`/post/${dateKey}`);
    } else if (isValidDate(year, month, day)) {
      const selectedDate = new Date(year, month, day);
      postStorage.saveSelectedDate(selectedDate.toISOString());
      navigate("/post/new");
    }
  };

  const handleRecentEntryClick = (dateStr) => {
    navigate(`/post/${dateStr}`);
  };

  // 캘린더 그리드 렌더링 함수
  const renderCalendarGrid = (month, data, monthOffset = 0) => {
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const year = month.getFullYear();
    const monthNum = month.getMonth();

    return (
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = formatDateKey(year, monthNum, day);
          const hasEntry = data[dateKey];
          const isToday =
            new Date().toDateString() ===
            new Date(year, monthNum, day).toDateString();
          const isFuture = !isValidDate(year, monthNum, day);
          const isJustCreated =
            justCreatedDate === dateKey && monthOffset === 0;

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day, monthOffset)}
              className={`
                aspect-square rounded-full flex items-center justify-center text-sm
                relative transition-all select-none
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
    );
  };

  // 월 이름 렌더링 함수
  const renderMonthTitle = (month) => {
    return month.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

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
            disabled={isAnimating}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-md font-medium min-w-[120px] text-center select-none">
            {renderMonthTitle(viewMonth)}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isAnimating || isCurrentOrFutureMonth(nextMonth)}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Container with Swipe */}
        <div
          ref={containerRef}
          className="mb-8 overflow-hidden"
          style={{ height: calendarHeight || "auto" }}
        >
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-3 mb-4 relative z-10">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-gray-500 font-medium py-2 select-none"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Swipeable Calendar Area */}
          <div
            ref={swipeAreaRef}
            className="relative touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: !isDragging
                ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                : "none",
              willChange: isDragging ? "transform" : "auto",
            }}
          >
            {/* Previous Month (위에 숨겨짐) */}
            <div
              className="absolute w-full"
              style={{
                top: `-${calendarHeight}px`,
                opacity:
                  dragOffset > 0
                    ? Math.min(1, dragOffset / (calendarHeight * 0.5))
                    : 0,
                pointerEvents:
                  dragOffset > calendarHeight * 0.5 ? "auto" : "none",
              }}
            >
              {/* 이전 월 타이틀 (스와이프 시 보임) */}
              <div className="text-center mb-4 text-sm text-gray-600 font-medium">
                {renderMonthTitle(prevMonth)}
              </div>
              {renderCalendarGrid(prevMonth, prevMonthData, -1)}
            </div>

            {/* Current Month */}
            <div
              ref={calendarRef}
              style={{
                opacity: 1 - Math.abs(dragOffset) / calendarHeight,
              }}
            >
              {renderCalendarGrid(viewMonth, calendarData, 0)}
            </div>

            {/* Next Month (아래에 숨겨짐) */}
            <div
              className="absolute w-full"
              style={{
                top: `${calendarHeight}px`,
                opacity:
                  dragOffset < 0
                    ? Math.min(1, -dragOffset / (calendarHeight * 0.5))
                    : 0,
                pointerEvents:
                  dragOffset < -calendarHeight * 0.5 ? "auto" : "none",
              }}
            >
              {/* 다음 월 타이틀 (스와이프 시 보임) */}
              <div className="text-center mb-4 text-sm text-gray-600 font-medium">
                {renderMonthTitle(nextMonth)}
              </div>
              {renderCalendarGrid(nextMonth, nextMonthData, 1)}
            </div>
          </div>
        </div>

        {/* Swipe Indicator (optional) */}
        {isDragging && Math.abs(dragOffset) > 20 && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {dragOffset > 0 ? "← Previous Month" : "Next Month →"}
            </div>
          </div>
        )}

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
