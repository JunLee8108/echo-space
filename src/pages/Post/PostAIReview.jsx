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
    if (isEditing) {
      setSearchParams({}, { replace: true }); // 파라미터 제거
    } else {
      setSearchParams({ edit: "true" }, { replace: true });
    }
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
              onClick={() => navigate(-1)}
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
        <div className="px-4 py-6 overflow-y-auto h-full">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-stone-900 mb-2">
                AI가 작성한 일기
              </h2>
              <p className="text-sm text-stone-600">
                내용을 검토하고 필요하면 수정해주세요
              </p>
            </div>

            {/* 일기 컨테이너 - 수정 버튼이 밖에 위치 */}
            <div className="relative mb-8">
              {/* 수정/완료 버튼 - 컨테이너 밖 우상단 */}
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

              {/* 일기 내용 - 전체 공간 활용 */}

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

            {/* 게시물 설정 - 기존 디자인 유지 */}
            <div className="space-y-6 mb-8">
              {/* 공개 범위 설정 - 카드형 디자인 */}
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
                      <span className="text-sm font-medium">나만 보기</span>
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
                      <span className="text-sm font-medium">모두 공개</span>
                    </div>
                    {postSettings.visibility === "public" && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* AI 댓글 설정 - 토글 스위치 디자인 */}
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

                  {/* 토글 스위치 */}
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

            {/* 저장 버튼 - 단독 배치, 자연스러운 색상 */}
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
