import React, { useEffect, useState } from "react";
import { FileText, Edit3, Trash2, X } from "lucide-react";

const ActionModal = ({ isOpen, onClose, onAddEntry, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때
      setIsVisible(true);
      // DOM에 마운트된 후 애니메이션 시작
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      // 모달이 닫힐 때
      setIsAnimating(false);
      // 애니메이션이 끝난 후 DOM에서 제거
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const menuItems = [
    {
      icon: FileText,
      label: "Add another entry",
      onClick: onAddEntry,
      className: "hover:bg-gray-50",
    },
    {
      icon: Edit3,
      label: "Edit",
      onClick: onEdit,
      className: "hover:bg-gray-50",
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: onDelete,
      className: "hover:bg-red-50 hover:text-red-600",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 transition-opacity duration-300 ${
          isAnimating ? "bg-black/30" : "bg-transparent"
        }`}
        onClick={onClose}
      >
        {/* Modal - Bottom Sheet Style */}
        <div
          className={`absolute max-w-[500px] min-h-[50dvh] mx-auto bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl transform transition-transform duration-300 ease-out ${
            isAnimating ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 pb-safe">
            {/* Handle bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick?.();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${item.className}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cancel Button */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="text-base">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionModal;
