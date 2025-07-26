import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import supabase from "../services/supabaseClient";

const AuthConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleAuthConfirm();
  }, []);

  const handleAuthConfirm = async () => {
    try {
      // URL 파라미터 가져오기
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const next = searchParams.get("next");

      console.log("Auth confirm params:", { tokenHash, type, next });

      if (!tokenHash || !type) {
        console.error("Missing required parameters");
        navigate("/");
        return;
      }

      // Supabase가 자동으로 토큰을 검증하고 세션을 생성
      // verifyOtp를 사용하여 토큰 검증
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type,
      });

      if (error) {
        console.error("Token verification error:", error);
        navigate("/");
        return;
      }

      console.log("Verification successful:", data);

      // 성공하면 next 페이지로 이동
      if (next) {
        // 세션 저장을 위해 잠시 대기
        setTimeout(() => {
          navigate(next);
        }, 100);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Auth confirm error:", error);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto mb-4"></div>
        <p className="text-stone-600">인증 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthConfirm;
