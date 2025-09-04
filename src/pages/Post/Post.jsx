// pages/Post/Post.jsx
import "./Post.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Bot,
  Send,
  Edit3,
  Check,
  ChevronRight,
  Sparkles,
  MessageCircle,
  BookOpen,
  Loader2,
  PenTool,
  Globe,
  Lock,
  BotOff,
} from "lucide-react";

import CustomEditor from "./CustomEditor";
import { useCreatePost } from "../../components/hooks/useCreatePost";
import { useUserLanguage } from "../../stores/userStore";

import { useFollowedCharacters } from "../../stores/characterStore";
import supabase from "../../services/supabaseClient";

const CONVERSATION_STEPS = {
  CHOOSE_METHOD: "choose_method",
  SELECT_AI: "select_ai",
  CHATTING: "chatting",
  REVIEW: "review",
  EDITING: "editing",
  MANUAL_WRITE: "manual_write",
};

const Post = () => {
  const navigate = useNavigate();

  const userLanguage = useUserLanguage();

  const followedCharacters = useFollowedCharacters();
  const createPostMutation = useCreatePost();

  // 상태 관리
  const [currentStep, setCurrentStep] = useState(
    CONVERSATION_STEPS.CHOOSE_METHOD
  );
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [generatedDiary, setGeneratedDiary] = useState("");
  const [editedDiary, setEditedDiary] = useState("");
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [hasSuggestedDiary, setHasSuggestedDiary] = useState(false);

  // 게시물 설정
  const [postSettings, setPostSettings] = useState({
    visibility: "private",
    allowAIComments: true,
  });

  // 직접 작성용 상태
  const [manualContent, setManualContent] = useState("");
  const [manualHashtags, setManualHashtags] = useState([]);
  const [manualMood, setManualMood] = useState(null);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAITyping]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    switch (currentStep) {
      case CONVERSATION_STEPS.CHOOSE_METHOD:
        navigate(-1);
        break;
      case CONVERSATION_STEPS.SELECT_AI:
        setCurrentStep(CONVERSATION_STEPS.CHOOSE_METHOD);
        break;
      case CONVERSATION_STEPS.CHATTING:
        setCurrentStep(CONVERSATION_STEPS.SELECT_AI);
        setMessages([]);
        setConversationCount(0);
        setHasSuggestedDiary(false);
        break;
      case CONVERSATION_STEPS.REVIEW:
      case CONVERSATION_STEPS.EDITING:
        setCurrentStep(CONVERSATION_STEPS.CHATTING);
        break;
      case CONVERSATION_STEPS.MANUAL_WRITE:
        setCurrentStep(CONVERSATION_STEPS.CHOOSE_METHOD);
        break;
      default:
        navigate(-1);
    }
  };

  // AI 선택
  const handleSelectCharacter = (character) => {
    window.scrollTo(0, 0);
    setSelectedCharacter(character);
    setCurrentStep(CONVERSATION_STEPS.CHATTING);

    // AI 인사말 추가
    const greeting = getAIGreeting(character);
    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        content: greeting,
        timestamp: new Date(),
      },
    ]);
  };

  // AI 인사말 생성
  const getAIGreeting = (character) => {
    const greetings = {
      Korean: [
        `안녕! 나는 ${character.name}이야. 오늘 하루는 어땠어?`,
        `${character.name}이야! 오늘 있었던 일들을 들려줄래?`,
        `반가워! ${character.name}이야. 오늘 기분은 어때?`,
      ],
      English: [
        `Hi! I'm ${character.name}. How was your day?`,
        `${character.name} here! Want to tell me about your day?`,
        `Nice to meet you! I'm ${character.name}. How are you feeling today?`,
      ],
    };

    const langGreetings = greetings[userLanguage] || greetings.English;
    return langGreetings[Math.floor(Math.random() * langGreetings.length)];
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAITyping) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsAITyping(true);
    setConversationCount((prev) => prev + 1);

    try {
      // AI 응답 받기
      const aiResponse = await getAIResponse(selectedCharacter, [
        ...messages,
        userMessage,
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          content: aiResponse,
          timestamp: new Date(),
        },
      ]);

      // 3번 이상 대화했고 아직 제안하지 않았으면 일기 생성 제안
      if (conversationCount >= 2 && !hasSuggestedDiary) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              sender: "system",
              content: "충분한 대화를 나눴네요! 일기를 작성해볼까요?",
              timestamp: new Date(),
              showDiaryButton: true,
            },
          ]);
          setHasSuggestedDiary(true);
        }, 1000);
      }
    } catch (error) {
      console.error("AI 응답 실패:", error);
    } finally {
      setIsAITyping(false);
    }
  };

  // AI 응답 받기
  const getAIResponse = async (character, conversation) => {
    const { data, error } = await supabase.functions.invoke("chat-with-ai", {
      body: {
        character: {
          name: character.name,
          personality: character.personality,
          prompt_description: character.prompt_description,
        },
        conversation: conversation.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        language: userLanguage,
      },
    });

    if (error) throw error;
    return data.response;
  };

  // 일기 생성
  const handleGenerateDiary = async () => {
    window.scrollTo(0, 0);
    setIsGeneratingDiary(true);
    setCurrentStep(CONVERSATION_STEPS.REVIEW);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-diary-from-chat",
        {
          body: {
            character: {
              name: selectedCharacter.name,
              personality: selectedCharacter.personality,
            },
            conversation: messages
              .filter((msg) => msg.sender !== "system")
              .map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.content,
              })),
            language: userLanguage,
          },
        }
      );

      if (error) throw error;
      setGeneratedDiary(data.diary);
      setEditedDiary(data.diary);
    } catch (error) {
      console.error("일기 생성 실패:", error);
      alert("일기 생성에 실패했습니다.");
      setCurrentStep(CONVERSATION_STEPS.CHATTING);
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  // 일기 저장
  const handleSaveDiary = async () => {
    const finalContent =
      currentStep === CONVERSATION_STEPS.MANUAL_WRITE
        ? manualContent
        : editedDiary || generatedDiary;

    if (!finalContent.trim()) {
      alert("일기 내용을 입력해주세요.");
      return;
    }

    try {
      const postData =
        currentStep === CONVERSATION_STEPS.MANUAL_WRITE
          ? {
              content: finalContent,
              mood: manualMood,
              hashtags: manualHashtags,
              visibility: postSettings.visibility,
              allowAIComments: postSettings.allowAIComments,
            }
          : {
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
      navigate("/");
    } catch (error) {
      console.error("일기 저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  // 감정 감지
  const detectMood = (content) => {
    const happyWords = ["행복", "기쁨", "즐거", "happy", "joy", "excited"];
    const sadWords = ["슬프", "우울", "힘들", "sad", "depressed", "hard"];

    const lowerContent = content.toLowerCase();

    if (happyWords.some((word) => lowerContent.includes(word))) return "happy";
    if (sadWords.some((word) => lowerContent.includes(word))) return "sad";
    return "neutral";
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
              {currentStep === CONVERSATION_STEPS.MANUAL_WRITE
                ? "직접 작성"
                : "AI 일기 작성"}
            </h1>
          </div>

          {/* Step Indicator - AI 모드일 때만 표시 */}
          {currentStep !== CONVERSATION_STEPS.CHOOSE_METHOD &&
            currentStep !== CONVERSATION_STEPS.MANUAL_WRITE && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentStep === CONVERSATION_STEPS.SELECT_AI
                      ? "bg-blue-500"
                      : "bg-stone-300"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentStep === CONVERSATION_STEPS.CHATTING
                      ? "bg-blue-500"
                      : "bg-stone-300"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentStep === CONVERSATION_STEPS.REVIEW ||
                    currentStep === CONVERSATION_STEPS.EDITING
                      ? "bg-blue-500"
                      : "bg-stone-300"
                  }`}
                />
              </div>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Step 0: 작성 방법 선택 */}
        {currentStep === CONVERSATION_STEPS.CHOOSE_METHOD && (
          <div className="px-4 py-8 overflow-y-auto h-full">
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
                  onClick={() => setCurrentStep(CONVERSATION_STEPS.SELECT_AI)}
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
                  onClick={() =>
                    setCurrentStep(CONVERSATION_STEPS.MANUAL_WRITE)
                  }
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
        )}

        {/* Step 1: AI 선택 */}
        {currentStep === CONVERSATION_STEPS.SELECT_AI && (
          <div className="px-4 py-6 overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Bot className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h2 className="text-md font-bold text-stone-900">
                  대화할 AI 친구를 선택하세요
                </h2>
              </div>

              <div className="grid gap-3">
                {followedCharacters.map((character) => (
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
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 대화 */}
        {currentStep === CONVERSATION_STEPS.CHATTING && (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-white border-b border-stone-100">
              <div className="flex items-center gap-3">
                {selectedCharacter?.avatar_url ? (
                  <img
                    src={selectedCharacter.avatar_url}
                    alt={selectedCharacter.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedCharacter?.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-stone-900">
                    {selectedCharacter?.name}
                  </h3>
                  <p className="text-xs text-green-600">● 대화 중</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="min-h-[20dvh] flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "system" ? (
                    <div className="max-w-sm mx-auto text-center mb-4 mt-4">
                      <p className="text-sm text-stone-600 mb-3">
                        {message.content}
                      </p>
                      {message.showDiaryButton && (
                        <button
                          onClick={handleGenerateDiary}
                          className="text-sm px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          일기 생성하기
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-stone-100 text-stone-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 px-4 py-2 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-stone-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 bg-stone-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAITyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isAITyping}
                  className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 일기 검토/편집 */}
        {(currentStep === CONVERSATION_STEPS.REVIEW ||
          currentStep === CONVERSATION_STEPS.EDITING) && (
          <div className="px-4 py-6 overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto">
              {isGeneratingDiary ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-stone-600">일기를 생성하고 있습니다...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-stone-900 mb-2">
                      AI가 작성한 일기
                    </h2>
                    <p className="text-sm text-stone-600">
                      내용을 검토하고 필요하면 수정해주세요
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
                    {currentStep === CONVERSATION_STEPS.REVIEW ? (
                      <div className="prose prose-stone max-w-none">
                        <div
                          dangerouslySetInnerHTML={{ __html: generatedDiary }}
                        />
                      </div>
                    ) : (
                      <CustomEditor
                        content={editedDiary}
                        onChange={setEditedDiary}
                      />
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
                              ? "bg-purple-50 text-purple-700"
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
                    {currentStep === CONVERSATION_STEPS.REVIEW ? (
                      <>
                        <button
                          onClick={() =>
                            setCurrentStep(CONVERSATION_STEPS.EDITING)
                          }
                          className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          수정하기
                        </button>
                        <button
                          onClick={handleSaveDiary}
                          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          저장하기
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setCurrentStep(CONVERSATION_STEPS.REVIEW)
                          }
                          className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveDiary}
                          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          저장하기
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 직접 작성 모드 */}
        {currentStep === CONVERSATION_STEPS.MANUAL_WRITE && (
          <div className="px-4 py-6 overflow-y-auto h-full">
            <div className="max-w-2xl mx-auto">
              <CustomEditor
                content={manualContent}
                onChange={setManualContent}
                onHashtagAdd={(tag) => {
                  if (!manualHashtags.includes(tag)) {
                    setManualHashtags([...manualHashtags, tag]);
                  }
                }}
              />

              {/* 게시물 설정 */}
              <div className="p-2 mt-6 mb-6">
                {/* Mood 선택 추가 */}
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
                          ? "bg-purple-50 text-purple-700"
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

              {/* 해시태그 표시 (있는 경우) */}
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
                disabled={!manualContent.trim()}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
