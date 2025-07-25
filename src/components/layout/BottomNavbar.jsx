import { useNavigate, useLocation } from "react-router";

const BottomNavbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    {
      id: "home",
      path: "/",
      icon: (
        <svg
          className="w-5 h-5"
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
          className="w-5 h-5"
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
      icon: (
        <svg
          className="w-4 h-4"
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
      special: true,
    },
    {
      id: "profile",
      path: "/profile",
      icon: (
        <svg
          className="w-5 h-5"
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
    <div className="fixed w-full max-w-[500px] mx-auto bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100">
      <div className="max-w-2xl mx-auto py-2">
        <nav className="flex items-center justify-around h-14 px-4">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/" // Home 탭 → 오직 “/” 일 때만
                ? pathname === "/"
                : pathname.startsWith(tab.path); // 그 외 탭 → /search, /search/...

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`relative p-3 rounded-xl transition-all duration-200
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
  );
};

export default BottomNavbar;
