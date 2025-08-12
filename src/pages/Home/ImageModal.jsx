// import { useState, useEffect } from "react";
// import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

// const ImageModal = ({ isOpen, onClose, imageSrc }) => {
//   const [scale, setScale] = useState(1);
//   const [rotation, setRotation] = useState(0);

//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "unset";
//       // Reset transformations when closing
//       setScale(1);
//       setRotation(0);
//     }

//     return () => {
//       document.body.style.overflow = "unset";
//     };
//   }, [isOpen]);

//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") onClose();
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   const handleZoomIn = () => {
//     setScale((prev) => Math.min(prev + 0.25, 3));
//   };

//   const handleZoomOut = () => {
//     setScale((prev) => Math.max(prev - 0.25, 0.5));
//   };

//   const handleRotate = () => {
//     setRotation((prev) => (prev + 90) % 360);
//   };

//   const handleBackdropClick = (e) => {
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
//       onClick={handleBackdropClick}
//     >
//       {/* Controls */}
//       <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
//         <button
//           onClick={handleZoomOut}
//           className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
//           aria-label="Zoom out"
//         >
//           <ZoomOut className="w-5 h-5 text-white" />
//         </button>
//         <button
//           onClick={handleZoomIn}
//           className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
//           aria-label="Zoom in"
//         >
//           <ZoomIn className="w-5 h-5 text-white" />
//         </button>
//         <button
//           onClick={handleRotate}
//           className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
//           aria-label="Rotate"
//         >
//           <RotateCw className="w-5 h-5 text-white" />
//         </button>
//         <button
//           onClick={onClose}
//           className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
//           aria-label="Close"
//         >
//           <X className="w-5 h-5 text-white" />
//         </button>
//       </div>

//       {/* Image Container */}
//       <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
//         <img
//           src={imageSrc}
//           alt="Expanded view"
//           className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 ease-out"
//           style={{
//             transform: `scale(${scale}) rotate(${rotation}deg)`,
//           }}
//           onError={(e) => {
//             e.target.src =
//               "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='16'%3EImage failed to load%3C/text%3E%3C/svg%3E";
//           }}
//         />
//       </div>

//       {/* Scale indicator */}
//       {scale !== 1 && (
//         <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full">
//           <span className="text-white text-sm font-medium">
//             {Math.round(scale * 100)}%
//           </span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageModal;

import { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

const ImageModal = ({ isOpen, onClose, imageSrc }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false); // 핀치 상태 추가

  // refs
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);

  // 두 터치 포인트 사이의 거리 계산
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 이벤트 핸들러 refs
  const handleTouchStartRef = useRef(null);
  const handleTouchMoveRef = useRef(null);
  const handleTouchEndRef = useRef(null);
  const handleWheelRef = useRef(null);

  // 핸들러 업데이트
  useEffect(() => {
    handleTouchStartRef.current = (e) => {
      const touches = e.touches;

      if (touches.length === 1) {
        setIsDragging(true);
        setDragStart({
          x: touches[0].clientX - position.x,
          y: touches[0].clientY - position.y,
        });
      } else if (touches.length === 2) {
        e.preventDefault();
        setIsPinching(true); // 핀치 시작
        setIsDragging(false);
        const distance = getDistance(touches[0], touches[1]);
        setInitialPinchDistance(distance);
        setInitialScale(scale);
      }
    };

    handleTouchMoveRef.current = (e) => {
      const touches = e.touches;

      if (touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        const newX = touches[0].clientX - dragStart.x;
        const newY = touches[0].clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      } else if (touches.length === 2) {
        e.preventDefault();
        setIsPinching(true); // 핀치 중임을 확실히 표시
        const currentDistance = getDistance(touches[0], touches[1]);
        const scaleChange = currentDistance / initialPinchDistance;
        const newScale = Math.min(Math.max(initialScale * scaleChange, 0.5), 4);
        setScale(newScale);
      }
    };

    handleTouchEndRef.current = (e) => {
      const touches = e.touches;

      // 핀치가 끝났는지 체크 (2개 -> 1개 또는 0개)
      if (isPinching && touches.length < 2) {
        setIsPinching(false);
        // 핀치 후에는 더블 탭 타이머 리셋
        lastTapRef.current = 0;

        // 한 손가락이 남았으면 드래그 모드로 전환
        if (touches.length === 1) {
          setIsDragging(true);
          setDragStart({
            x: touches[0].clientX - position.x,
            y: touches[0].clientY - position.y,
          });
        }
        return; // 핀치 종료 시 더블 탭 체크 안 함
      }

      // 핀치가 아닐 때만 더블 탭 체크
      if (!isPinching && touches.length === 0) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapRef.current;

        if (tapLength < 300 && tapLength > 0) {
          e.preventDefault();

          if (scale === 1) {
            setScale(2);
          } else {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }
          lastTapRef.current = 0; // 더블 탭 후 리셋
        } else {
          lastTapRef.current = currentTime;
        }

        setIsDragging(false);

        // 축소되면 위치 리셋
        if (scale <= 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    };

    handleWheelRef.current = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, 0.5), 4);
      setScale(newScale);

      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    };
  }, [
    position,
    scale,
    isDragging,
    dragStart,
    initialScale,
    initialPinchDistance,
    isPinching,
  ]);

  // 모든 이벤트 리스너를 passive: false로 등록
  useEffect(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container || !isOpen) return;

    // 터치 이벤트 핸들러
    const touchStartHandler = (e) => {
      if (handleTouchStartRef.current) handleTouchStartRef.current(e);
    };
    const touchMoveHandler = (e) => {
      if (handleTouchMoveRef.current) handleTouchMoveRef.current(e);
    };
    const touchEndHandler = (e) => {
      if (handleTouchEndRef.current) handleTouchEndRef.current(e);
    };
    const wheelHandler = (e) => {
      if (handleWheelRef.current) handleWheelRef.current(e);
    };

    // passive: false로 모든 이벤트 등록
    image.addEventListener("touchstart", touchStartHandler, { passive: false });
    image.addEventListener("touchmove", touchMoveHandler, { passive: false });
    image.addEventListener("touchend", touchEndHandler, { passive: false });
    image.addEventListener("touchcancel", touchEndHandler, { passive: false }); // touchcancel도 추가
    container.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      image.removeEventListener("touchstart", touchStartHandler);
      image.removeEventListener("touchmove", touchMoveHandler);
      image.removeEventListener("touchend", touchEndHandler);
      image.removeEventListener("touchcancel", touchEndHandler);
      container.removeEventListener("wheel", wheelHandler);
    };
  }, [isOpen]);

  // 마우스 이벤트 (데스크톱 지원)
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 모달 open/close 효과
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // 터치 이벤트 관련 CSS 추가
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
      // 모든 상태 리셋
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setIsPinching(false);
      lastTapRef.current = 0;
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    };
  }, [isOpen]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleRotate}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
          aria-label="Rotate"
        >
          <RotateCw className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Expanded view"
          className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none ${
            isDragging ? "" : "transition-transform duration-300 ease-out"
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            touchAction: "none",
            cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "default",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            pointerEvents: "auto",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          draggable={false}
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='16'%3EImage failed to load%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* Scale indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full pointer-events-none">
          <span className="text-white text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {/* Instructions (모바일에서만 표시) */}
      {scale === 1 && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full pointer-events-none md:hidden">
          <span className="text-white/70 text-xs">
            Pinch to zoom • Double tap to zoom
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageModal;
