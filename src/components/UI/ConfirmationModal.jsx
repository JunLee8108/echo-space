import React from "react";
import { Info, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700",
  icon = "warning", // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (icon) {
      case "danger":
        return (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        );
      case "info":
        return (
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            <Info className="w-6 h-6 text-white" />
          </div>
        );
      default: // warning
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}

        <div
          className="bg-white w-[90%] max-w-[350px] rounded-2xl shadow-2xl transform transition-all duration-200 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">{renderIcon()}</div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-stone-600">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="text-sm flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors duration-200"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`text-sm flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-colors duration-200 ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
