// components/pages/Home/CommentInput.jsx
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const CommentInput = ({
  onSubmit,
  isSubmitting = false,
  placeholder = "Add a comment...",
  autoFocus = false,
  maxLength = 500,
}) => {
  const [comment, setComment] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea - 140px까지는 스크롤 없이 확장
  useEffect(() => {
    if (textareaRef.current) {
      // 높이를 auto로 리셋하여 scrollHeight를 정확히 측정
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;

      // 140px까지는 textarea 높이를 늘리고, 그 이상은 140px 고정 + 스크롤
      if (scrollHeight <= 140) {
        textareaRef.current.style.height = `${scrollHeight}px`;
        textareaRef.current.style.overflowY = "hidden";
      } else {
        textareaRef.current.style.height = "140px";
        textareaRef.current.style.overflowY = "auto";
      }
    }
  }, [comment]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!comment.trim() || isSubmitting) return;

    try {
      await onSubmit(comment.trim());
      setComment("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  return (
    <div
      className={`border-t border-stone-100 px-6 py-3 transition-all duration-200 ${
        isFocused ? "bg-stone-50" : "bg-white"
      }`}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex items-center flex-1 relative">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
            // onKeyDown 이벤트 핸들러 제거
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl 
                     resize-none outline-none transition-all duration-200
                     focus:border-stone-400 focus:ring-2 focus:ring-stone-100
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-sm text-stone-700 placeholder-stone-400
                     min-h-[44px] leading-[18px]"
            rows="1"
            style={{
              height: "44px",
              overflowY: "hidden",
            }}
          />
        </div>

        {/* Submit button - 높이를 textarea와 일치시킴 */}
        <button
          type="submit"
          disabled={!comment.trim() || isSubmitting}
          className={`h-[34px] w-[34px] rounded-xl transition-all duration-200 transform flex items-center justify-center
                     ${
                       comment.trim() && !isSubmitting
                         ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                         : "bg-stone-100 text-stone-400 cursor-not-allowed"
                     }`}
        >
          {isSubmitting ? (
            <div className="w-4 h-4">
              <svg
                className="animate-spin"
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
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* 모바일 헬퍼 텍스트 제거 */}
    </div>
  );
};

export default CommentInput;
