// import React, { useEffect, useState } from "react";
// import { FileText, Edit3, Trash2, X } from "lucide-react";

// const ActionModal = ({ isOpen, onClose, onAddEntry, onEdit, onDelete }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isAnimating, setIsAnimating] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       // 모달이 열릴 때
//       setIsVisible(true);
//       // DOM에 마운트된 후 애니메이션 시작
//       setTimeout(() => {
//         setIsAnimating(true);
//       }, 50);
//     } else {
//       // 모달이 닫힐 때
//       setIsAnimating(false);
//       // 애니메이션이 끝난 후 DOM에서 제거
//       const timer = setTimeout(() => {
//         setIsVisible(false);
//       }, 400);
//       return () => clearTimeout(timer);
//     }
//   }, [isOpen]);

//   if (!isVisible) return null;

//   const menuItems = [
//     {
//       icon: FileText,
//       label: "Add another entry",
//       onClick: onAddEntry,
//       className: "hover:bg-gray-50",
//     },
//     {
//       icon: Edit3,
//       label: "Edit",
//       onClick: onEdit,
//       className: "hover:bg-gray-50",
//     },
//     {
//       icon: Trash2,
//       label: "Delete",
//       onClick: onDelete,
//       className: "hover:bg-red-50 hover:text-red-600",
//     },
//   ];

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className={`fixed inset-0 z-60 transition-opacity duration-300`}
//         onClick={onClose}
//       >
//         {/* Modal - Bottom Sheet Style */}
//         <div
//           className={`absolute max-w-[500px] min-h-[50dvh] mx-auto bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-xl transform transition-transform duration-300 ease-out ${
//             isAnimating ? "translate-y-0" : "translate-y-full"
//           }`}
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div className="p-2 pb-safe">
//             {/* Handle bar */}
//             <div className="py-4">
//               <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto"></div>
//             </div>

//             {/* Menu Items */}
//             <div className="py-2">
//               {menuItems.map((item, index) => {
//                 const Icon = item.icon;
//                 return (
//                   <button
//                     key={index}
//                     onClick={() => {
//                       onClose();
//                       setTimeout(() => {
//                         item.onClick?.();
//                       }, 100);
//                     }}
//                     className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${item.className}`}
//                   >
//                     <Icon className="w-5 h-5" />
//                     <span className="text-base">{item.label}</span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Cancel Button */}
//             <div className="border-t border-gray-100 mt-2 pt-2">
//               <button
//                 onClick={onClose}
//                 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//                 <span className="text-base">Cancel</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ActionModal;

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FileText, Edit3, Trash2, X } from "lucide-react";

const ActionModal = ({ isOpen, onClose, onAddEntry, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const modalRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
    rafId: null,
  });
  const modalTransformRef = useRef(0);
  const isClosingRef = useRef(false);

  // Constants for swipe behavior
  const VELOCITY_THRESHOLD = 0.3; // px/ms - 속도 임계값 (더 민감하게)
  const DISTANCE_THRESHOLD = 40; // px - 최소 스와이프 거리 (더 민감하게)
  const ANIMATION_DURATION = 280; // ms (더 빠르게)

  // 모달 열기/닫기 처리
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      isClosingRef.current = false;
      modalTransformRef.current = 0;
      // DOM 마운트 후 애니메이션 시작
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Transform 직접 적용 함수
  const applyTransform = useCallback((value) => {
    if (!modalRef.current) return;
    modalTransformRef.current = value;
    modalRef.current.style.transform = `translateY(${Math.max(0, value)}px)`;
  }, []);

  // 터치 시작
  const handleTouchStart = useCallback((e) => {
    if (isClosingRef.current || !modalRef.current) return;

    const touch = e.touches[0];
    dragStateRef.current = {
      isDragging: true,
      startY: touch.clientY,
      currentY: 0,
      startTime: Date.now(),
      rafId: null,
    };

    // transition 제거
    modalRef.current.style.transition = "none";
  }, []);

  // 터치 이동 (최적화)
  const handleTouchMove = useCallback(
    (e) => {
      const state = dragStateRef.current;
      if (!state.isDragging || isClosingRef.current) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - state.startY;

      // 위로 스와이프는 무시 (0 이하로 가지 않음)
      const clampedDeltaY = Math.max(0, deltaY);
      state.currentY = clampedDeltaY;

      // RAF 없이 직접 적용 (더 빠른 반응)
      applyTransform(clampedDeltaY);
    },
    [applyTransform]
  );

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    const state = dragStateRef.current;
    if (!state.isDragging || isClosingRef.current) return;

    state.isDragging = false;

    const endTime = Date.now();
    const deltaTime = Math.max(1, endTime - state.startTime); // 0 방지
    const velocity = state.currentY / deltaTime;

    // 닫기 조건 판단 (더 민감하게)
    const shouldClose =
      state.currentY > DISTANCE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldClose) {
      animateClose(state.currentY);
    } else {
      animateReset();
    }
  }, []);

  // 부드러운 닫기 애니메이션
  const animateClose = useCallback(() => {
    if (isClosingRef.current || !modalRef.current) return;

    isClosingRef.current = true;
    const modalHeight = modalRef.current.offsetHeight;

    // CSS transition으로 처리 (더 부드럽게)
    modalRef.current.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    modalRef.current.style.transform = `translateY(${modalHeight}px)`;

    // 애니메이션 후 닫기
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
  }, [onClose]);

  // 원위치 복귀 애니메이션
  const animateReset = useCallback(() => {
    if (!modalRef.current) return;

    modalRef.current.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    modalRef.current.style.transform = "translateY(0)";
    modalTransformRef.current = 0;
  }, []);

  // 전역 터치 이벤트 (non-passive로 명시적 설정)
  useEffect(() => {
    if (!isVisible) return;

    const handleBar = modalRef.current?.querySelector("[data-handle-bar]");
    if (!handleBar) return;

    // 터치 이벤트만 사용 (데스크탑 제외)
    const touchMoveHandler = (e) => {
      if (dragStateRef.current.isDragging) {
        e.preventDefault(); // 스크롤 방지
        handleTouchMove(e);
      }
    };

    const touchEndHandler = () => {
      if (dragStateRef.current.isDragging) {
        handleTouchEnd();
      }
    };

    // Handle bar에 이벤트 등록
    handleBar.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    // Document에 이벤트 등록 (non-passive)
    document.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchend", touchEndHandler, { passive: true });
    document.addEventListener("touchcancel", touchEndHandler, {
      passive: true,
    });

    return () => {
      handleBar.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", touchMoveHandler);
      document.removeEventListener("touchend", touchEndHandler);
      document.removeEventListener("touchcancel", touchEndHandler);
    };
  }, [isVisible, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isClosingRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

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
        className="fixed inset-0 z-60"
        onClick={onClose}
        style={{
          pointerEvents: isAnimating ? "auto" : "none",
        }}
      >
        {/* Modal - Bottom Sheet Style */}
        <div
          ref={modalRef}
          className="absolute overscroll-contain max-w-[500px] min-h-[50dvh] mx-auto bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-xl select-none"
          style={{
            transform: isAnimating ? "translateY(0)" : "translateY(100%)",
            transition: isAnimating
              ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
              : "none",
            willChange: "transform",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 pb-safe">
            {/* Handle bar - 드래그 가능 영역 */}
            <div data-handle-bar className="py-4 touch-none">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto pointer-events-none"></div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isClosingRef.current) return;
                      onClose();
                      setTimeout(() => {
                        item.onClick?.();
                      }, 100);
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
                onClick={() => {
                  if (isClosingRef.current) return;
                  onClose();
                }}
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
