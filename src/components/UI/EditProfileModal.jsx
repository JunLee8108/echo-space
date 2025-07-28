// 2. EditProfileModal.jsx 전체 코드 (업데이트된 버전)
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

import { signOut } from "../../services/authService";

const EditProfileModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  onPasswordChange,
}) => {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("name"); // "name" or "password"

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setActiveTab("name");
      resetPasswordFields();
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

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a name.");
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

          {/* Tabs */}
          <div className="flex mb-6 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("name")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeTab === "name"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeTab === "password"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Password
            </button>
          </div>

          {/* Name Form */}
          {activeTab === "name" && (
            <form onSubmit={handleNameSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="display-name"
                  className="block text-sm font-medium text-stone-700 mb-2"
                >
                  Display Name
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
                <p className="mt-2 text-xs text-stone-500">{name.length}/50</p>
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
          )}

          {/* Password Form */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4 mb-6">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
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
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
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
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-sm flex-1 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "Update"
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
