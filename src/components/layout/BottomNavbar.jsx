import { useNavigate, useLocation } from "react-router";
import { useRef } from "react";

import { Calendar } from "lucide-react";

const BottomNavbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const touchHandledRef = useRef(false);

  const handleNavigation = (path) => {
    // 이미 같은 경로에 있으면 무시
    if (pathname === path) return;

    navigate(path);
  };

  const handleAction = (tab) => {
    if (!tab) return;

    // 이미 터치로 처리했으면 클릭 이벤트 무시
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }

    if (tab.onClick) {
      tab.onClick();
    } else if (tab.path) {
      handleNavigation(tab.path);
    }
  };

  const handleTouchEnd = (e, tab) => {
    e.preventDefault(); // 클릭 이벤트 발생 방지
    touchHandledRef.current = true;

    if (tab.onClick) {
      tab.onClick();
    } else if (tab.path) {
      handleNavigation(tab.path);
    }
  };

  const tabs = [
    {
      id: "home",
      path: "/",
      icon: (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "search",
      path: "/search",
      icon: (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      id: "add",
      path: "/post/new",
      special: true,
      icon: (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      id: "calendar",
      path: "/calendar",
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />,
    },
    {
      id: "profile",
      path: "/profile",
      icon: (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .navbar-button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .navbar-button:active {
          transform: scale(0.95);
          opacity: 0.9;
        }
      `}</style>

      <div className="fixed w-full max-w-[500px] mx-auto bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100">
        <div className="max-w-2xl mx-auto py-2 pb-8 sm:pb-2">
          <nav className="flex items-center justify-around h-14 px-4">
            {tabs.map((tab) => {
              const isActive = tab.path
                ? tab.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.path)
                : false;

              return (
                <button
                  key={tab.id}
                  onTouchEnd={(e) => handleTouchEnd(e, tab)}
                  onClick={() => handleAction(tab)}
                  className={`navbar-button relative p-3 sm:p-4 rounded-xl transition-all duration-200
                    ${
                      tab.special
                        ? "bg-gradient-to-br from-stone-700 to-stone-900 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : isActive
                        ? "text-stone-900 bg-stone-100"
                        : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                    }`}
                >
                  {tab.icon}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default BottomNavbar;
