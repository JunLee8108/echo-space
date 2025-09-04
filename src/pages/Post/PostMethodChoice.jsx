// pages/Post/PostMethodChoice.jsx
import { useNavigate } from "react-router";
import { ArrowLeft, Bot, ChevronRight, PenTool } from "lucide-react";

const PostMethodChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-md font-semibold text-stone-900">
              새 일기 작성
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-8 overflow-y-auto h-full page-slide-in">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-stone-900 mb-2">
                오늘 하루를 기록하기
              </h2>
              <p className="text-sm text-stone-600">
                어떤 방식으로 작성하시겠어요?
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/post/new/ai")}
                className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all group"
              >
                <Bot className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-900 mb-2">
                  AI와 대화하며 작성
                </h3>
                <p className="text-sm text-stone-600">
                  AI 친구와 대화를 나누며 자연스럽게 일기를 완성해보세요
                </p>
                <div className="mt-4 inline-flex items-center text-blue-600 text-sm">
                  <span>시작하기</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => navigate("/post/new/manual")}
                className="w-full p-6 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-all group"
              >
                <PenTool className="w-10 h-10 text-stone-600 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-900 mb-2">
                  직접 작성하기
                </h3>
                <p className="text-sm text-stone-600">
                  나만의 스타일로 자유롭게 일기를 작성해보세요
                </p>
                <div className="mt-4 inline-flex items-center text-stone-600 text-sm">
                  <span>시작하기</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostMethodChoice;
