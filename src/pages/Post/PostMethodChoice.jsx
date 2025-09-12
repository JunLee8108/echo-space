// pages/Post/PostMethodChoice.jsx
import { useNavigate } from "react-router";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";
import { postStorage } from "../../components/utils/postStorage";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  PenTool,
  Calendar,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const PostMethodChoice = () => {
  const navigate = useNavigate();
  const userLanguage = useUserLanguage();
  const translate = createTranslator(userLanguage);

  // 선택된 날짜 가져오기
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const dateStr = postStorage.getSelectedDate();
    if (dateStr) {
      setSelectedDate(new Date(dateStr));
    }
  }, []);

  // 날짜 타이틀 가져오기
  const getDateTitle = () => {
    if (!selectedDate) {
      return translate("postMethod.mainTitle");
    }

    return translate("postMethod.dateTitle", {
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
      date: selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    // 선택된 날짜가 있으면 클리어
    if (selectedDate) {
      postStorage.clearSelectedDate();
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-md font-semibold text-stone-900">
              {translate("postMethod.title")}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-8 overflow-y-auto h-full">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-stone-900 mb-1">
                {getDateTitle()}
              </h2>
              <p className="text-sm text-stone-600">
                {translate("postMethod.subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/post/new/ai")}
                className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all group"
              >
                <Bot className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-900 mb-2">
                  {translate("postMethod.aiOption.title")}
                </h3>
                <p className="text-xs text-stone-600">
                  {translate("postMethod.aiOption.description")}
                </p>
                <div className="mt-4 inline-flex items-center text-blue-600 text-sm">
                  <span>{translate("postMethod.startButton")}</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => navigate("/post/new/manual")}
                className="w-full p-6 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-all group"
              >
                <PenTool className="w-10 h-10 text-stone-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-900 mb-2">
                  {translate("postMethod.manualOption.title")}
                </h3>
                <p className="text-xs text-stone-600">
                  {translate("postMethod.manualOption.description")}
                </p>
                <div className="mt-4 inline-flex items-center text-stone-600 text-sm">
                  <span>{translate("postMethod.startButton")}</span>
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
