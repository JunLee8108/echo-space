// ScrollToTop.tsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // 해시(#section) 이동이면 유지하고, 그 외엔 0으로
    if (!hash) {
      // Safari 호환: 문서 요소가 없는 경우 대비
      const scrollTarget =
        document.scrollingElement || document.documentElement;
      scrollTarget.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname, hash]);

  return null; // 렌더링 없음
}
