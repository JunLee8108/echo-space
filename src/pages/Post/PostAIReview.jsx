// pages/Post/PostAIReview.jsx
import "./Post.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Edit3,
  Check,
  Globe,
  Lock,
  Loader2,
  Users,
  Shield,
  Sparkles,
  X,
  Plus,
  User,
  RefreshCw,
  Bot,
  Calendar,
} from "lucide-react";
import { useFollowedCharacters } from "../../stores/characterStore";
import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { postStorage } from "../../components/utils/postStorage";
import CustomEditor from "./CustomEditor";

const PostAIReview = () => {
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const userLanguage = useUserLanguage();
  const translate = createTranslator(userLanguage);
  const followedCharacters = useFollowedCharacters();
  const createPostMutation = useCreatePost();

  const selectedCharacter = followedCharacters.find(
    (c) =>
      c.id === characterId ||
      c.id === parseInt(characterId) ||
      c.id === String(characterId)
  );

  const isEditing = searchParams.get("edit") === "true";

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

  // 기존 상태들
  const [generatedDiary] = useState(() =>
    postStorage.getGeneratedDiary(characterId)
  );
  const [editedDiary, setEditedDiary] = useState(
    () =>
      postStorage.getEditedDiary(characterId) ||
      postStorage.getGeneratedDiary(characterId)
  );

  // AI 생성 데이터 상태
  const [aiMood] = useState(() => postStorage.getAIMood(characterId));
  const [aiMoodConfidence] = useState(() =>
    postStorage.getAIMoodConfidence(characterId)
  );
  const [aiHashtags] = useState(() => postStorage.getAIHashtags(characterId));

  // 사용자 커스텀 데이터 상태
  const [customMood, setCustomMood] = useState(aiMood || "neutral");
  const [customHashtags, setCustomHashtags] = useState(() => {
    if (aiHashtags && aiHashtags.length > 0) {
      return [...aiHashtags].slice(0, 5);
    }
    return ["ai일기", selectedCharacter?.name || "ai"]
      .filter(Boolean)
      .slice(0, 5);
  });

  const [postSettings, setPostSettings] = useState(() =>
    postStorage.getPostSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newHashtag, setNewHashtag] = useState("");
  const [hashtagError, setHashtagError] = useState("");

  // 초기 로딩 체크
  useEffect(() => {
    if (followedCharacters.length === 0) {
      const timer = setTimeout(() => {
        if (followedCharacters.length === 0) {
          navigate("/post/new/ai");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (!selectedCharacter) {
      const timer = setTimeout(() => {
        if (!selectedCharacter) {
          navigate("/post/new/ai");
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    const diaryData = postStorage.getGeneratedDiary(characterId);
    if (!generatedDiary && !diaryData) {
      navigate(`/post/new/ai/${characterId}`);
      return;
    }

    setIsLoading(false);
  }, [
    followedCharacters,
    selectedCharacter,
    characterId,
    generatedDiary,
    navigate,
  ]);

  // 편집된 일기 저장
  useEffect(() => {
    if (editedDiary) {
      postStorage.saveEditedDiary(characterId, editedDiary);
    }
  }, [editedDiary, characterId]);

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

  // AI 해시태그로 리셋
  const handleResetToAI = () => {
    if (aiHashtags && aiHashtags.length > 0) {
      setCustomHashtags([...aiHashtags].slice(0, 5));
    } else {
      setCustomHashtags(
        ["ai일기", selectedCharacter?.name || "ai"].filter(Boolean).slice(0, 5)
      );
    }
    if (aiMood) {
      setCustomMood(aiMood);
    }
    setHashtagError("");
  };

  // Mood 변경
  const handleMoodChange = (mood) => {
    setCustomMood(mood);
  };

  // 일기 저장 - entry_date 추가
  const handleSaveDiary = async () => {
    const finalContent = editedDiary || generatedDiary;

    if (!finalContent.trim()) {
      alert("일기 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const messages = postStorage.getMessages(characterId);
      const postData = {
        content: finalContent,
        mood: customMood,
        hashtags: customHashtags,
        visibility: postSettings.visibility,
        allowAIComments: postSettings.allowAIComments,
        entry_date: selectedDate
          ? selectedDate.toISOString()
          : new Date().toISOString(), // 선택된 날짜 사용
        metadata: {
          ai_generated: true,
          character_id: selectedCharacter.id,
          conversation_count: messages.length,
          ai_mood: aiMood,
          ai_hashtags: aiHashtags,
          mood_confidence: aiMoodConfidence,
        },
      };

      await createPostMutation.mutateAsync(postData);

      // 성공시 모든 데이터 클리어
      postStorage.clearSelectedDate(); // 선택된 날짜 클리어
      postStorage.clearAll();

      navigate("/");
    } catch (error) {
      console.error("일기 저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 모드 전환
  const toggleEditMode = () => {
    if (isEditing) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ edit: "true" }, { replace: true });
    }
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    // 선택된 날짜가 있으면 클리어
    if (selectedDate) {
      postStorage.clearSelectedDate();
    }
    navigate(-1);
  };

  if (isLoading || !selectedCharacter || !generatedDiary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

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
              AI 일기 작성
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-stone-900 mb-2">
                AI가 작성한 일기
              </h2>
              <p className="text-sm text-stone-600">
                내용을 검토하고 필요하면 수정해주세요
              </p>
            </div>

            {/* 선택된 날짜 표시 */}
            {selectedDate && (
              <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 font-medium">
                      {userLanguage === "Korean" ? "작성 날짜" : "Entry Date"}
                    </p>
                    <p className="text-sm text-stone-900 font-semibold">
                      {formatSelectedDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 일기 컨테이너 */}
            <div className="relative mb-6">
              {!isEditing ? (
                <button
                  onClick={toggleEditMode}
                  className="absolute -top-2 -right-2 z-10 p-2.5 bg-white text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-full shadow-sm border border-stone-200 transition-colors"
                  title="수정하기"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={toggleEditMode}
                  className="absolute -top-2 -right-2 z-10 p-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow-sm transition-colors"
                  title="수정 완료"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                {!isEditing ? (
                  <div className="prose prose-stone max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: editedDiary }} />
                  </div>
                ) : (
                  <CustomEditor
                    content={editedDiary}
                    onChange={setEditedDiary}
                  />
                )}
              </div>
            </div>

            {/* Mood 선택 - AI 추천 표시 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-stone-700">
                  오늘의 기분
                </label>
                {aiMood &&
                  (customMood === aiMood ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      <Bot className="w-3 h-3" />
                      AI 추천
                      {aiMoodConfidence > 0 && (
                        <span className="text-blue-400">
                          ({Math.round(aiMoodConfidence * 100)}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
                      <User className="w-3 h-3" />
                      사용자 선택
                    </span>
                  ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleMoodChange("happy")}
                  className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "happy"
                      ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😊</span>
                    <span className="text-xs font-medium">행복</span>
                    {aiMood === "happy" && (
                      <Bot className="absolute top-1 right-1 w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleMoodChange("neutral")}
                  className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "neutral"
                      ? "bg-stone-100 border-stone-400 text-stone-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😐</span>
                    <span className="text-xs font-medium">보통</span>
                    {aiMood === "neutral" && (
                      <Bot className="absolute top-1 right-1 w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleMoodChange("sad")}
                  className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                    customMood === "sad"
                      ? "bg-blue-50 border-blue-400 text-blue-700"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">😢</span>
                    <span className="text-xs font-medium">슬픔</span>
                    {aiMood === "sad" && (
                      <Bot className="absolute top-1 right-1 w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* 해시태그 관리 - AI 추천 표시 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-stone-700">
                  해시태그 ({customHashtags.length}/5)
                </label>
                {aiHashtags && aiHashtags.length > 0 && (
                  <button
                    onClick={handleResetToAI}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    AI 추천으로 리셋
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-4">
                {/* 해시태그 목록 */}
                {customHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customHashtags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                          aiHashtags?.includes(tag)
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                      >
                        {aiHashtags?.includes(tag) && (
                          <Bot className="w-3 h-3" />
                        )}
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
                    해시태그를 추가해주세요
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
                        placeholder="해시태그 추가 (최대 5개)"
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
                    최대 5개까지 추가 가능합니다
                  </p>
                )}
              </div>
            </div>

            {/* 게시물 설정 */}
            <div className="space-y-6 mb-8">
              {/* 공개 범위 설정 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  공개 범위
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
                      <span className="text-xs font-medium">나만 보기</span>
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
                      <span className="text-xs font-medium">모두 공개</span>
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
                        AI 댓글
                      </label>
                      <p className="text-xs text-stone-500 mt-0.5">
                        AI가 당신의 일기에 댓글을 남길 수 있어요
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
              disabled={isSaving}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default PostAIReview;
