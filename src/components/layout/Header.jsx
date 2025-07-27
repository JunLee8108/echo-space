import { useState } from "react"; // useState 추가
import supabase from "../../services/supabaseClient";
import ConfirmationModal from "../UI/ConfirmationModal";

const Header = ({ notificationCount = 0 }) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false); // 모달 상태 추가

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out failed:", error.message);
      return;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-stone-700 to-stone-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-base font-semibold text-stone-900">
              EchoSpace
            </h1>
          </div>

          {/* Navigation Section */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setShowSignOutModal(true)} // 바로 로그아웃이 아닌 모달 표시
              className="text-sm mr-2 text-stone-600 hover:text-stone-900 transition-colors"
            >
              Sign Out
            </button>

            <button className="p-2 rounded-lg hover:bg-stone-50 transition-colors relative">
              <svg
                className="w-5 h-5 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonClass="bg-rose-700 hover:bg-rose-800"
        icon="warning"
      />
    </>
  );
};

export default Header;
