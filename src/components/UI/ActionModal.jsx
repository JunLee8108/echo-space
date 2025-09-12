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
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  const modalRef = useRef(null);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentYRef = useRef(0);
  const rafRef = useRef(null);
  const isClosingRef = useRef(false);
  const touchStartedRef = useRef(false);

  // Constants for swipe behavior
  const VELOCITY_THRESHOLD = 0.5; // px/ms - 속도 임계값
  const DISTANCE_THRESHOLD = 50; // px - 최소 스와이프 거리
  const RUBBER_BAND_FACTOR = 0.3; // 위로 당길 때 저항 계수
  const ANIMATION_DURATION = 300; // ms

  // 모달 열기/닫기 처리
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      isClosingRef.current = false;
      // DOM 마운트 후 애니메이션 시작
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDragY(0);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 터치/마우스 시작
  const handleStart = useCallback((e) => {
    if (isClosingRef.current || !modalRef.current) return;

    // 이미 처리된 이벤트면 무시 (중복 방지)
    if (touchStartedRef.current) return;
    touchStartedRef.current = true;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentYRef.current = 0;

    // 포인터 캡처 (마우스의 경우)
    if (e.type === "mousedown" && e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId || 1);
    }

    e.preventDefault();
  }, []);

  // 터치/마우스 이동
  const handleMove = useCallback(
    (e) => {
      if (!isDragging || isClosingRef.current) return;

      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - startYRef.current;

      // 위로 스와이프 시 저항 적용
      const adjustedDeltaY = deltaY < 0 ? deltaY * RUBBER_BAND_FACTOR : deltaY;

      currentYRef.current = adjustedDeltaY;

      // requestAnimationFrame으로 부드러운 업데이트
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setDragY(adjustedDeltaY);
      });

      e.preventDefault();
    },
    [isDragging]
  );

  // 터치/마우스 종료
  const handleEnd = useCallback(
    (e) => {
      if (!isDragging || isClosingRef.current) return;

      touchStartedRef.current = false;
      setIsDragging(false);

      const endTime = Date.now();
      const deltaTime = endTime - startTimeRef.current;
      const deltaY = currentYRef.current;
      const velocity = deltaY / deltaTime;

      // 포인터 릴리즈 (마우스의 경우)
      if (e.type === "mouseup" && e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId || 1);
      }

      // 닫기 조건 판단
      const shouldClose =
        deltaY > DISTANCE_THRESHOLD || // 충분한 거리
        velocity > VELOCITY_THRESHOLD; // 충분한 속도

      if (shouldClose && deltaY > 0) {
        // 부드럽게 닫기
        animateClose();
      } else {
        // 원위치로 복귀
        resetPosition();
      }

      e.preventDefault();
    },
    [isDragging]
  );

  // 부드러운 닫기 애니메이션
  const animateClose = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    const modalHeight = modalRef.current?.offsetHeight || 500;

    // 현재 위치에서 완전히 아래로 애니메이션
    const startY = currentYRef.current;
    const targetY = modalHeight;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // easeOutCubic 이징 함수
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentY = startY + (targetY - startY) * easeProgress;

      setDragY(currentY);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 후 모달 닫기
        onClose();
      }
    };

    animate();
  }, [onClose]);

  // 원위치로 복귀 애니메이션
  const resetPosition = useCallback(() => {
    const startY = currentYRef.current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // easeOutCubic 이징 함수
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentY = startY * (1 - easeProgress);

      setDragY(currentY);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDragY(0);
        currentYRef.current = 0;
      }
    };

    animate();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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

  // 전역 이벤트 리스너 (모바일 대응)
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalMove = (e) => {
      if (isDragging) {
        handleMove(e);
      }
    };

    const handleGlobalEnd = (e) => {
      if (isDragging) {
        handleEnd(e);
      }
    };

    // Touch events
    document.addEventListener("touchmove", handleGlobalMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleGlobalEnd, { passive: false });
    document.addEventListener("touchcancel", handleGlobalEnd, {
      passive: false,
    });

    // Mouse events
    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalEnd);

    return () => {
      document.removeEventListener("touchmove", handleGlobalMove);
      document.removeEventListener("touchend", handleGlobalEnd);
      document.removeEventListener("touchcancel", handleGlobalEnd);
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalEnd);
    };
  }, [isOpen, isDragging, handleMove, handleEnd]);

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

  // 드래그 중이거나 dragY가 있을 때의 transform 스타일
  const modalStyle = {
    transform:
      isDragging || dragY !== 0
        ? `translateY(${Math.max(0, dragY)}px)`
        : isAnimating
        ? "translateY(0)"
        : "translateY(100%)",
    transition: isDragging
      ? "none"
      : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    willChange: isDragging ? "transform" : "auto",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 transition-opacity duration-300"
        onClick={onClose}
        style={{
          pointerEvents: isAnimating ? "auto" : "none",
          touchAction: "none",
        }}
      >
        {/* Modal - Bottom Sheet Style */}
        <div
          ref={modalRef}
          className="absolute max-w-[500px] min-h-[50dvh] mx-auto bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-xl select-none"
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 pb-safe">
            {/* Handle bar - 드래그 가능 영역 */}
            <div
              className="py-4 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onTouchStart={handleStart}
              onMouseDown={handleStart}
            >
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
                    style={{ touchAction: "manipulation" }}
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
                style={{ touchAction: "manipulation" }}
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
