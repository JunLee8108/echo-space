import { useState, useEffect } from "react";
import { X } from "lucide-react";

const PWAInstallPrompt = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );
    setIsIOS(isIOSDevice);

    // Check if in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");
    setIsInStandaloneMode(isStandalone);

    // Show iOS prompt if iOS and not in standalone
    if (isIOSDevice && !isStandalone) {
      // Delay showing iOS prompt for better UX
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000);
    }

    // Handle beforeinstallprompt for other browsers
    const handler = (e) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async (evt) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }

    const result = await promptInstall.prompt();
    console.log("Install prompt result:", result);

    if (result.outcome === "accepted") {
      setSupportsPWA(false);
    }
  };

  const handleDismiss = () => {
    setSupportsPWA(false);
    setShowIOSPrompt(false);
  };

  // Don't show anything if dismissed or in standalone mode
  if (isInStandaloneMode) {
    return null;
  }

  // iOS Install Prompt
  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-5 z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📔</span>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Install DiaryFriend
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Keep your thoughts close - Install for quick access
            </p>

            <div className="bg-white/10 rounded-lg p-3 text-white/95 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">1.</span>
                <span>
                  Tap the Share button (공유 버튼){" "}
                  <span className="inline-block">⎙</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-base">2.</span>
                <span>
                  Scroll and tap "Add to Home Screen" (홈 화면에 추가)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-base">3.</span>
                <span>Tap "Add" (추가)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard PWA Install Prompt (Chrome, Edge, etc.)
  if (supportsPWA && promptInstall) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-5 z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Install DiaryFriend
            </h3>
            <p className="text-white/90 text-sm mb-4">
              Your personal echo chamber - Always within reach
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-blue-600 font-medium py-2.5 px-4 rounded-xl hover:bg-white/95 transition-all transform hover:scale-105"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-white/90 hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add CSS for animation (add to your global CSS or as a styled component)
const styles = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PWAInstallPrompt;
