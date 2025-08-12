import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

const ImageModal = ({ isOpen, onClose, imageSrc }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // refs로 관리하여 리렌더링 방지
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const initialPinchDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);
  const pinchCenterRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  // Memoized 헬퍼 함수들
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback(
    (touch1, touch2) => ({
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }),
    []
  );

  // RAF를 사용한 부드러운 업데이트
  const updatePosition = useCallback((newX, newY) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });
    });
  }, []);

  // 최적화된 constrainPosition
  const constrainPosition = useCallback((x, y, currentScale) => {
    if (currentScale <= 1) return { x: 0, y: 0 };

    const container = containerRef.current?.getBoundingClientRect();
    const img = imageRef.current?.getBoundingClientRect();

    if (!container || !img) return { x, y };

    const maxX = Math.max(0, (img.width * currentScale - container.width) / 2);
    const maxY = Math.max(
      0,
      (img.height * currentScale - container.height) / 2
    );

    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  // 터치 핸들러들 - useCallback으로 메모이제이션
  const handleTouchStart = useCallback(
    (e) => {
      const touches = e.touches;

      if (touches.length === 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touches[0].clientX - positionRef.current.x,
          y: touches[0].clientY - positionRef.current.y,
        };
      } else if (touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        setIsDragging(false);

        initialPinchDistanceRef.current = getDistance(touches[0], touches[1]);
        initialScaleRef.current = scaleRef.current;
        pinchCenterRef.current = getCenter(touches[0], touches[1]);
      }
    },
    [getDistance, getCenter]
  );

  const handleTouchMove = useCallback(
    (e) => {
      const touches = e.touches;

      if (touches.length === 1 && isDragging && scaleRef.current > 1) {
        e.preventDefault();
        const newX = touches[0].clientX - dragStartRef.current.x;
        const newY = touches[0].clientY - dragStartRef.current.y;

        const constrained = constrainPosition(newX, newY, scaleRef.current);
        updatePosition(constrained.x, constrained.y);
      } else if (touches.length === 2 && isPinching) {
        e.preventDefault();

        const currentDistance = getDistance(touches[0], touches[1]);
        const scaleChange = currentDistance / initialPinchDistanceRef.current;
        const newScale = Math.min(
          Math.max(initialScaleRef.current * scaleChange, 1),
          5
        );

        scaleRef.current = newScale;
        setScale(newScale);

        // 핀치 줌아웃 시 scale이 1이 되면 위치 리셋
        if (newScale <= 1) {
          updatePosition(0, 0);
        } else if (newScale > 1) {
          // 핀치 중심점 기준으로 위치 조정 (선택적)
          const center = getCenter(touches[0], touches[1]);
          const container = containerRef.current?.getBoundingClientRect();

          if (container) {
            // 화면 중앙에서 핀치 중심까지의 거리
            const offsetX = center.x - container.width / 2;
            const offsetY = center.y - container.height / 2;

            // 스케일 변화에 따른 위치 보정
            const scaleDiff = newScale - initialScaleRef.current;
            const positionAdjustX = -offsetX * scaleDiff * 0.01;
            const positionAdjustY = -offsetY * scaleDiff * 0.01;

            const newPosX = positionRef.current.x + positionAdjustX;
            const newPosY = positionRef.current.y + positionAdjustY;

            const constrained = constrainPosition(newPosX, newPosY, newScale);
            updatePosition(constrained.x, constrained.y);
          }
        }
      }
    },
    [
      isDragging,
      isPinching,
      constrainPosition,
      updatePosition,
      getDistance,
      getCenter,
    ]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      const touches = e.touches;

      if (isPinching && touches.length < 2) {
        setIsPinching(false);
        lastTapRef.current = 0;

        if (touches.length === 1) {
          setIsDragging(true);
          dragStartRef.current = {
            x: touches[0].clientX - positionRef.current.x,
            y: touches[0].clientY - positionRef.current.y,
          };
        }
        return;
      }

      if (!isPinching && touches.length === 0) {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTapRef.current;

        if (tapLength < 300 && tapLength > 0) {
          e.preventDefault();

          if (scaleRef.current === 1) {
            const touch = e.changedTouches[0];
            const container = containerRef.current?.getBoundingClientRect();

            if (container) {
              const tapX = touch.clientX - container.width / 2;
              const tapY = touch.clientY - container.height / 2;

              scaleRef.current = 2.5;
              setScale(2.5);

              const newPos = constrainPosition(-tapX * 0.8, -tapY * 0.8, 2.5);
              updatePosition(newPos.x, newPos.y);
            }
          } else {
            scaleRef.current = 1;
            setScale(1);
            updatePosition(0, 0);
          }
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = currentTime;
        }

        setIsDragging(false);
      }
    },
    [isPinching, constrainPosition, updatePosition]
  );

  // Wheel 핸들러 with throttle
  const wheelTimeoutRef = useRef(null);
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();

      if (wheelTimeoutRef.current) return;

      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 50); // 50ms throttle

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(
        Math.max(scaleRef.current + delta * scaleRef.current, 1),
        5
      );

      if (newScale !== scaleRef.current) {
        scaleRef.current = newScale;
        setScale(newScale);

        if (newScale <= 1) {
          updatePosition(0, 0);
        }
      }
    },
    [updatePosition]
  );

  // 이벤트 리스너 등록 - 한 번만
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const passiveOptions = { passive: false, capture: false };

    container.addEventListener("touchstart", handleTouchStart, passiveOptions);
    container.addEventListener("touchmove", handleTouchMove, passiveOptions);
    container.addEventListener("touchend", handleTouchEnd, passiveOptions);
    container.addEventListener("touchcancel", handleTouchEnd, passiveOptions);
    container.addEventListener("wheel", handleWheel, passiveOptions);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  // refs 동기화
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // 마우스 이벤트 최적화
  const handleMouseDown = useCallback((e) => {
    if (scaleRef.current > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging && scaleRef.current > 1) {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        const constrained = constrainPosition(newX, newY, scaleRef.current);
        updatePosition(constrained.x, constrained.y);
      }
    },
    [isDragging, constrainPosition, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 모달 open/close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";

      // Reset all states
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setIsPinching(false);

      // Reset refs
      scaleRef.current = 1;
      positionRef.current = { x: 0, y: 0 };
      lastTapRef.current = 0;
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
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

  // 버튼 핸들러들
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scaleRef.current + 0.5, 5);
    scaleRef.current = newScale;
    setScale(newScale);
  }, []);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scaleRef.current - 0.5, 1);
    scaleRef.current = newScale;
    setScale(newScale);
    if (newScale <= 1) {
      updatePosition(0, 0);
    }
  }, [updatePosition]);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && scaleRef.current === 1) {
        onClose();
      }
    },
    [onClose]
  );

  // Memoized 스타일
  const imageStyle = useMemo(
    () => ({
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
      willChange: isDragging || isPinching ? "transform" : "auto",
    }),
    [position.x, position.y, scale, rotation, isDragging, isPinching]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Full Screen Image Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ overflow: "hidden" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
          style={imageStyle}
          onMouseDown={handleMouseDown}
          draggable={false}
          loading="lazy"
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
