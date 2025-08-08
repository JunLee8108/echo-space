// pages/Post/Post.jsx
import "./Post.css"; // CSS 파일 import 추가

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { Smile, Meh, Frown, Hash, ArrowLeft } from "lucide-react";
import TipTapEditor from "../../components/utils/TipTapEditor";
import { searchHashtags } from "../../services/hashtagService";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { useUpdatePost } from "../../components/hooks/useUpdatePost";

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

const Post = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;
  const editingPost = location.state?.post || null;

  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  const [content, setContent] = useState("");
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 해시태그 관련 상태
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const moodButtonRef = useRef(null);
  const moodModalRef = useRef(null);
  const hashtagButtonRef = useRef(null);
  const hashtagModalRef = useRef(null);
  const hashtagInputRef = useRef(null);

  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (isEditMode && editingPost) {
      setContent(editingPost.content || "");

      // mood 설정
      if (editingPost.mood && MOODS.find((m) => m.id === editingPost.mood)) {
        setSelectedMood(MOODS.find((m) => m.id === editingPost.mood));
      }

      // hashtags 설정
      if (editingPost.Post_Hashtag && editingPost.Post_Hashtag.length > 0) {
        const hashtags = editingPost.Post_Hashtag.map((h) => h.name);
        setSelectedHashtags(hashtags);
      }
    }
  }, [isEditMode, editingPost]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showHashtagModal) {
          setShowHashtagModal(false);
        } else if (showMoodModal) {
          setShowMoodModal(false);
        } else {
          handleBack();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showHashtagModal, showMoodModal]);

  // 모달 외부 클릭 처리
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

  const handleBack = () => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    const performExit = () => {
      navigate(-1);
    };

    if (plainText && !isSubmitting) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
        performExit();
      }
    } else {
      performExit();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    // Strip HTML tags to check if content is empty
    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) return;

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

    const postData = {
      content: processedContent,
      mood: selectedMood?.id || null,
      hashtags: selectedHashtags,
    };

    setIsSubmitting(true);

    try {
      if (isEditMode && editingPost) {
        // 수정 모드 - 변경사항 확인
        const hasContentChanged = editingPost.content !== processedContent;
        const hasMoodChanged = editingPost.mood !== postData.mood;
        const existingHashtags =
          editingPost.Post_Hashtag?.map((h) => h.name) || [];
        const hasHashtagsChanged =
          JSON.stringify([...existingHashtags].sort()) !==
          JSON.stringify([...postData.hashtags].sort());

        // 변경사항이 없으면 그냥 뒤로가기
        if (!hasContentChanged && !hasMoodChanged && !hasHashtagsChanged) {
          navigate("/");
          return;
        }

        // 변경사항이 있을 때만 업데이트
        await updatePostMutation.mutateAsync({
          postId: editingPost.id,
          ...postData,
        });
      } else {
        // 생성 모드
        const newPost = {
          id: Date.now(),
          ...postData,
          created_at: new Date().toISOString(),
        };
        await createPostMutation.mutateAsync(newPost);
      }

      // 성공 시 홈으로 이동
      navigate("/");
    } catch (error) {
      console.error("포스트 저장 실패:", error);
      setIsSubmitting(false);
    }
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
      setHashtagInput(raw);
    } else {
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

  const plainTextContent = content.replace(/<[^>]*>/g, "").trim();
  const isButtonDisabled = !plainTextContent;

  return (
    <div className="min-h-screen bg-white flex flex-col page-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-stone-900">
            {isEditMode ? "Edit Post" : "New Post"}
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isButtonDisabled || isSubmitting}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
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

      {/* Content Area */}
      <div className="flex flex-col px-4 py-4">
        {/* Editor */}
        <div className="overflow-y-auto">
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Share your thoughts..."
          />
        </div>

        {/* Selected Hashtags */}
        {selectedHashtags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      {/* Bottom Toolbar */}
      <div className="border-t border-stone-100 px-4 py-3 pb-safe">
        <div className="flex items-center justify-between">
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
                              onClick={() => handleSuggestionClick(suggestion)}
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

            {/* Image Button */}
            <button
              type="button"
              className="p-3 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
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

          {/* Character count */}
          {plainTextContent && (
            <span className="text-xs text-stone-400">
              {plainTextContent.length} / 500
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
