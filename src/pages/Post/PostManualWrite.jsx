// pages/Post/PostManualWrite.jsx
import "./Post.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  Globe,
  Lock,
  Bot,
  BotOff,
  Loader2,
} from "lucide-react";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { postStorage } from "../../components/utils/postStorage";
import CustomEditor from "./CustomEditor";

const PostManualWrite = () => {
  const navigate = useNavigate();
  const createPostMutation = useCreatePost();

  // 상태 관리 - sessionStorage에서 복원
  const [manualContent, setManualContent] = useState(() =>
    postStorage.getManualContent()
  );
  const [manualHashtags, setManualHashtags] = useState(() =>
    postStorage.getManualHashtags()
  );
  const [manualMood, setManualMood] = useState(() =>
    postStorage.getManualMood()
  );
  const [postSettings, setPostSettings] = useState(() =>
    postStorage.getPostSettings()
  );
  const [isSaving, setIsSaving] = useState(false);

  // 컨텐츠 저장
  useEffect(() => {
    postStorage.saveManualContent(manualContent);
  }, [manualContent]);

  // 해시태그 저장
  useEffect(() => {
    postStorage.saveManualHashtags(manualHashtags);
  }, [manualHashtags]);

  // 기분 저장
  useEffect(() => {
    postStorage.saveManualMood(manualMood);
  }, [manualMood]);

  // 게시물 설정 저장
  useEffect(() => {
    postStorage.savePostSettings(postSettings);
  }, [postSettings]);

  // 일기 저장
  const handleSaveDiary = async () => {
    if (!manualContent.trim()) {
      alert("일기 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const postData = {
        content: manualContent,
        mood: manualMood,
        hashtags: manualHashtags,
        visibility: postSettings.visibility,
        allowAIComments: postSettings.allowAIComments,
      };

      await createPostMutation.mutateAsync(postData);

      // 성공시 모든 데이터 클리어
      postStorage.clearAll();

      navigate("/");
    } catch (error) {
      console.error("일기 저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 해시태그 추가 핸들러
  const handleHashtagAdd = (tag) => {
    if (!manualHashtags.includes(tag)) {
      setManualHashtags([...manualHashtags, tag]);
    }
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
              직접 작성
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full page-slide-in">
          <div className="max-w-2xl mx-auto">
            <CustomEditor
              content={manualContent}
              onChange={setManualContent}
              onHashtagAdd={handleHashtagAdd}
            />

            {/* 게시물 설정 */}
            <div className="p-2 mt-6 mb-6">
              {/* Mood 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  오늘의 기분
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setManualMood("happy")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      manualMood === "happy"
                        ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <span className="text-md">😊</span>
                    <span className="text-xs">Happy</span>
                  </button>
                  <button
                    onClick={() => setManualMood("neutral")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      manualMood === "neutral"
                        ? "bg-stone-100 border-stone-500 text-stone-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <span className="text-md">😐</span>
                    <span className="text-xs">Neutral</span>
                  </button>
                  <button
                    onClick={() => setManualMood("sad")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      manualMood === "sad"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <span className="text-md">😢</span>
                    <span className="text-xs">Sad</span>
                  </button>
                </div>
              </div>

              {/* Privacy 설정 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  공개 범위
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        visibility: "private",
                      }))
                    }
                    className={`text-sm flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      postSettings.visibility === "private"
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </button>
                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        visibility: "public",
                      }))
                    }
                    className={`text-sm flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      postSettings.visibility === "public"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </button>
                </div>
              </div>

              {/* AI Comments 설정 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  AI 댓글
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        allowAIComments: true,
                      }))
                    }
                    className={`text-sm flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      postSettings.allowAIComments
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>Enable</span>
                  </button>
                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        allowAIComments: false,
                      }))
                    }
                    className={`text-sm flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      !postSettings.allowAIComments
                        ? "bg-stone-100 border-stone-500 text-stone-700"
                        : "bg-white border-stone-200 text-stone-600"
                    }`}
                  >
                    <BotOff className="w-4 h-4" />
                    <span>Disable</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 해시태그 표시 */}
            {manualHashtags.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {manualHashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    >
                      <span>#</span>
                      <span>{tag}</span>
                      <button
                        onClick={() => {
                          setManualHashtags(
                            manualHashtags.filter((_, i) => i !== index)
                          );
                        }}
                        className="ml-1 hover:text-green-900"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSaveDiary}
              disabled={!manualContent.trim() || isSaving}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  저장하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostManualWrite;
