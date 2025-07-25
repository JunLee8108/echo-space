import { useEffect, useRef } from "react";

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
        className="relative w-[90%] max-w-[380px] max-h-[70dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        {/* Profile Content */}
        <div className="relative px-4 pt-20 pb-4">
          {/* Avatar */}
          <div className="relative -mt-16 mb-2">
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
            <div className="w-full h-50 mx-auto rounded-2xl shadow-xl overflow-hidden bg-white">
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.name}
                  className="w-full h-full object-cover"
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
                  {character.name?.charAt(0) || "?"}
                </span>
              </div>
            </div>
          </div>

          {/* Name and Role */}
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              {character.name || "Unknown Character"}
            </h2>

            <p className="text-xs text-stone-500 font-medium">AI Character</p>
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
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center">
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
