import { useState } from "react";
import { useCharacters } from "../components/hooks/useCharacters";

const Profile = ({ user }) => {
  const {
    characters,
    followedCharacterIds,
    toggleFollow,
    loading: contextLoading,
  } = useCharacters();

  const [localLoading, setLocalLoading] = useState(false);

  const handleToggleFollow = async (character) => {
    setLocalLoading(true);
    try {
      await toggleFollow(character);
    } catch {
      alert("팔로우 상태 변경에 실패했습니다.");
    } finally {
      setLocalLoading(false);
    }
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email || "User";

  // Show loading state if context is still loading
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-stone-600 to-stone-800 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 mb-1">
                {displayName}
              </h1>
              <p className="text-stone-600 text-xs">
                Managing your AI companions
              </p>
            </div>
          </div>
        </div>

        {/* Following Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                AI Companions
              </h2>
            </div>
            <div className="text-sm text-stone-500 flex-shrink-0">
              {followedCharacterIds.size} following
            </div>
          </div>

          {/* Characters Grid */}
          <div className="space-y-3">
            {characters.map((character) => {
              const isFollowed = followedCharacterIds.has(character.id);

              return (
                <div
                  key={character.id}
                  className="bg-white rounded-2xl border border-stone-100 p-6 hover:border-stone-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 mr-4">
                      {/* Character Avatar */}
                      <div className="relative">
                        {character.avatar_url ? (
                          <img
                            src={character.avatar_url}
                            alt={character.name}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-14 h-14 bg-gradient-to-br from-stone-500 to-stone-700 rounded-2xl flex items-center justify-center shadow-sm"
                          style={{
                            display: character.avatar_url ? "none" : "flex",
                          }}
                        >
                          <span className="text-white text-lg font-bold">
                            {character.name.charAt(0)}
                          </span>
                        </div>

                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>

                      {/* Character Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-900 mb-1">
                          {character.name}
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                          {character.prompt_description.split(".")[0]}.
                        </p>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => handleToggleFollow(character)}
                      disabled={localLoading || contextLoading}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-w-[100px] ${
                        isFollowed
                          ? "bg-stone-900 text-white hover:bg-stone-800"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {localLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        </div>
                      ) : isFollowed ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-stone-50 rounded-2xl p-6">
          <h3 className="font-semibold text-center text-stone-900 mb-4">
            Interaction Stats
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-900 mb-1">
                {followedCharacterIds.size}
              </div>
              <div className="text-sm text-stone-600">Active Companions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-900 mb-1">
                {characters.length - followedCharacterIds.size}
              </div>
              <div className="text-sm text-stone-600">Inactive</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-500 leading-relaxed">
              Only followed AI companions will comment on and like your posts.
              You can change this anytime.
            </p>
          </div>
        </div>

        {/* Settings Hint */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Pro Tip</p>
              <p className="text-sm text-blue-700">
                Different AI companions have unique personalities and will
                respond differently to your posts. Try following different
                combinations!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
