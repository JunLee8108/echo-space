import { useState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";

const EditProfileModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  onPasswordReset,
}) => {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setPasswordResetSent(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onConfirm(name.trim());
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordResetLoading(true);
    try {
      await onPasswordReset();
      setPasswordResetSent(true);
    } catch (error) {
      console.error("Password reset error:", error);
      alert("비밀번호 재설정 이메일 전송에 실패했습니다.");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white w-[90%] max-w-[380px] rounded-2xl shadow-2xl transform transition-all duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-stone-900">
              Edit Profile
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-stone-400"
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="display-name"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Display Name
              </label>
              <input
                ref={inputRef}
                id="display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                maxLength={50}
              />
              <p className="mt-2 text-xs text-stone-500">{name.length}/50</p>
            </div>

            {/* Password Reset Section */}
            <div className="mb-6 p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-stone-700">Security</h4>
                <KeyRound className="w-4 h-4 text-stone-400" />
              </div>

              {passwordResetSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    비밀번호 재설정 이메일이 전송되었습니다. 이메일을
                    확인해주세요.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-stone-600 mb-3">
                    비밀번호를 변경하려면 이메일로 재설정 링크를 받으세요.
                  </p>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={passwordResetLoading}
                    className="w-full text-sm px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 font-medium rounded-lg border border-stone-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {passwordResetLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-700"></div>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        비밀번호 변경하기
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-sm flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading || !name.trim() || name.trim() === currentName
                }
                className="text-sm flex-1 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
