import { Navigate } from "react-router";
import { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isValidReset, setIsValidReset] = useState(false);

  useEffect(() => {
    checkResetToken();
  }, []);

  const checkResetToken = async () => {
    try {
      // URL에서 토큰 확인
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      // 비밀번호 재설정 토큰인지 확인
      if (type === "recovery" && accessToken) {
        // 토큰으로 세션 확인
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!error && session) {
          setIsValidReset(true);
        } else {
          setIsValidReset(false);
        }
      } else {
        setIsValidReset(false);
      }
    } catch (error) {
      console.error("Error checking reset token:", error);
      setIsValidReset(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // 유효한 재설정 토큰이 없으면 홈으로 리다이렉트
  if (!isValidReset) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
