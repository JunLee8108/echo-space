import { useState, useRef, useEffect } from "react";
import { Smile, Meh, Frown } from "lucide-react";
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

const PostFormModal = ({ isOpen, onClose, onPostSubmit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const modalRef = useRef(null);
  const moodButtonRef = useRef(null);
  const moodModalRef = useRef(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setSelectedMood(null);
      setShowMoodModal(false);
      setIsClosing(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Close mood modal when clicking outside
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoodModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const newPost = {
      id: Date.now(),
      title,
      content,
      mood: selectedMood?.id || null,
      created_at: new Date().toISOString(),
    };

    onPostSubmit(newPost);

    setTimeout(() => {
      // 페이드아웃 애니메이션 시작
      setIsClosing(true);

      // 애니메이션 완료 후 모달 닫기
      setTimeout(() => {
        setIsSubmitting(false);
        setIsClosing(false);
        onClose();
      }, 400);
    }, 600); // 600ms 로딩 표시
  };

  const handleModalClose = () => {
    setIsClosing(true);

    setTimeout(() => {
      // 페이드아웃 애니메이션 시작

      setIsClosing(false);
      onClose();
    }, 400); // 600ms 로딩 표시
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setShowMoodModal(false);
  };

  const isButtonDisabled = !title.trim() || !content.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-xs `} />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-[100%] max-w-[500px] h-[100dvh] mx-auto bg-white shadow-2xl overflow-hidden flex flex-col ${
          isClosing ? "animate-fadeOut" : "animate-scaleIn sm:animate-scaleIn"
        } ${isSubmitting ? "pointer-events-none" : ""}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Create Post</h2>
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
            {/* Title Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-0 py-2 text-lg font-medium text-stone-900 placeholder-stone-400 border-0 border-b border-stone-300 focus:border-stone-500 focus:outline-none transition-colors bg-transparent"
                // autoFocus
                required
              />
            </div>

            {/* Content Textarea - Flex grow to fill remaining space */}
            <div className="relative flex-1 flex">
              <textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full px-0 py-2 text-stone-700 placeholder-stone-400 border-0 focus:outline-none resize-none bg-transparent"
                required
              />
            </div>

            {/* Actions Bar */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
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
                    className={`p-2 rounded-lg transition-all duration-200 ${
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

                <button
                  type="button"
                  className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                  title="Add location"
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {/* Character count */}
                {content && (
                  <span className="text-xs text-stone-400">
                    {content.length} / 500
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
