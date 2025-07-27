import { useState, useRef, useEffect } from "react";
import { Smile, Meh, Frown } from "lucide-react";
import "./PostForm.css";

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

const PostForm = ({ onPostSubmit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const moodButtonRef = useRef(null);
  const moodModalRef = useRef(null);

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

    const newPost = {
      id: Date.now(),
      title,
      content,
      mood: selectedMood?.id || null,
      created_at: new Date().toISOString(),
    };

    onPostSubmit(newPost);
    setTitle("");
    setContent("");
    setSelectedMood(null);
    setIsFocused(false);
    setShowMoodModal(false);
  };

  const handleFormBlur = (e) => {
    // Check if the new focus target is still within the form
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // Only close if both fields are empty
      setShowMoodModal(false);
      if (!title.trim() && !content.trim()) {
        setTimeout(() => {
          setIsFocused(false);
        }, 300);
      }
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setShowMoodModal(false);
  };

  const isButtonDisabled = !title.trim() || !content.trim();

  return (
    <form onSubmit={handleSubmit} className="p-6" onBlur={handleFormBlur}>
      <div className="space-y-4">
        {/* Title Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="What's on your mind?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full px-0 py-2 text-lg font-medium text-stone-900 placeholder-stone-400 border-0 border-b border-transparent focus:border-stone-300 focus:outline-none transition-colors bg-transparent"
            required
          />
        </div>

        {/* Content Textarea - Shows when title is focused or has content */}
        {(isFocused || title || content) && (
          <div className="relative animate-fadeIn">
            <textarea
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-0 py-2 text-stone-700 placeholder-stone-400 border-0 focus:outline-none resize-none bg-transparent min-h-[80px] max-h-[200px]"
              style={{ height: content ? "auto" : "80px" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              required
            />
          </div>
        )}
      </div>

      {/* Actions Bar - Shows when focused */}
      {(isFocused || title || content) && (
        <div className="mt-6 flex items-center justify-between animate-fadeIn">
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
              disabled={isButtonDisabled}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isButtonDisabled
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
              }`}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default PostForm;
