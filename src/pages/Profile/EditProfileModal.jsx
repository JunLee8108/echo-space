// EditProfileModal.jsx 수정된 버전
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

import { signOut } from "../../services/authService";
import { createTranslator } from "../../components/utils/translations";

const EditProfileModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  currentLanguage,
  onPasswordChange,
  onLanguageChange,
}) => {
  const [name, setName] = useState(currentName);
  const [language, setLanguage] = useState(currentLanguage || "English"); // 추가
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // "name"을 "general"로 변경

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const modalRef = useRef(null);

  const translate = createTranslator(currentLanguage);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setLanguage(currentLanguage || "English"); // 추가
      setActiveTab("general"); // "name"을 "general"로 변경
      resetPasswordFields();
    }
  }, [isOpen, currentName, currentLanguage]); // currentLanguage 추가

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

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (!isOpen) return null;

  // handleNameSubmit을 handleGeneralSubmit으로 변경
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a name.");
      return;
    }

    const nameChanged = name.trim() !== currentName;
    const languageChanged = language !== currentLanguage;

    if (!nameChanged && !languageChanged) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      // 이름이 변경되었으면 업데이트
      if (nameChanged) {
        await onConfirm(name.trim());
      }

      // 언어가 변경되었으면 업데이트
      if (languageChanged) {
        await onLanguageChange(language);
      }

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from the current password."
      );
      return;
    }

    setLoading(true);
    try {
      await onPasswordChange(currentPassword, newPassword);
      alert("Password changed successfully.");
      onClose();
      signOut();
    } catch (error) {
      setPasswordError(error.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white w-[90%] max-w-[420px] max-h-[70dvh] mb-[70px] overflow-y-auto rounded-2xl shadow-2xl transform transition-all duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-stone-900">
              {translate("profile.editProfile")}
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

          {/* Tabs */}
          <div className="flex mb-6 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeTab === "general"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {translate("profile.general")}
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeTab === "password"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {translate("profile.password")}
            </button>
          </div>

          {/* General Form (이전 Name Form) */}
          {activeTab === "general" && (
            <form onSubmit={handleGeneralSubmit}>
              <div className="space-y-4 mb-7">
                {/* Display Name */}
                <div>
                  <label
                    htmlFor="display-name"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    {translate("profile.displayName")}
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                    maxLength={50}
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    {translate("profile.displayNameHint")} {name.length}/50
                  </p>
                </div>

                {/* Language Selection */}
                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    {translate("profile.language")}
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="English">English</option>
                      <option value="Korean">Korean</option>
                    </select>
                    <svg
                      className="absolute left-4 top-3.5 w-4 h-4 text-stone-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <svg
                      className="absolute right-4 top-3.5 w-4 h-4 text-stone-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    {translate("profile.languageHint")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="text-sm flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translate("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !name.trim() ||
                    (name.trim() === currentName &&
                      language === currentLanguage)
                  }
                  className="text-sm flex-1 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    `${translate("common.save")}`
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Form - 변경 없음 */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4 mb-7">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    {translate("profile.currentPassword")}
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={translate("profile.enterCurrentPassword")}
                      className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-stone-200 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    {translate("profile.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={translate("profile.enterNewPassword")}
                      className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-stone-200 transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    {translate("profile.confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={translate("profile.reenterNewPassword")}
                      className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-stone-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{passwordError}</p>
                  </div>
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
                  {translate("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-sm flex-1 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    `${translate("common.save")}`
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
