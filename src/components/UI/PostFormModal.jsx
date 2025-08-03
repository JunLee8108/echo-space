import { useState, useRef, useEffect } from "react";
import { Smile, Meh, Frown, Hash } from "lucide-react";
import TipTapEditor from "../utils/TipTapEditor";
import { searchHashtags } from "../../services/hashtagService";
import { useCreatePost } from "../hooks/useCreatePost";
import { useIsPostModalOpen, useClosePostModal } from "../../stores/modalStore";
import "./PostFormModal.css";

const MOODS = [
  {
    id: "happy",
    icon: Smile,
    label: "Happy",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    hoverColor: "hover:bg-amber-100",
  },
  {
    id: "neutral",
    icon: Meh,
    label: "Neutral",
    color: "text-stone-500",
    bgColor: "bg-stone-100",
    hoverColor: "hover:bg-stone-100",
  },
  {
    id: "sad",
    icon: Frown,
    label: "Sad",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
];

const PostFormModal = () => {
  const createPostMutation = useCreatePost();
  const isOpen = useIsPostModalOpen();
  const closePostModal = useClosePostModal();

  const [content, setContent] = useState("");
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 해시태그 관련 상태
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // 스와이프 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);
  const [initialTouch, setInitialTouch] = useState(null); // 터치 시작 지점 저장

  const modalRef = useRef(null);
  const moodButtonRef = useRef(null);
  const moodModalRef = useRef(null);
  const hashtagButtonRef = useRef(null);
  const hashtagModalRef = useRef(null);
  const hashtagInputRef = useRef(null);
  const bottomBarRef = useRef(null);

  // 스와이프 상수
  const DRAG_THRESHOLD = 100; // 닫기 위한 최소 드래그 거리
  const VELOCITY_THRESHOLD = 0.5; // 빠른 스와이프 감지
  const DRAG_START_THRESHOLD = 10; // 드래그 시작을 위한 최소 이동 거리

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setSelectedMood(null);
      setShowMoodModal(false);
      setShowHashtagModal(false);
      setSelectedHashtags([]);
      setHashtagInput("");
      setHashtagSuggestions([]);
      setIsClosing(false);
      setIsSubmitting(false);
      setDragOffset(0);
      setIsDragging(false);
      setIsSwipeClosing(false);
      setInitialTouch(null);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleModalClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        closePostModal();
      }, 400);
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showHashtagModal) {
          setShowHashtagModal(false);
        } else if (showMoodModal) {
          setShowMoodModal(false);
        } else {
          handleModalClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closePostModal, showHashtagModal, showMoodModal]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showMoodModal &&
        moodModalRef.current &&
        !moodModalRef.current.contains(e.target) &&
        !moodButtonRef.current.contains(e.target)
      ) {
        setShowMoodModal(false);
      }

      if (
        showHashtagModal &&
        hashtagModalRef.current &&
        !hashtagModalRef.current.contains(e.target) &&
        !hashtagButtonRef.current.contains(e.target)
      ) {
        setShowHashtagModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoodModal, showHashtagModal]);

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

  // 해시태그 모달이 열릴 때 input에 focus
  useEffect(() => {
    if (showHashtagModal && hashtagInputRef.current) {
      hashtagInputRef.current.focus();
    }
  }, [showHashtagModal]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    // 서브 모달이 열려있거나 제출 중이면 무시
    if (showHashtagModal || showMoodModal || isSubmitting) return;

    // 하단 액션바 영역이 아니면 무시
    if (!bottomBarRef.current?.contains(e.target)) return;

    // 버튼 클릭은 무시
    if (e.target.closest("button")) return;

    // 터치 시작점만 저장 (아직 드래그 시작 안 함)
    setInitialTouch({
      y: e.touches[0].clientY,
      time: Date.now(),
    });
  };

  const handleTouchMove = (e) => {
    if (!initialTouch && !isDragging) return;

    const currentY = e.touches[0].clientY;

    // 아직 드래그 시작 안 했으면 임계값 체크
    if (!isDragging && initialTouch) {
      const deltaY = initialTouch.y - currentY;

      // 위로 일정 거리 이상 움직였을 때만 드래그 시작
      if (deltaY > DRAG_START_THRESHOLD) {
        setIsDragging(true);
        setStartY(initialTouch.y);
        setStartTime(initialTouch.time);
        setDragOffset(deltaY);
        e.preventDefault();
      }
      return;
    }

    // 드래그 중인 경우
    if (isDragging) {
      const deltaY = startY - currentY;

      // 위로 드래그만 허용 (deltaY > 0)
      if (deltaY > 0) {
        setDragOffset(deltaY);
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    // 드래그 중이었을 때만 처리
    if (isDragging) {
      const endTime = Date.now();
      const velocity = dragOffset / (endTime - startTime);

      // 임계값 또는 빠른 스와이프로 닫기
      if (dragOffset > DRAG_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        // 스와이프 닫기 플래그 설정
        setIsSwipeClosing(true);
        setDragOffset(window.innerHeight);

        setTimeout(() => {
          setIsSwipeClosing(false);
          setDragOffset(0);
          closePostModal();
        }, 300);
      } else {
        // 원위치로 복귀
        setDragOffset(0);
      }

      setIsDragging(false);
    }

    // 초기 터치 정보 리셋
    setInitialTouch(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Strip HTML tags to check if content is empty
    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) return;

    setIsSubmitting(true);

    // p태그 안 마지막에 br이 있으면 빈 p태그 추가
    let processedContent = content.replace(
      /<br\s*\/?>\s*<\/p>/g,
      "</p><p></p>"
    );

    // 끝에 있는 빈 p태그들 제거
    processedContent = processedContent.replace(
      /(<p>(\s|&nbsp;)*<\/p>)+$/g,
      ""
    );

    const newPost = {
      id: Date.now(),
      content: processedContent,
      mood: selectedMood?.id || null,
      hashtags: selectedHashtags,
      created_at: new Date().toISOString(),
    };

    createPostMutation.mutate(newPost);

    setTimeout(() => {
      // 스와이프로 닫는 중이 아닐 때만 페이드아웃 애니메이션
      if (!isSwipeClosing) {
        setIsClosing(true);
      }

      // 애니메이션 완료 후 모달 닫기
      setTimeout(() => {
        setIsSubmitting(false);
        if (!isSwipeClosing) {
          setIsClosing(false);
        }
        closePostModal();
      }, 400);
    }, 600);
  };

  const handleModalClose = () => {
    setIsClosing(true);

    setTimeout(() => {
      setIsClosing(false);
      closePostModal();
    }, 400);
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setShowMoodModal(false);
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
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      handleHashtagAdd();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (isComposing) {
      // 조합 중엔 그대로 저장
      setHashtagInput(raw);
    } else {
      // 조합이 끝난 후만 필터링 적용
      setHashtagInput(raw.replace(/[^a-zA-Z0-9가-힣]/g, ""));
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
    hashtagInputRef.current?.focus();
  };

  // Check if content has actual text (not just HTML tags)
  const plainTextContent = content.replace(/<[^>]*>/g, "").trim();
  const isButtonDisabled = !plainTextContent;

  if (!isOpen) return null;

  // 모달 스타일 계산
  const modalStyle = {
    transform: `translateY(${
      isSwipeClosing
        ? -dragOffset
        : isClosing && !isSwipeClosing
        ? 0
        : -dragOffset
    }px)`,
    transition: isDragging
      ? "none"
      : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  // 배경 투명도 계산
  const backdropOpacity = Math.max(0.1, 1 - dragOffset / 400);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-xs ${
          isClosing ? "animate-fadeOut" : "animate-fadeIn"
        }`}
        style={{
          opacity: isDragging ? backdropOpacity : undefined,
          transition: isDragging ? "none" : "opacity 0.3s ease-out",
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-[100%] max-w-[600px] h-[100dvh] mx-auto bg-white shadow-2xl overflow-hidden flex flex-col ${
          isClosing && !isDragging && !isSwipeClosing
            ? "animate-slideUp"
            : !isClosing && !isDragging && !isSwipeClosing
            ? "animate-slideDown"
            : ""
        } ${isSubmitting ? "pointer-events-none" : ""}`}
        style={modalStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-900">Post</h2>
          <button
            onClick={handleModalClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-hidden flex">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6">
            {/* TipTap Rich Text Editor - Flex grow to fill remaining space */}
            <div className="relative flex-1 flex flex-col overflow-y-auto editor-scrollbar">
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Share your thoughts..."
              />
            </div>

            {/* Selected Hashtags Display */}
            {selectedHashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleHashtagRemove(tag)}
                      className="ml-1 hover:text-stone-900"
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

            {/* Drag Handle Indicator */}
            <div className="flex justify-center py-2">
              <div
                className="w-10 h-1 bg-stone-300 rounded-full"
                style={{
                  opacity: isDragging ? 0.8 : 0.4,
                  transform: `scaleX(${isDragging ? 1.2 : 1})`,
                  transition: "all 0.2s ease-out",
                }}
              />
            </div>

            {/* Actions Bar */}
            <div
              ref={bottomBarRef}
              className="flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing touch-none mb-5 md:mb-0"
            >
              <div className="flex items-center space-x-2">
                {/* Hashtag Button */}
                <div className="relative">
                  <button
                    ref={hashtagButtonRef}
                    type="button"
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      selectedHashtags.length > 0
                        ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                    title="Add hashtags"
                    onClick={() => setShowHashtagModal(!showHashtagModal)}
                  >
                    <Hash className="w-5 h-5" />
                    {selectedHashtags.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-stone-700 text-white text-xs rounded-full flex items-center justify-center">
                        {selectedHashtags.length}
                      </span>
                    )}
                  </button>

                  {/* Hashtag Modal */}
                  {showHashtagModal && (
                    <div
                      ref={hashtagModalRef}
                      className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 p-4 min-w-[200px] max-w-[350px]"
                    >
                      <h3 className="text-sm font-medium text-stone-900 mb-3">
                        Add Hashtags
                      </h3>

                      {/* Selected Tags */}
                      {selectedHashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto">
                          {selectedHashtags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleHashtagRemove(tag)}
                                className="ml-0.5 hover:text-stone-900"
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
                          ref={hashtagInputRef}
                          type="text"
                          value={hashtagInput}
                          onChange={handleChange}
                          onCompositionStart={handleCompositionStart}
                          onCompositionEnd={handleCompositionEnd}
                          onKeyDown={handleHashtagKeyDown}
                          placeholder="Type hashtag..."
                          className="w-full px-3 py-2 text-base border border-stone-300 rounded-lg focus:outline-none"
                          maxLength={30}
                        />
                        {hashtagInput && (
                          <button
                            type="button"
                            onClick={handleHashtagAdd}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
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
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Suggestions */}
                      {hashtagInput && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {isSearching ? (
                            <div className="text-center py-2 text-sm text-stone-400">
                              Searching...
                            </div>
                          ) : hashtagSuggestions.length > 0 ? (
                            <div className="space-y-1">
                              {hashtagSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  className="w-full text-left px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-50 rounded transition-colors"
                                >
                                  #{suggestion.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-stone-400 py-2">
                              Press Enter to add "#{hashtagInput}"
                            </div>
                          )}
                        </div>
                      )}

                      <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-stone-200 transform rotate-45"></div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="p-3 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                  title="Add image"
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>

                {/* Mood Button */}
                <div className="relative">
                  <button
                    ref={moodButtonRef}
                    type="button"
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      selectedMood
                        ? `${selectedMood.bgColor} ${selectedMood.hoverColor}`
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                    title="Add mood"
                    onClick={() => setShowMoodModal(!showMoodModal)}
                  >
                    {selectedMood ? (
                      <selectedMood.icon
                        className={`w-5 h-5 ${selectedMood.color}`}
                      />
                    ) : (
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
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Mood Modal */}
                  {showMoodModal && (
                    <div
                      ref={moodModalRef}
                      className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 p-4 min-w-[150px]"
                    >
                      <div className="space-y-2">
                        {MOODS.map((mood) => {
                          const Icon = mood.icon;
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() => handleMoodSelect(mood)}
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                                selectedMood?.id === mood.id
                                  ? `${mood.bgColor} ${mood.color} font-medium`
                                  : "hover:bg-stone-50"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 ${
                                  selectedMood?.id === mood.id
                                    ? mood.color
                                    : "text-stone-600"
                                }`}
                              />
                              <span
                                className={`text-sm ${
                                  selectedMood?.id === mood.id
                                    ? mood.color
                                    : "text-stone-700"
                                }`}
                              >
                                {mood.label}
                              </span>
                            </button>
                          );
                        })}
                        {selectedMood && (
                          <div className="pt-2 mt-2 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => handleMoodSelect(null)}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-stone-600 hover:text-red-600 text-sm"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              <span className="text-sm">Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-stone-200 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Character count */}
                {plainTextContent && (
                  <span className="text-xs text-stone-400">
                    {plainTextContent.length} / 500
                  </span>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isButtonDisabled || isSubmitting}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    isButtonDisabled || isSubmitting
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostFormModal;
