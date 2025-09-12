import { useEffect, useRef, useState } from "react";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../utils/translations";

// Affinity 레벨별 설정
const getAffinityTier = (affinity) => {
  const value = affinity || 0;
  if (value >= 80)
    return {
      label: "Soulmate",
      stars: 5,
      colors: {
        bg: "from-pink-50 to-red-50",
        icon: "from-pink-400 to-red-400",
        text: "from-pink-600 to-red-600",
        star: "text-pink-400",
        starEmpty: "text-pink-200",
        label: "text-pink-600",
        divider: "bg-pink-200",
      },
    };
  if (value >= 60)
    return {
      label: "Bond",
      stars: 4,
      colors: {
        bg: "from-purple-50 to-pink-50",
        icon: "from-purple-400 to-pink-400",
        text: "from-purple-600 to-pink-600",
        star: "text-purple-400",
        starEmpty: "text-purple-200",
        label: "text-purple-600",
        divider: "bg-purple-200",
      },
    };
  if (value >= 40)
    return {
      label: "Warmth",
      stars: 3,
      colors: {
        bg: "from-blue-50 to-indigo-50",
        icon: "from-blue-400 to-indigo-400",
        text: "from-blue-600 to-indigo-600",
        star: "text-blue-400",
        starEmpty: "text-blue-200",
        label: "text-blue-600",
        divider: "bg-blue-200",
      },
    };
  if (value >= 20)
    return {
      label: "Spark",
      stars: 2,
      colors: {
        bg: "from-teal-50 to-cyan-50",
        icon: "from-teal-400 to-cyan-400",
        text: "from-teal-600 to-cyan-600",
        star: "text-teal-400",
        starEmpty: "text-teal-200",
        label: "text-teal-600",
        divider: "bg-teal-200",
      },
    };
  return {
    label: "Stranger",
    stars: 1,
    colors: {
      bg: "from-gray-50 to-slate-50",
      icon: "from-gray-400 to-slate-400",
      text: "from-gray-600 to-slate-600",
      star: "text-gray-400",
      starEmpty: "text-gray-200",
      label: "text-gray-600",
      divider: "bg-gray-200",
    },
  };
};

// Affinity 정보 모달 컴포넌트
const AffinityInfoModal = ({ isOpen, onClose, affinityTier, userLanguage }) => {
  const modalRef = useRef(null);
  const translate = createTranslator(userLanguage);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        !e.target.closest(".affinity-trigger")
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation(); // ProfileModal로 이벤트 전파 방지
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape, true); // capture phase에서 처리
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        className="relative w-[90%] max-w-[320px] mb-[90px] sm:mb-[70px] bg-white rounded-2xl shadow-2xl p-6 transform transition-all"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-4">
          <div
            className={`w-8 h-8 mx-auto bg-gradient-to-br ${affinityTier.colors.icon} rounded-full flex items-center justify-center mb-3`}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </div>
          <h3 className="text-md font-bold text-gray-900 mb-1">
            {translate("profile.affinity.modalTitle")}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {translate("profile.affinity.method1Title")}
              </p>
              <p className="text-xs/4.5 text-gray-500">
                {translate("profile.affinity.method1Desc")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {translate("profile.affinity.method2Title")}
              </p>
              <p className="text-xs/4.5 text-gray-500">
                {translate("profile.affinity.method2Desc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, character }) => {
  const modalRef = useRef(null);
  const [showAffinityInfo, setShowAffinityInfo] = useState(false);

  const userLanguage = useUserLanguage();
  const characterName =
    userLanguage === "Korean"
      ? character?.korean_name || "알 수없는 캐릭터"
      : character?.name || character?.character || "Unknown Character";

  const characterDes =
    userLanguage === "Korean"
      ? character?.korean_description
      : character?.description;

  // console.log(character);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        !e.target.closest(".profile-trigger") &&
        !showAffinityInfo // Affinity 모달이 열려있을 때는 ProfileModal 닫지 않음
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !showAffinityInfo) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, showAffinityInfo]);

  if (!isOpen || !character) return null;

  const affinityTier = getAffinityTier(character.affinity);

  return (
    <>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="relative w-[90%] max-w-[380px] h-auto max-h-[70dvh] mb-[90px] sm:mb-[70px] overflow-y-auto bg-white rounded-3xl shadow-2xl"
        >
          {/* Profile Content */}
          <div className="relative">
            {/* Avatar */}
            <div className="relative -mt-1 rounded-t-3xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="w-full h-50 mx-auto shadow-xl overflow-hidden bg-white rounded-t-3xl">
                {character.avatar_url ? (
                  <img
                    src={character.avatar_url}
                    alt={characterName}
                    className="w-full h-full object-cover rounded-t-3xl"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center"
                  style={{ display: character.avatar_url ? "none" : "flex" }}
                >
                  <span className="text-4xl text-white font-bold">
                    {characterName.charAt(0) || "?"}
                  </span>
                </div>
              </div>
            </div>

            {/* Name and Role */}
            <div className="text-center mt-3 mb-3 px-4">
              <h2 className="text-lg font-bold text-stone-900 mb-3">
                {characterName}
              </h2>

              {/* Array personality - 이름 바로 아래에 배치 */}
              {Array.isArray(character.personality) &&
                character.personality.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                    {character.personality.map((trait, idx) => (
                      <span
                        key={idx}
                        className="text-xs min-w-[80px] font-medium text-stone-600 px-2.5 py-1 bg-stone-100/60 backdrop-blur-sm rounded-md border border-stone-200/50"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}

              {/* Compact Affinity - 클릭 가능하게 수정 */}
              {character.affinity !== undefined && (
                <button
                  onClick={() => setShowAffinityInfo(true)}
                  className={`affinity-trigger inline-flex items-center gap-3 bg-gradient-to-r ${affinityTier.colors.bg} px-6 py-2 rounded-full hover:brightness-97 transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 bg-gradient-to-br ${affinityTier.colors.icon} rounded-full flex items-center justify-center`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </div>
                    <span
                      className={`text-sm font-semibold bg-gradient-to-r ${affinityTier.colors.text} bg-clip-text text-transparent`}
                    >
                      {character.affinity || 0}
                    </span>
                  </div>
                  <div className={`w-px h-4 ${affinityTier.colors.divider}`} />
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3 h-3 ${
                          i < affinityTier.stars
                            ? affinityTier.colors.star
                            : affinityTier.colors.starEmpty
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${affinityTier.colors.label}`}
                  >
                    {affinityTier.label}
                  </span>
                </button>
              )}
            </div>

            {/* Stats - string personality용만 남김 */}
            {typeof character.personality === "string" && (
              <div className="px-4 mb-6">
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-xs text-stone-500 font-medium mb-1">
                    Personality
                  </p>
                  <p className="text-sm text-stone-800 font-semibold">
                    {character.personality}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {characterDes && (
              <div className="px-4 mb-4 mt-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-stone-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  About
                </h3>
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {characterDes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Affinity Info Modal */}
      <AffinityInfoModal
        isOpen={showAffinityInfo}
        onClose={() => setShowAffinityInfo(false)}
        affinityTier={affinityTier}
        userLanguage={userLanguage}
      />
    </>
  );
};

export default ProfileModal;
