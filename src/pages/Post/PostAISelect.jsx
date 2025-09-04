// pages/Post/PostAISelect.jsx
import { useNavigate } from "react-router";
import { ArrowLeft, Bot, ChevronRight } from "lucide-react";
import { useFollowedCharacters } from "../../stores/characterStore";

const PostAISelect = () => {
  const navigate = useNavigate();
  const followedCharacters = useFollowedCharacters();

  const handleSelectCharacter = (character) => {
    console.log("Selected character:", character); // 디버깅용
    console.log("Character ID:", character.id, "Type:", typeof character.id);

    // 캐릭터 ID를 URL로 전달
    const path = `/post/new/ai/${character.id}`;
    console.log("Navigating to:", path); // 디버깅용

    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/post/new")}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-md font-semibold text-stone-900">
              AI 일기 작성
            </h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <div className="w-2 h-2 rounded-full bg-stone-300" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full page-slide-in">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Bot className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h2 className="text-md font-bold text-stone-900">
                대화할 AI 친구를 선택하세요
              </h2>
            </div>

            <div className="grid gap-3">
              {followedCharacters.length > 0 ? (
                followedCharacters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => handleSelectCharacter(character)}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-all"
                  >
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {character.name[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-stone-900">
                        {character.name}
                      </h3>
                      <p className="text-sm text-stone-600 line-clamp-1">
                        {character.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400" />
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600 mb-4">
                    아직 팔로우한 AI 캐릭터가 없습니다
                  </p>
                  <button
                    onClick={() => navigate("/search")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    AI 캐릭터 찾기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAISelect;
