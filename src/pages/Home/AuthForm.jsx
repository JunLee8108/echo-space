// src/components/AuthForm.jsx - Enhanced with Display Name, Language and userStore
import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";

const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Mode transition animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let data, error;

    if (mode === "signIn") {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } else {
      // 회원가입 시 display_name과 language 포함
      ({ data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || email.split("@")[0],
            language: language,
          },
        },
      }));

      // If sign up is successful
      if (!error && data) {
        setRegisteredEmail(email);
        setShowSuccessModal(true);
        setEmail("");
        setPassword("");
        setDisplayName("");
        setLanguage("English");
        // Switch to sign in mode after a short delay
        setTimeout(() => {
          handleModeToggle("signIn");
        }, 500);
      }
    }

    setIsLoading(false);
    if (error) return alert(error.message);
    // onAuthStateChange가 자동으로 처리하므로 별도 콜백 불필요
  };

  const handleModeToggle = (newMode) => {
    setIsTransitioning(true);
    setMode(newMode);

    // 모드 전환시 모든 입력값 초기화
    setEmail("");
    setPassword("");
    setDisplayName("");
    setLanguage("English");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <img src="/logo.png" className="rounded-lg"></img>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mr-4">
              DiaryFriend
            </h1>
          </div>
          <div
            className={`transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 transform -translate-y-2"
                : "opacity-100 transform translate-y-0"
            }`}
          >
            <p className="text-stone-600">
              {mode === "signIn"
                ? "Welcome back! Sign in to continue."
                : "Create an account to start sharing."}
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl border border-stone-100 p-8 transition-all duration-300 `}
        >
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Mode Indicator */}
            <div className="flex justify-center mb-6">
              <div className="bg-stone-100 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => handleModeToggle("signIn")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === "signIn"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleModeToggle("signUp")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === "signUp"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                />
                <svg
                  className="absolute left-4 top-3.5 w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                />
                <svg
                  className="absolute left-4 top-3.5 w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Display Name Input - 회원가입 모드에서만 표시 */}
            {mode === "signUp" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="How others will see you"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  />
                  <svg
                    className="absolute left-4 top-3.5 w-4 h-4 text-stone-400"
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
                </div>
              </div>
            )}

            {/* Language Selection - 회원가입 모드에서만 표시 */}
            {mode === "signUp" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    required
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="Korean">Korean</option>
                  </select>
                  <svg
                    className="absolute left-4 top-3.5 w-4 h-4 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <svg
                    className="absolute right-4 top-3.5 w-4 h-4 text-stone-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-stone-700 to-stone-900 text-white font-medium py-3 px-4 rounded-xl hover:from-stone-800 hover:to-stone-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === "signIn" ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-500 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                We've sent a confirmation email to{" "}
                <span className="font-medium">{registeredEmail}</span>.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-stone-900 text-white py-2 px-4 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
