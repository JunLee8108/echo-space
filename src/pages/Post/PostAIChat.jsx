// pages/Post/PostAIChat.jsx
import "./Post.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Send, BookOpen, Loader2 } from "lucide-react";
import { useFollowedCharacters } from "../../stores/characterStore";
import { useUserLanguage } from "../../stores/userStore";
import { postStorage } from "../../components/utils/postStorage";
import supabase from "../../services/supabaseClient";

const PostAIChat = () => {
  const navigate = useNavigate();
  const { characterId } = useParams();

  const userLanguage = useUserLanguage();
  const followedCharacters = useFollowedCharacters();

  // 디버깅용 로그
  console.log("Character ID from URL:", characterId);
  console.log("Followed characters:", followedCharacters);

  // 캐릭터 찾기 - ID 타입 체크
  const selectedCharacter = followedCharacters.find(
    (c) =>
      c.id === characterId ||
      c.id === parseInt(characterId) ||
      c.id === String(characterId)
  );

  console.log("Selected character:", selectedCharacter);

  // 상태 관리 - sessionStorage에서 복원
  const [messages, setMessages] = useState(() =>
    postStorage.getMessages(characterId)
  );
  const [inputMessage, setInputMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [conversationCount, setConversationCount] = useState(() =>
    postStorage.getConversationCount(characterId)
  );
  const [hasSuggestedDiary, setHasSuggestedDiary] = useState(() =>
    postStorage.getSuggestedStatus(characterId)
  );
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // 캐릭터가 없으면 선택 화면으로
  useEffect(() => {
    if (!selectedCharacter) {
      navigate("/post/new/ai");
      return;
    }

    // 첫 진입시 인사말 추가
    if (messages.length === 0) {
      const greeting = getAIGreeting(selectedCharacter);
      const initialMessage = {
        id: Date.now(),
        sender: "ai",
        content: greeting,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      postStorage.saveMessages(characterId, [initialMessage]);
    }
  }, [selectedCharacter, characterId]);

  // 메시지 변경시 저장
  useEffect(() => {
    if (messages.length > 0) {
      postStorage.saveMessages(characterId, messages);
    }
  }, [messages, characterId]);

  // 대화 횟수 저장
  useEffect(() => {
    postStorage.saveConversationCount(characterId, conversationCount);
  }, [conversationCount, characterId]);

  // 일기 제안 상태 저장
  useEffect(() => {
    postStorage.saveSuggestedStatus(characterId, hasSuggestedDiary);
  }, [hasSuggestedDiary, characterId]);

  // 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAITyping]);

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

  // 일기 생성
  const handleGenerateDiary = async () => {
    setIsGeneratingDiary(true);

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

      // 생성된 일기 저장
      postStorage.saveGeneratedDiary(characterId, data.diary);
      postStorage.saveEditedDiary(characterId, data.diary);

      // 리뷰 페이지로 이동
      navigate(`/post/new/ai/${characterId}/review`);
    } catch (error) {
      console.error("일기 생성 실패:", error);
      alert("일기 생성에 실패했습니다.");
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  if (!selectedCharacter) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/post/new/ai")}
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
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-stone-300" />
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden flex flex-col ">
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
          className="min-h-[20dvh] overflow-y-auto px-4 py-4 space-y-4"
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
                      disabled={isGeneratingDiary}
                      className="text-sm px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingDiary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          일기 생성하기
                        </>
                      )}
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
    </div>
  );
};

export default PostAIChat;
