import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { updatePassword } from "../services/authService";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import supabase from "../services/supabaseClient";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // 세션 확인 - /auth/confirm을 통해 왔다면 세션이 있을 것
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!session || error) {
        console.log("No valid session for password reset");
        navigate("/");
        return;
      }

      // 추가로 onAuthStateChange를 사용하여 PASSWORD_RECOVERY 이벤트 감지
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth event:", event);
          if (event === "PASSWORD_RECOVERY" && session) {
            console.log("Password recovery session confirmed");
          }
        }
      );

      setIsCheckingAuth(false);

      // Cleanup
      return () => {
        authListener?.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Access check error:", error);
      navigate("/");
    }
  };

  useEffect(() => {
    // Check password strength
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Password update error:", error);
      setError(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 인증 확인 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              비밀번호가 변경되었습니다!
            </h2>
            <p className="text-green-700">
              잠시 후 메인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-stone-600 to-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              새 비밀번호 설정
            </h1>
            <p className="text-stone-600">안전한 새 비밀번호를 입력해주세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Indicators */}
            <div className="bg-stone-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-stone-700 mb-2">
                비밀번호 조건:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.length
                      ? "text-green-600"
                      : "text-stone-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      passwordStrength.length ? "bg-green-500" : "bg-stone-300"
                    }`}
                  />
                  8자 이상
                </div>
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.uppercase
                      ? "text-green-600"
                      : "text-stone-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      passwordStrength.uppercase
                        ? "bg-green-500"
                        : "bg-stone-300"
                    }`}
                  />
                  대문자 포함
                </div>
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.lowercase
                      ? "text-green-600"
                      : "text-stone-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      passwordStrength.lowercase
                        ? "bg-green-500"
                        : "bg-stone-300"
                    }`}
                  />
                  소문자 포함
                </div>
                <div
                  className={`flex items-center text-xs ${
                    passwordStrength.number
                      ? "text-green-600"
                      : "text-stone-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      passwordStrength.number ? "bg-green-500" : "bg-stone-300"
                    }`}
                  />
                  숫자 포함
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "비밀번호 변경"
              )}
            </button>
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-stone-600 hover:text-stone-900 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
