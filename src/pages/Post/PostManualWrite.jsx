// pages/Post/PostManualWrite.jsx
import "./Post.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  Globe,
  Lock,
  Loader2,
  Users,
  Shield,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { postStorage } from "../../components/utils/postStorage";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";
import CustomEditor from "./CustomEditor";

const PostManualWrite = () => {
  const navigate = useNavigate();
  const userLanguage = useUserLanguage();
  const translate = createTranslator(userLanguage);
  const createPostMutation = useCreatePost();

  // 상태 관리 - sessionStorage에서 복원
  const [manualContent, setManualContent] = useState(() =>
    postStorage.getManualContent()
  );
  const [customHashtags, setCustomHashtags] = useState(() => {
    const saved = postStorage.getManualHashtags();
    return saved && saved.length > 0 ? saved : [];
  });
  const [customMood, setCustomMood] = useState(
    () => postStorage.getManualMood() || "neutral"
  );
  const [postSettings, setPostSettings] = useState(() =>
    postStorage.getPostSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");
  const [hashtagError, setHashtagError] = useState("");

  // 컨텐츠 저장
  useEffect(() => {
    postStorage.saveManualContent(manualContent);
  }, [manualContent]);

  // 해시태그 저장
  useEffect(() => {
    postStorage.saveManualHashtags(customHashtags);
  }, [customHashtags]);

  // 기분 저장
  useEffect(() => {
    postStorage.saveManualMood(customMood);
  }, [customMood]);

  // 게시물 설정 저장
  useEffect(() => {
    postStorage.savePostSettings(postSettings);
  }, [postSettings]);

  // 해시태그 입력 핸들러 - 띄어쓰기 방지 및 소문자 변환
  const handleHashtagInput = (e) => {
    let value = e.target.value;

    // 띄어쓰기 제거
    value = value.replace(/\s/g, "");

    // 소문자로 변환
    value = value.toLowerCase();

    // 한글, 영문, 숫자, 언더스코어만 허용
    value = value.replace(/[^ㄱ-ㅣ가-힣a-zA-Z0-9_]/g, "");

    setNewHashtag(value);
    setHashtagError(""); // 입력 시 에러 메시지 초기화
  };

  // 해시태그 추가 - 강화된 validation
  const handleAddHashtag = () => {
    // 1. trim 및 소문자 변환
    let tag = newHashtag.trim().toLowerCase();

    // 2. # 제거
    tag = tag.replace(/^#/, "");

    // 3. 빈 문자열 체크
    if (!tag) {
      setHashtagError("해시태그를 입력해주세요");
      return;
    }

    // 4. 최대 개수 체크 (5개)
    if (customHashtags.length >= 5) {
      setHashtagError("최대 5개까지 추가 가능합니다");
      return;
    }

    // 5. 중복 체크 (대소문자 무시)
    const isDuplicate = customHashtags.some(
      (existingTag) => existingTag.toLowerCase() === tag
    );

    if (isDuplicate) {
      setHashtagError("이미 추가된 해시태그입니다");
      return;
    }

    // 6. 추가
    setCustomHashtags([...customHashtags, tag]);
    setNewHashtag("");
    setHashtagError("");
  };

  // 해시태그 삭제
  const handleRemoveHashtag = (tagToRemove) => {
    setCustomHashtags(customHashtags.filter((tag) => tag !== tagToRemove));
    setHashtagError(""); // 삭제 시 에러 메시지 초기화
  };

  // Mood 변경
  const handleMoodChange = (mood) => {
    setCustomMood(mood);
  };

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
        mood: customMood,
        hashtags: customHashtags,
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
              {translate("postManual.title")}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto">
            {/* Editor - 전체 width 사용 */}
            <div className="mb-6">
              <CustomEditor
                content={manualContent}
                onChange={setManualContent}
                onHashtagAdd={(tag) => {
                  if (
                    customHashtags.length < 5 &&
                    !customHashtags.includes(tag)
                  ) {
                    setCustomHashtags([...customHashtags, tag]);
                  }
                }}
              />
            </div>

            {/* Mood 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-3">
                {translate("postManual.mood.title")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleMoodChange("happy")}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "happy"
                      ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😊</span>
                    <span className="text-xs font-medium">
                      {translate("postManual.mood.happy")}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleMoodChange("neutral")}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "neutral"
                      ? "bg-stone-100 border-stone-400 text-stone-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😐</span>
                    <span className="text-xs font-medium">
                      {translate("postManual.mood.neutral")}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleMoodChange("sad")}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "sad"
                      ? "bg-blue-50 border-blue-400 text-blue-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😢</span>
                    <span className="text-xs font-medium">
                      {translate("postManual.mood.sad")}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 해시태그 관리 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-3">
                {translate("postManual.hashtag.title", {
                  count: customHashtags.length,
                })}
              </label>

              <div className="bg-white rounded-xl border border-stone-200 p-4">
                {/* 해시태그 목록 */}
                {customHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customHashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
                      >
                        <span>#</span>
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveHashtag(tag)}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 mb-3">
                    {translate("postManual.hashtag.empty")}
                  </p>
                )}

                {/* 해시태그 추가 입력 */}
                {customHashtags.length < 5 && (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newHashtag}
                        onChange={handleHashtagInput}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddHashtag();
                          }
                        }}
                        placeholder={translate(
                          "postManual.hashtag.placeholder"
                        )}
                        className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddHashtag}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {/* 에러 메시지 표시 */}
                    {hashtagError && (
                      <p className="text-xs text-red-500 mt-1">
                        {hashtagError}
                      </p>
                    )}
                  </div>
                )}

                {customHashtags.length >= 5 && (
                  <p className="text-xs text-stone-500 text-center">
                    {translate("postManual.hashtag.maxReached")}
                  </p>
                )}
              </div>
            </div>

            {/* 게시물 설정 */}
            <div className="space-y-6 mb-8">
              {/* 공개 범위 설정 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  {translate("postManual.visibility.title")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        visibility: "private",
                      }))
                    }
                    className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      postSettings.visibility === "private"
                        ? "bg-purple-50 border-purple-200 text-purple-700"
                        : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {postSettings.visibility === "private" ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {translate("postManual.visibility.private")}
                      </span>
                    </div>
                    {postSettings.visibility === "private" && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        visibility: "public",
                      }))
                    }
                    className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      postSettings.visibility === "public"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {postSettings.visibility === "public" ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {translate("postManual.visibility.public")}
                      </span>
                    </div>
                    {postSettings.visibility === "public" && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* AI 댓글 설정 */}
              <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl p-4 border border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {translate("postManual.aiComments.title")}
                      </label>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {translate("postManual.aiComments.description")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setPostSettings((prev) => ({
                        ...prev,
                        allowAIComments: !prev.allowAIComments,
                      }))
                    }
                    className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: postSettings.allowAIComments
                        ? "#6a83ff"
                        : "#E5E7EB",
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        postSettings.allowAIComments
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSaveDiary}
              disabled={isSaving || !manualContent.trim()}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {translate("postManual.save.saving")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {translate("postManual.save.button")}
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
