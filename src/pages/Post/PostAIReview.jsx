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
  Bot,
  BotOff,
  Loader2,
} from "lucide-react";
import { useFollowedCharacters } from "../../stores/characterStore";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { postStorage } from "../../components/utils/postStorage";
import CustomEditor from "./CustomEditor";

const PostAIReview = () => {
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const followedCharacters = useFollowedCharacters();
  const createPostMutation = useCreatePost();

  // 캐릭터 찾기 - ID 타입 체크 포함
  const selectedCharacter = followedCharacters.find(
    (c) =>
      c.id === characterId ||
      c.id === parseInt(characterId) ||
      c.id === String(characterId)
  );

  // 편집 모드 (URL query parameter로 관리)
  const isEditing = searchParams.get("edit") === "true";

  // 상태 관리 - sessionStorage에서 복원
  const [generatedDiary] = useState(() =>
    postStorage.getGeneratedDiary(characterId)
  );
  const [editedDiary, setEditedDiary] = useState(
    () =>
      postStorage.getEditedDiary(characterId) ||
      postStorage.getGeneratedDiary(characterId)
  );
  const [postSettings, setPostSettings] = useState(() =>
    postStorage.getPostSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 캐릭터나 일기가 없으면 대화 화면으로
  useEffect(() => {
    // followedCharacters가 아직 로딩중이면 기다림
    if (followedCharacters.length === 0) {
      // 잠시 대기 후 재확인
      const timer = setTimeout(() => {
        if (followedCharacters.length === 0) {
          navigate("/post/new/ai");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 캐릭터를 못 찾은 경우
    if (!selectedCharacter) {
      const timer = setTimeout(() => {
        if (!selectedCharacter) {
          navigate("/post/new/ai");
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // 일기 데이터가 없는 경우
    const diaryData = postStorage.getGeneratedDiary(characterId);
    if (!generatedDiary && !diaryData) {
      navigate(`/post/new/ai/${characterId}`);
      return;
    }

    // 모든 체크가 완료되면 로딩 종료
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

  // 감정 감지
  const detectMood = (content) => {
    const happyWords = ["행복", "기쁨", "즐거", "happy", "joy", "excited"];
    const sadWords = ["슬프", "우울", "힘들", "sad", "depressed", "hard"];

    const lowerContent = content.toLowerCase();

    if (happyWords.some((word) => lowerContent.includes(word))) return "happy";
    if (sadWords.some((word) => lowerContent.includes(word))) return "sad";
    return "neutral";
  };

  // 일기 저장
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
        mood: detectMood(finalContent),
        hashtags: [`AI일기`, selectedCharacter.name],
        visibility: postSettings.visibility,
        allowAIComments: postSettings.allowAIComments,
        metadata: {
          ai_generated: true,
          character_id: selectedCharacter.id,
          conversation_count: messages.length,
        },
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

  // 편집 모드 전환
  const toggleEditMode = () => {
    const newEditMode = !isEditing;
    setSearchParams({ edit: newEditMode.toString() });
  };

  // 로딩 중이거나 데이터가 없으면 로딩 스피너 표시
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
              onClick={() => navigate(`/post/new/ai/${characterId}`)}
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
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-6 overflow-y-auto h-full ">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-stone-900 mb-2">
                AI가 작성한 일기
              </h2>
              <p className="text-sm text-stone-600">
                내용을 검토하고 필요하면 수정해주세요
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
              {!isEditing ? (
                <div className="prose prose-stone max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: editedDiary }} />
                </div>
              ) : (
                <CustomEditor content={editedDiary} onChange={setEditedDiary} />
              )}
            </div>

            {/* 게시물 설정 */}
            <div className="mb-8">
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

            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={toggleEditMode}
                    className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    수정하기
                  </button>
                  <button
                    onClick={handleSaveDiary}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
                </>
              ) : (
                <>
                  <button
                    onClick={toggleEditMode}
                    className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveDiary}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAIReview;
