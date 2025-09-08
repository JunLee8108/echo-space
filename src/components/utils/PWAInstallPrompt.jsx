import { useState, useEffect } from "react";
import { X, SquarePlus, ArrowRight, Share } from "lucide-react";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../utils/translations";

const PWAInstallPrompt = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  const language = useUserLanguage();
  const translate = createTranslator(language);

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
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-[300px] bg-white rounded-lg shadow-md border border-stone-200 p-5 z-50 animate-fadeSlideDown">
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-2 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="pr-6">
          {/* Title with icon */}
          <div className="flex items-start gap-2.5 mb-2">
            <div className="flex-1">
              <h3 className="text-stone-900 font-medium text-sm leading-tight">
                {translate("pwa.installTitle")}
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                {translate("pwa.installBenefit")}
              </p>
            </div>
          </div>

          {/* iOS Installation Steps - Visual Guide */}
          <div className="mt-3 bg-stone-50 rounded-md p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              {/* Step 1 */}
              <div className="flex items-center gap-1">
                <Share className="w-3.5 h-3.5 text-stone-600" />
                <span className="text-stone-700 font-medium">
                  {translate("pwa.ios.click")}
                </span>
              </div>

              <ArrowRight className="w-3 h-3 text-stone-400 flex-shrink-0" />

              {/* Step 2 */}
              <div className="flex items-center gap-1">
                <span className="text-stone-700 font-medium">
                  {translate("pwa.ios.addToHome")}
                </span>
                <SquarePlus className="w-3.5 h-3.5 text-stone-600" />
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
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-[310px] bg-white rounded-lg shadow-md border border-stone-200 p-5 z-50 animate-fadeSlideDown">
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-2 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="pr-6">
          {/* Title with icon */}
          <div className="flex items-start gap-2.5">
            <div className="flex-1">
              <h3 className="text-stone-900 font-medium text-sm leading-tight">
                {translate("pwa.installTitle")}
              </h3>
              <p className="text-stone-500 text-xs mt-0.5 mb-2.5">
                {translate("pwa.installBenefit")}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-md hover:bg-stone-800 transition-colors"
                >
                  {translate("pwa.installButton")}
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-stone-500 text-xs hover:text-stone-700 transition-colors"
                >
                  {translate("pwa.installLater")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add CSS for animation
const styles = `
  @keyframes fadeSlideDown {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fadeSlideDown {
    animation: fadeSlideDown 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PWAInstallPrompt;
