import { useEffect, useRef } from "react";

// Affinity 레벨별 설정
const getAffinityTier = (affinity) => {
  const value = affinity || 0;
  if (value >= 80) return { label: "Soulmate", stars: 5 };
  if (value >= 60) return { label: "Best Friend", stars: 4 };
  if (value >= 40) return { label: "Good Friend", stars: 3 };
  if (value >= 20) return { label: "Acquaintance", stars: 2 };
  return { label: "Stranger", stars: 1 };
};

const ProfileModal = ({ isOpen, onClose, character }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        !e.target.closest(".profile-trigger")
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-[90%] max-w-[380px] h-auto max-h-[70dvh] mb-[70px] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        {/* Profile Content */}
        <div className="relative">
          {/* Avatar */}
          <div
            className="relative -mt-1 rounded-t-3xl"
            style={{ paddingLeft: "0.1px" }}
          >
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
                  alt={character.name || character.character}
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
                  {character.name?.charAt(0) ||
                    character.character?.charAt(0) ||
                    "?"}
                </span>
              </div>
            </div>
          </div>

          {/* Name and Role */}
          <div className="text-center mt-4 mb-3 px-4">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              {character.name || character.character || "Unknown Character"}
            </h2>
            <p className="text-xs text-stone-500 font-medium mb-3">
              AI Character
            </p>

            {/* Compact Affinity */}
            {character.affinity !== undefined && (
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {character.affinity || 0}
                  </span>
                </div>
                <div className="w-px h-4 bg-purple-200" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${
                        i < getAffinityTier(character.affinity).stars
                          ? "text-purple-400"
                          : "text-purple-200"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-purple-600 font-medium">
                  {getAffinityTier(character.affinity).label}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          {(character.personality || character.expertise) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {character.personality && (
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-xs text-stone-500 font-medium mb-1">
                    Personality
                  </p>
                  <p className="text-sm text-stone-800 font-semibold">
                    {character.personality}
                  </p>
                </div>
              )}
              {character.expertise && (
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-xs text-stone-500 font-medium mb-1">
                    Expertise
                  </p>
                  <p className="text-sm text-stone-800 font-semibold">
                    {character.expertise}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {character.prompt_description && (
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
                  {character.prompt_description}
                </p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-3">
            {character.background && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-stone-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-stone-500 font-medium mb-0.5">
                    Background
                  </p>
                  <p className="text-sm text-stone-700">
                    {character.background}
                  </p>
                </div>
              </div>
            )}

            {character.interests && character.interests.length > 0 && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-stone-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-stone-500 font-medium mb-1">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {character.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 bg-stone-200 text-stone-700 text-xs font-medium rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
