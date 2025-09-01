// pages/Post/Post.jsx
import "./Post.css";

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  Smile,
  Meh,
  Frown,
  ArrowLeft,
  Globe,
  Lock,
  Bot,
  BotOff,
  Calendar,
  CalendarDays,
  Hash,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import CustomEditor from "./CustomEditor";
import { searchHashtags } from "../../services/hashtagService";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { useUpdatePost } from "../../components/hooks/useUpdatePost";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";

// Custom Calendar Component
const CustomCalendar = ({
  selectedDate,
  onSelectDate,
  onClose,
  userLanguage,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate || new Date();
  });

  // Get calendar data
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const selectToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    onSelectDate(today);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const monthNames =
    userLanguage === "Korean"
      ? [
          "1월",
          "2월",
          "3월",
          "4월",
          "5월",
          "6월",
          "7월",
          "8월",
          "9월",
          "10월",
          "11월",
          "12월",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

  const weekDays =
    userLanguage === "Korean"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-stone-700" />
          </button>

          <h3 className="text-sm font-semibold text-stone-900">
            {userLanguage === "Korean"
              ? `${currentMonth.getFullYear()}년 ${
                  monthNames[currentMonth.getMonth()]
                }`
              : `${
                  monthNames[currentMonth.getMonth()]
                } ${currentMonth.getFullYear()}`}
          </h3>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-stone-700" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-stone-100">
        <button
          onClick={selectToday}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
        >
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {userLanguage === "Korean" ? "오늘" : "Today"}
          </span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-stone-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-7 gap-1">
          {getCalendarDays().map((date, index) => {
            const isInCurrentMonth = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);

            return (
              <button
                key={index}
                onClick={() => {
                  if (isInCurrentMonth) {
                    const newDate = new Date(date);
                    newDate.setHours(12, 0, 0, 0);
                    onSelectDate(newDate);
                  }
                }}
                disabled={!isInCurrentMonth}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                  ${
                    !isInCurrentMonth
                      ? "text-stone-300 cursor-not-allowed"
                      : "text-stone-700 hover:bg-stone-50"
                  }
                  ${
                    isTodayDate && !isSelectedDate
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : ""
                  }
                  ${
                    isSelectedDate
                      ? "bg-blue-500 text-white font-semibold hover:bg-blue-600"
                      : ""
                  }
                `}
              >
                {date.getDate()}
                {isTodayDate && !isSelectedDate && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 py-1 bg-stone-50 border-t border-stone-100">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
        >
          {userLanguage === "Korean" ? "닫기" : "Close"}
        </button>
      </div>
    </div>
  );
};

const MOODS = [
  {
    id: "happy",
    icon: Smile,
    label: "Happy",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    selectedBg: "bg-amber-100",
    selectedBorder: "border-amber-500",
  },
  {
    id: "neutral",
    icon: Meh,
    label: "Neutral",
    color: "text-stone-500",
    bgColor: "bg-stone-50",
    borderColor: "border-stone-200",
    selectedBg: "bg-stone-100",
    selectedBorder: "border-stone-500",
  },
  {
    id: "sad",
    icon: Frown,
    label: "Sad",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    selectedBg: "bg-blue-100",
    selectedBorder: "border-blue-500",
  },
];

const Post = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const userLanguage = useUserLanguage();
  const translate = createTranslator(userLanguage);

  const isEditMode = !!id;
  const editingPost = location.state?.post || null;

  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  // State - 날짜 초기화 수정
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0); // 정오로 설정하여 시간대 문제 방지
    return date;
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState("private");
  const [allowAIComments, setAllowAIComments] = useState(true);

  // 해시태그 관련 상태
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Section refs for scroll
  const dateRef = useRef(null);
  const calendarRef = useRef(null);
  const moodRef = useRef(null);
  const visibilityRef = useRef(null);
  const aiRef = useRef(null);
  const hashtagRef = useRef(null);
  const contentRef = useRef(null);

  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (isEditMode && editingPost) {
      setContent(editingPost.content || "");

      if (editingPost.created_at) {
        const date = new Date(editingPost.created_at);
        date.setHours(12, 0, 0, 0); // 시간대 문제 방지
        setSelectedDate(date);
      }

      if (editingPost.mood && MOODS.find((m) => m.id === editingPost.mood)) {
        setSelectedMood(MOODS.find((m) => m.id === editingPost.mood));
      }

      if (editingPost.Post_Hashtag && editingPost.Post_Hashtag.length > 0) {
        const hashtags = editingPost.Post_Hashtag.map((h) => h.name);
        setSelectedHashtags(hashtags);
      }

      if (editingPost.visibility) {
        setVisibility(editingPost.visibility);
      }

      if (editingPost.allow_ai_comments !== undefined) {
        setAllowAIComments(editingPost.allow_ai_comments);
      }
    }
  }, [isEditMode, editingPost]);

  // Handle outside clicks for calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showCalendar) {
          setShowCalendar(false);
        } else {
          handleBack();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showCalendar]);

  // 해시태그 자동완성
  useEffect(() => {
    const searchDelay = setTimeout(async () => {
      if (hashtagInput.length > 0) {
        setIsSearching(true);
        try {
          const suggestions = await searchHashtags(hashtagInput);
          setHashtagSuggestions(suggestions);
        } catch (error) {
          console.error("해시태그 검색 실패:", error);
          setHashtagSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setHashtagSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchDelay);
  }, [hashtagInput]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleBack = () => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    if (plainText && !isSubmitting) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) {
      // 콘텐츠 섹션으로 스크롤
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    let processedContent = content.replace(
      /(<div>(?:<[^>]+>)*(?:\s|&nbsp;|<br\s*\/?>)*(?:<\/[^>]+>)*<\/div>)+$/g,
      ""
    );

    // 날짜를 정오로 설정하여 시간대 문제 방지
    const postDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      12,
      0,
      0
    );

    const postData = {
      content: processedContent,
      mood: selectedMood?.id || null,
      hashtags: selectedHashtags,
      visibility: visibility,
      allowAIComments: allowAIComments,
      created_at: postDate.toISOString(),
    };

    setIsSubmitting(true);

    try {
      if (isEditMode && editingPost) {
        await updatePostMutation.mutateAsync({
          postId: editingPost.id,
          ...postData,
        });
      } else {
        const newPost = {
          id: Date.now(),
          ...postData,
        };
        await createPostMutation.mutateAsync(newPost);
      }

      navigate("/");
    } catch (error) {
      console.error("포스트 저장 실패:", error);
      setIsSubmitting(false);
    }
  };

  const handleHashtagAdd = () => {
    const trimmedInput = hashtagInput.trim().toLowerCase();
    if (trimmedInput && !selectedHashtags.includes(trimmedInput)) {
      setSelectedHashtags([...selectedHashtags, trimmedInput]);
      setHashtagInput("");
      setHashtagSuggestions([]);
    }
  };

  const handleHashtagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return;
      handleHashtagAdd();
    }
  };

  const handleHashtagRemove = (hashtagToRemove) => {
    setSelectedHashtags(
      selectedHashtags.filter((tag) => tag !== hashtagToRemove)
    );
  };

  const handleSuggestionClick = (suggestion) => {
    const tagName = suggestion.name.toLowerCase();
    if (!selectedHashtags.includes(tagName)) {
      setSelectedHashtags([...selectedHashtags, tagName]);
    }
    setHashtagInput("");
    setHashtagSuggestions([]);
  };

  const formatDate = (date) => {
    if (!date) return "";

    // 정오로 설정된 날짜로 포맷팅
    const displayDate = new Date(date);
    displayDate.setHours(12, 0, 0, 0);

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return displayDate.toLocaleDateString(
      userLanguage === "Korean" ? "ko-KR" : "en-US",
      options
    );
  };

  const plainTextContent = content.replace(/<[^>]*>/g, "").trim();
  const isButtonDisabled = !plainTextContent;

  // Check which sections are completed
  const isDateCompleted = selectedDate !== null;
  const isMoodCompleted = selectedMood !== null;
  const isContentCompleted = plainTextContent.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 py-3 pb-0">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-md font-semibold text-stone-900">
              {isEditMode
                ? translate("post.editTitle")
                : translate("post.title")}
            </h1>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled || isSubmitting}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              isButtonDisabled || isSubmitting
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Post"
            )}
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                isDateCompleted ? "bg-green-500" : "bg-stone-200"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                isMoodCompleted ? "bg-green-500" : "bg-stone-200"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                isContentCompleted ? "bg-green-500" : "bg-stone-200"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-safe">
        {/* Date Section */}
        <div
          ref={dateRef}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-md font-semibold text-stone-900">Date</h2>
              </div>
            </div>
            {isDateCompleted && <Check className="w-5 h-5 text-green-500" />}
          </div>

          <div className="space-y-3">
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full flex items-center justify-between px-4 py-3 border border-stone-200 hover:border-stone-300 rounded-xl transition-colors"
              >
                <span className="text-sm text-stone-700">
                  {formatDate(selectedDate)}
                </span>
                <Calendar className="w-5 h-5 text-stone-400" />
              </button>

              {/* Custom Calendar */}
              {showCalendar && (
                <CustomCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  onClose={() => setShowCalendar(false)}
                  userLanguage={userLanguage}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mood Section */}
        <div
          ref={moodRef}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Smile className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-md font-semibold text-stone-900">Mood</h2>
              </div>
            </div>
            {isMoodCompleted && <Check className="w-5 h-5 text-green-500" />}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMood?.id === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(isSelected ? null : mood)}
                  className={`relative p-4 rounded-xl border-1 transition-all ${
                    isSelected
                      ? `${mood.selectedBg} ${mood.selectedBorder} shadow-sm`
                      : `${mood.bgColor} border-stone-200`
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${mood.color}`} />
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? mood.color : "text-stone-700"
                    }`}
                  >
                    {mood.label}
                  </p>
                  {isSelected && (
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 ${mood.selectedBg} ${mood.selectedBorder} border-2 rounded-full flex items-center justify-center`}
                    >
                      <Check className={`w-3 h-3 ${mood.color}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility Section */}
        <div
          ref={visibilityRef}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {visibility === "public" ? (
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
              ) : (
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Lock className="w-4 h-4 text-purple-600" />
                </div>
              )}

              <div>
                <h2 className="text-md font-semibold text-stone-900">
                  Privacy
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setVisibility("private")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-1 transition-all ${
                visibility === "private"
                  ? "bg-purple-50 border-purple-500"
                  : "bg-white border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock
                  className={`w-4 h-4 ${
                    visibility === "private"
                      ? "text-purple-600"
                      : "text-stone-500"
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${
                      visibility === "private"
                        ? "text-purple-900"
                        : "text-stone-700"
                    }`}
                  >
                    Private
                  </p>
                  <p className="text-xs text-stone-500">Only you can see</p>
                </div>
              </div>
              {visibility === "private" && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>

            <button
              onClick={() => setVisibility("public")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-1 transition-all ${
                visibility === "public"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Globe
                  className={`w-4 h-4 ${
                    visibility === "public" ? "text-blue-600" : "text-stone-500"
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${
                      visibility === "public"
                        ? "text-blue-900"
                        : "text-stone-700"
                    }`}
                  >
                    Public
                  </p>
                  <p className="text-xs text-stone-500">Everyone can see</p>
                </div>
              </div>
              {visibility === "public" && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* AI Comments Section */}
        <div
          ref={aiRef}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {allowAIComments ? (
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              ) : (
                <div className="p-2 bg-stone-50 rounded-lg">
                  <BotOff className="w-4 h-4 text-stone-600" />
                </div>
              )}
              <div>
                <h2 className="text-md font-semibold text-stone-900">
                  AI Comments
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setAllowAIComments(true)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-1 transition-all ${
                allowAIComments
                  ? "bg-indigo-50 border-indigo-500"
                  : "bg-white border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bot
                  className={`w-4 h-4 ${
                    allowAIComments ? "text-indigo-600" : "text-stone-500"
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${
                      allowAIComments ? "text-indigo-900" : "text-stone-700"
                    }`}
                  >
                    Enable AI Comments
                  </p>
                  <p className="text-xs text-stone-500">
                    Get AI insights and feedback
                  </p>
                </div>
              </div>
              {allowAIComments && <Check className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => setAllowAIComments(false)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-1 transition-all ${
                !allowAIComments
                  ? "bg-stone-100 border-stone-500"
                  : "bg-white border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <BotOff
                  className={`w-4 h-4 ${
                    !allowAIComments ? "text-stone-600" : "text-stone-500"
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${
                      !allowAIComments ? "text-stone-900" : "text-stone-700"
                    }`}
                  >
                    Disable AI Comments
                  </p>
                  <p className="text-xs text-stone-500">No AI interactions</p>
                </div>
              </div>
              {!allowAIComments && <Check className="w-4 h-4 text-stone-600" />}
            </button>
          </div>
        </div>

        {/* Hashtags Section */}
        <div
          ref={hashtagRef}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Hash className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-md font-semibold text-stone-900">
                  Hashtags
                </h2>
              </div>
            </div>
            {selectedHashtags.length > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {selectedHashtags.length}
              </span>
            )}
          </div>

          {/* Selected Tags */}
          {selectedHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedHashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleHashtagRemove(tag)}
                    className="ml-1 hover:text-green-900"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="relative">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) =>
                setHashtagInput(e.target.value.replace(/[\s#]/g, ""))
              }
              onKeyDown={handleHashtagKeyDown}
              placeholder="Add a hashtag..."
              className="w-full px-4 py-3 pr-12 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={30}
            />
            {hashtagInput && (
              <button
                type="button"
                onClick={handleHashtagAdd}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions */}
          {hashtagInput && (
            <div className="mt-3">
              {isSearching ? (
                <div className="text-center py-3 text-sm text-stone-400">
                  Searching...
                </div>
              ) : hashtagSuggestions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-stone-500 mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-stone-50 hover:bg-green-50 text-stone-700 hover:text-green-700 rounded-full text-sm transition-colors"
                      >
                        #{suggestion.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-400 py-2">
                  Press Enter to add "#{hashtagInput}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section - 심플 버전 */}
        <div ref={contentRef} className="transition-all -mx-4 mt-10">
          {/* Header */}
          <div className="px-10 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-50 rounded-lg">
                <svg
                  className="w-4 h-4 text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-md font-semibold text-stone-900">
                  Your Story
                </h2>
                <p className="text-sm text-stone-500">
                  Write what's on your mind
                </p>
              </div>
              {isContentCompleted && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          {/* Editor - 전체 너비, 미니멀 스타일 */}
          <div className="bg-white border border-stone-100 border-b-0">
            <div className="min-h-[450px] px-4 sm:px-6 py-6">
              <CustomEditor
                content={content}
                onChange={setContent}
                onHashtagAdd={(hashtag) => {
                  if (!selectedHashtags.includes(hashtag)) {
                    setSelectedHashtags([...selectedHashtags, hashtag]);
                  }
                }}
              />
            </div>

            {/* Character count - 에디터 하단에 통합 */}
            {plainTextContent && (
              <div className="border-t border-stone-100 px-4 sm:px-6 py-3 bg-stone-50/50">
                <span className="text-sm text-stone-400">
                  {plainTextContent.length} / 500 characters
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
