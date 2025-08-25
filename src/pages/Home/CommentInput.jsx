// components/pages/Home/CommentInput.jsx
import { useState, useRef, useEffect } from "react";
import { Send, X, Check } from "lucide-react";

const CommentInput = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = "Add a comment...",
  autoFocus = false,
  maxLength = 500,
  initialValue = "",
  isEditMode = false,
}) => {
  const [comment, setComment] = useState(initialValue);
  const textareaRef = useRef(null);

  // 초기값 변경 시 업데이트
  useEffect(() => {
    setComment(initialValue);
  }, [initialValue]);

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
      // 수정 모드일 때 커서를 끝으로 이동
      if (isEditMode) {
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }
  }, [autoFocus, isEditMode]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!comment.trim() || isSubmitting) return;

    // 수정 모드에서 변경사항이 없으면 취소 처리
    if (isEditMode && comment.trim() === initialValue.trim()) {
      if (onCancel) onCancel();
      return;
    }

    try {
      await onSubmit(comment.trim());
      if (!isEditMode) {
        setComment("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleCancel = () => {
    setComment(initialValue);
    if (onCancel) onCancel();
  };

  // Escape 키로 취소
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && isEditMode) {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div
      className={`${
        isEditMode ? "px-2 pb-3" : "border-t border-stone-100 px-6 py-3"
      }  transition-all duration-200`}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex items-center flex-1 relative">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-white border rounded-2xl 
                     resize-none outline-none transition-all duration-200
                     focus:ring-2 focus:ring-stone-100
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-sm text-stone-700 placeholder-stone-400
                     min-h-[44px] leading-[18px]
                     ${
                       isEditMode
                         ? "border-blue-300 focus:border-blue-400"
                         : "border-stone-200 focus:border-stone-400"
                     }`}
            rows="1"
            style={{
              height: "44px",
              overflowY: "hidden",
            }}
          />

          {/* 글자 수 표시 (수정 모드일 때만) */}
          {isEditMode && comment.length > 0 && (
            <div className="absolute right-3 bottom-2 text-xs text-stone-400">
              {comment.length}/{maxLength}
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              {/* 취소 버튼 */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-[30px] w-[30px] rounded-xl transition-all duration-200 transform flex items-center justify-center
                         bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 저장 버튼 */}
              <button
                type="submit"
                disabled={
                  !comment.trim() ||
                  isSubmitting ||
                  comment.trim() === initialValue.trim()
                }
                className={`h-[30px] w-[30px] rounded-xl transition-all duration-200 transform flex items-center justify-center
                         ${
                           comment.trim() &&
                           !isSubmitting &&
                           comment.trim() !== initialValue.trim()
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
                  <Check className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            /* 일반 제출 버튼 */
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
          )}
        </div>
      </form>

      {/* 수정 모드 힌트 */}
      {isEditMode && (
        <div className="mt-3 text-xs text-stone-400">
          <span className="mr-3">
            <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-600">
              Esc
            </kbd>{" "}
            to cancel
          </span>
        </div>
      )}
    </div>
  );
};

export default CommentInput;
