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
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useFollowedCharacterIds } from "../../stores/characterStore";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { usePostActions } from "../../stores/postStore";
import { postStorage } from "../../components/utils/postStorage";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";
import CustomEditor from "./CustomEditor";

const PostManualWrite = () => {
  const navigate = useNavigate();
  const userLanguage = useUserLanguage();
  const translate = createTranslator(userLanguage);
  const createPostMutation = useCreatePost();
  const followedCharacterIds = useFollowedCharacterIds();
  const { setViewMonth } = usePostActions();

  // 팔로우 상태 체크
  const hasFollowedCharacters = followedCharacterIds.size > 0;

  // 선택된 날짜 가져오기
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const dateStr = postStorage.getSelectedDate();
    if (dateStr) {
      setSelectedDate(new Date(dateStr));
    }
  }, []);

  // 날짜 포맷팅
  const formatSelectedDate = (date) => {
    if (!date) return null;

    const options =
      userLanguage === "Korean"
        ? { year: "numeric", month: "long", day: "numeric", weekday: "long" }
        : { weekday: "long", year: "numeric", month: "long", day: "numeric" };

    return date.toLocaleDateString(
      userLanguage === "Korean" ? "ko-KR" : "en-US",
      options
    );
  };

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

  // postSettings 초기화 수정 - 팔로우 체크 추가
  const [postSettings, setPostSettings] = useState(() => {
    const saved = postStorage.getPostSettings();
    // 팔로우가 없으면 AI 댓글 강제 OFF
    if (!hasFollowedCharacters) {
      return {
        ...saved,
        allowAIComments: false,
      };
    } else {
      return {
        ...saved,
        allowAIComments: true,
      };
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");
  const [hashtagError, setHashtagError] = useState("");

  // 팔로우 상태 변경 감지
  useEffect(() => {
    // 팔로우가 없어지면 AI 댓글 OFF
    if (!hasFollowedCharacters && postSettings.allowAIComments) {
      setPostSettings((prev) => ({
        ...prev,
        allowAIComments: false,
      }));
    }
  }, [hasFollowedCharacters, postSettings.allowAIComments]);

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

  // 해시태그 입력 핸들러
  const handleHashtagInput = (e) => {
    let value = e.target.value;
    value = value.replace(/\s/g, "");
    value = value.toLowerCase();
    value = value.replace(/[^ㄱ-ㅣ가-힣a-zA-Z0-9_]/g, "");
    setNewHashtag(value);
    setHashtagError("");
  };

  // 해시태그 추가
  const handleAddHashtag = () => {
    let tag = newHashtag.trim().toLowerCase();
    tag = tag.replace(/^#/, "");

    if (!tag) {
      setHashtagError("해시태그를 입력해주세요");
      return;
    }

    if (customHashtags.length >= 5) {
      setHashtagError("최대 5개까지 추가 가능합니다");
      return;
    }

    const isDuplicate = customHashtags.some(
      (existingTag) => existingTag.toLowerCase() === tag
    );

    if (isDuplicate) {
      setHashtagError("이미 추가된 해시태그입니다");
      return;
    }

    setCustomHashtags([...customHashtags, tag]);
    setNewHashtag("");
    setHashtagError("");
  };

  // 해시태그 삭제
  const handleRemoveHashtag = (tagToRemove) => {
    setCustomHashtags(customHashtags.filter((tag) => tag !== tagToRemove));
    setHashtagError("");
  };

  // Mood 변경
  const handleMoodChange = (mood) => {
    setCustomMood(mood);
  };

  // 일기 저장 - entry_date 추가
  const handleSaveDiary = async () => {
    if (!manualContent.trim()) {
      alert("일기 내용을 입력해주세요.");
      return;
    }

    // 팔로우가 없으면 AI 댓글 강제 OFF
    const finalAllowAIComments = hasFollowedCharacters
      ? postSettings.allowAIComments
      : false;

    setIsSaving(true);

    try {
      const postData = {
        content: manualContent,
        mood: customMood,
        hashtags: customHashtags,
        visibility: postSettings.visibility,
        allowAIComments: finalAllowAIComments,
        entry_date: selectedDate
          ? selectedDate.toISOString()
          : new Date().toISOString(), // 선택된 날짜 사용
      };

      // createPostMutation이 내부적으로 addNewPost 호출
      const savedPost = await createPostMutation.mutateAsync(postData);

      // Home의 형식에 맞춰 날짜 키 생성
      const postDate = new Date(savedPost.entryDate || savedPost.createdAt);
      const year = postDate.getFullYear();
      const month = postDate.getMonth(); // 0-based 그대로 사용
      const day = postDate.getDate();

      // Home의 formatDateKey와 동일한 형식
      const dateKey = `${year}-${month}-${day}`;

      // 해당 월로 뷰 변경
      setViewMonth(postDate);

      // 하이라이트용 날짜 저장
      sessionStorage.setItem("just_created_date", dateKey);

      // 성공 후 모든 데이터 클리어
      postStorage.clearSelectedDate(); // 선택된 날짜 클리어
      postStorage.clearAll();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("일기 저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
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
              {translate("postManual.title")}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto">
            {/* 선택된 날짜 표시 */}
            {selectedDate && (
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-stone-900 font-medium">
                      {formatSelectedDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Editor */}
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
              <div
                className={`bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl p-4 border ${
                  !hasFollowedCharacters
                    ? "border-amber-200"
                    : "border-stone-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Sparkles
                        className={`w-5 h-5 ${
                          !hasFollowedCharacters
                            ? "text-stone-400"
                            : "text-purple-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${
                          !hasFollowedCharacters
                            ? "text-stone-500"
                            : "text-stone-700"
                        }`}
                      >
                        {translate("postManual.aiComments.title")}
                      </label>
                      <p
                        className={`text-xs mt-0.5 ${
                          !hasFollowedCharacters
                            ? "text-stone-400"
                            : "text-stone-500"
                        }`}
                      >
                        {translate("postManual.aiComments.description")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!hasFollowedCharacters) return;

                      setPostSettings((prev) => ({
                        ...prev,
                        allowAIComments: !prev.allowAIComments,
                      }));
                    }}
                    disabled={!hasFollowedCharacters}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                      !hasFollowedCharacters
                        ? "opacity-50 cursor-not-allowed"
                        : "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    }`}
                    style={{
                      backgroundColor:
                        postSettings.allowAIComments && hasFollowedCharacters
                          ? "#6a83ff"
                          : "#E5E7EB",
                    }}
                    aria-label={
                      !hasFollowedCharacters
                        ? "AI 댓글 비활성화됨 - 캐릭터를 팔로우해주세요"
                        : `AI 댓글 ${
                            postSettings.allowAIComments ? "활성화" : "비활성화"
                          }`
                    }
                    aria-disabled={!hasFollowedCharacters}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        postSettings.allowAIComments && hasFollowedCharacters
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* 팔로우 안내 메시지 */}
                {!hasFollowedCharacters && (
                  <div className="mt-3 flex items-start gap-2 px-2 py-2 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700 font-medium">
                        AI 댓글을 받으려면 AI 캐릭터를 팔로우해주세요
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        프로필 페이지에서 원하는 캐릭터를 팔로우할 수 있습니다
                      </p>
                    </div>
                  </div>
                )}
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
