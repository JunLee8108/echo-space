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
  const [isPinching, setIsPinching] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // refs
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);
  const pinchCenterRef = useRef({ x: 0, y: 0 });

  // 두 터치 포인트 사이의 거리 계산
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 두 터치 포인트의 중심점 계산
  const getCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // 이미지 로드 시 실제 크기 저장
  const handleImageLoad = (e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  // 이동 범위 제한 함수
  const constrainPosition = (x, y, currentScale) => {
    if (!imageRef.current || !containerRef.current) return { x, y };

    const container = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    // 이미지 크기가 컨테이너보다 작으면 중앙 정렬
    if (currentScale <= 1) {
      return { x: 0, y: 0 };
    }

    // 실제 이미지 크기 계산
    const scaledWidth = imgRect.width;
    const scaledHeight = imgRect.height;

    // 이동 가능한 최대 범위 계산
    const maxX = Math.max(0, (scaledWidth - container.width) / 2);
    const maxY = Math.max(0, (scaledHeight - container.height) / 2);

    // 범위 제한
    const constrainedX = Math.min(maxX, Math.max(-maxX, x));
    const constrainedY = Math.min(maxY, Math.max(-maxY, y));

    return { x: constrainedX, y: constrainedY };
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
        setIsPinching(true);
        setIsDragging(false);

        const distance = getDistance(touches[0], touches[1]);
        const center = getCenter(touches[0], touches[1]);

        setInitialPinchDistance(distance);
        setInitialScale(scale);
        pinchCenterRef.current = center;
      }
    };

    handleTouchMoveRef.current = (e) => {
      const touches = e.touches;

      if (touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        const newX = touches[0].clientX - dragStart.x;
        const newY = touches[0].clientY - dragStart.y;

        const constrained = constrainPosition(newX, newY, scale);
        setPosition(constrained);
      } else if (touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);

        const currentDistance = getDistance(touches[0], touches[1]);
        const scaleChange = currentDistance / initialPinchDistance;
        const newScale = Math.min(Math.max(initialScale * scaleChange, 1), 5);

        setScale(newScale);

        // 핀치 중심점 기준으로 위치 조정
        if (newScale > 1) {
          const center = getCenter(touches[0], touches[1]);
          const container = containerRef.current.getBoundingClientRect();

          // 화면 중앙에서 핀치 중심까지의 거리
          const offsetX = center.x - container.width / 2;
          const offsetY = center.y - container.height / 2;

          // 스케일 변화에 따른 위치 보정
          const scaleDiff = newScale - initialScale;
          const positionAdjustX = -offsetX * scaleDiff * 0.01;
          const positionAdjustY = -offsetY * scaleDiff * 0.01;

          setPosition((prev) => {
            const newPos = {
              x: prev.x + positionAdjustX,
              y: prev.y + positionAdjustY,
            };
            return constrainPosition(newPos.x, newPos.y, newScale);
          });
        }
      }
    };

    handleTouchEndRef.current = (e) => {
      const touches = e.touches;

      // 핀치가 끝났는지 체크
      if (isPinching && touches.length < 2) {
        setIsPinching(false);
        lastTapRef.current = 0;

        if (touches.length === 1) {
          setIsDragging(true);
          setDragStart({
            x: touches[0].clientX - position.x,
            y: touches[0].clientY - position.y,
          });
        }
        return;
      }

      // 더블 탭 체크
      if (!isPinching && touches.length === 0) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapRef.current;

        if (tapLength < 300 && tapLength > 0) {
          e.preventDefault();

          if (scale === 1) {
            const touch = e.changedTouches[0];
            const container = containerRef.current.getBoundingClientRect();

            // 탭한 위치를 화면 중앙 기준으로 계산
            const tapX = touch.clientX - container.width / 2;
            const tapY = touch.clientY - container.height / 2;

            setScale(2.5);
            // 탭한 위치가 중앙에 오도록 이동
            const newPos = constrainPosition(-tapX * 0.8, -tapY * 0.8, 2.5);
            setPosition(newPos);
          } else {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = currentTime;
        }

        setIsDragging(false);
      }
    };

    handleWheelRef.current = (e) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta * scale, 1), 5);

      if (newScale !== scale) {
        const container = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - container.width / 2;
        const mouseY = e.clientY - container.height / 2;

        const scaleRatio = newScale / scale;

        setScale(newScale);

        if (newScale > 1) {
          const newX = position.x * scaleRatio - mouseX * (scaleRatio - 1);
          const newY = position.y * scaleRatio - mouseY * (scaleRatio - 1);
          const constrained = constrainPosition(newX, newY, newScale);
          setPosition(constrained);
        } else {
          setPosition({ x: 0, y: 0 });
        }
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

  // 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

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

    container.addEventListener("touchstart", touchStartHandler, {
      passive: false,
    });
    container.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
    container.addEventListener("touchend", touchEndHandler, { passive: false });
    container.addEventListener("touchcancel", touchEndHandler, {
      passive: false,
    });
    container.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      container.removeEventListener("touchstart", touchStartHandler);
      container.removeEventListener("touchmove", touchMoveHandler);
      container.removeEventListener("touchend", touchEndHandler);
      container.removeEventListener("touchcancel", touchEndHandler);
      container.removeEventListener("wheel", wheelHandler);
    };
  }, [isOpen]);

  // 마우스 이벤트 (데스크톱)
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
      const constrained = constrainPosition(newX, newY, scale);
      setPosition(constrained);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 모달 open/close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
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
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && scale === 1) {
      onClose();
    }
  };

  // 이미지 스타일 계산
  const getImageStyle = () => {
    const baseStyle = {
      transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
      transition:
        isDragging || isPinching
          ? "none"
          : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      transformOrigin: "center",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
      pointerEvents: "auto",
      maxWidth: "100vw",
      maxHeight: "100vh",
      width: "auto",
      height: "auto",
      objectFit: "contain",
    };

    return baseStyle;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Full Screen Image Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ overflow: "hidden" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleBackdropClick}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Expanded view"
          className={`${
            isDragging
              ? "cursor-grabbing"
              : scale > 1
              ? "cursor-grab"
              : "cursor-default"
          }`}
          style={getImageStyle()}
          onLoad={handleImageLoad}
          onMouseDown={handleMouseDown}
          draggable={false}
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='16'%3EImage failed to load%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {scale > 1 && (
          <>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
              aria-label="Rotate"
            >
              <RotateCw className="w-4 h-4 text-white" />
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scale indicator */}
      {scale !== 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full pointer-events-none">
          <span className="text-white/80 text-xs font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {/* Instructions */}
      {scale === 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-full pointer-events-none md:hidden">
          <span className="text-white/60 text-xs">
            Pinch to zoom • Double tap to zoom
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageModal;
