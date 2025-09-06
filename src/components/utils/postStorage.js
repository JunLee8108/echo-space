// utils/postStorage.js

const STORAGE_KEYS = {
  // 기존 keys
  CHAT_MESSAGES: "chat_messages_",
  CHAT_COUNT: "chat_count_",
  CHAT_SUGGESTED: "chat_suggested_",
  CHAT_DIARY_GENERATED: "chat_diary_generated_",
  DIARY_GENERATED: "diary_generated_",
  DIARY_EDITED: "diary_edited_",
  POST_SETTINGS: "post_settings",
  MANUAL_CONTENT: "manual_content",
  MANUAL_HASHTAGS: "manual_hashtags",
  MANUAL_MOOD: "manual_mood",

  // 새로 추가 - AI 생성 데이터
  AI_MOOD: "ai_generated_mood_",
  AI_HASHTAGS: "ai_generated_hashtags_",
  AI_MOOD_CONFIDENCE: "ai_mood_confidence_",
};

export const postStorage = {
  // 기존 대화 관련 메서드들
  saveMessages: (characterId, messages) => {
    try {
      sessionStorage.setItem(
        `${STORAGE_KEYS.CHAT_MESSAGES}${characterId}`,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  },

  getMessages: (characterId) => {
    try {
      const data = sessionStorage.getItem(
        `${STORAGE_KEYS.CHAT_MESSAGES}${characterId}`
      );
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get messages:", error);
      return [];
    }
  },

  saveConversationCount: (characterId, count) => {
    sessionStorage.setItem(
      `${STORAGE_KEYS.CHAT_COUNT}${characterId}`,
      count.toString()
    );
  },

  getConversationCount: (characterId) => {
    const count = sessionStorage.getItem(
      `${STORAGE_KEYS.CHAT_COUNT}${characterId}`
    );
    return count ? parseInt(count) : 0;
  },

  saveSuggestedStatus: (characterId, suggested) => {
    sessionStorage.setItem(
      `${STORAGE_KEYS.CHAT_SUGGESTED}${characterId}`,
      suggested.toString()
    );
  },

  getSuggestedStatus: (characterId) => {
    return (
      sessionStorage.getItem(`${STORAGE_KEYS.CHAT_SUGGESTED}${characterId}`) ===
      "true"
    );
  },

  saveDiaryGeneratedStatus: (characterId, generated) => {
    sessionStorage.setItem(
      `${STORAGE_KEYS.CHAT_DIARY_GENERATED}${characterId}`,
      generated.toString()
    );
  },

  getDiaryGeneratedStatus: (characterId) => {
    return (
      sessionStorage.getItem(
        `${STORAGE_KEYS.CHAT_DIARY_GENERATED}${characterId}`
      ) === "true"
    );
  },

  // 기존 일기 관련 메서드들
  saveGeneratedDiary: (characterId, diary) => {
    sessionStorage.setItem(
      `${STORAGE_KEYS.DIARY_GENERATED}${characterId}`,
      diary
    );
  },

  getGeneratedDiary: (characterId) => {
    return (
      sessionStorage.getItem(`${STORAGE_KEYS.DIARY_GENERATED}${characterId}`) ||
      ""
    );
  },

  saveEditedDiary: (characterId, diary) => {
    sessionStorage.setItem(`${STORAGE_KEYS.DIARY_EDITED}${characterId}`, diary);
  },

  getEditedDiary: (characterId) => {
    return (
      sessionStorage.getItem(`${STORAGE_KEYS.DIARY_EDITED}${characterId}`) || ""
    );
  },

  // AI 생성 Mood 관련 메서드 (새로 추가)
  saveAIMood: (characterId, mood) => {
    if (!mood) return;
    sessionStorage.setItem(`${STORAGE_KEYS.AI_MOOD}${characterId}`, mood);
  },

  getAIMood: (characterId) => {
    return (
      sessionStorage.getItem(`${STORAGE_KEYS.AI_MOOD}${characterId}`) || null
    );
  },

  // AI Mood 신뢰도 저장 (새로 추가)
  saveAIMoodConfidence: (characterId, confidence) => {
    sessionStorage.setItem(
      `${STORAGE_KEYS.AI_MOOD_CONFIDENCE}${characterId}`,
      confidence.toString()
    );
  },

  getAIMoodConfidence: (characterId) => {
    const confidence = sessionStorage.getItem(
      `${STORAGE_KEYS.AI_MOOD_CONFIDENCE}${characterId}`
    );
    return confidence ? parseFloat(confidence) : 0;
  },

  // AI 생성 Hashtags 관련 메서드 (새로 추가)
  saveAIHashtags: (characterId, hashtags) => {
    if (!hashtags || !Array.isArray(hashtags)) return;
    sessionStorage.setItem(
      `${STORAGE_KEYS.AI_HASHTAGS}${characterId}`,
      JSON.stringify(hashtags)
    );
  },

  getAIHashtags: (characterId) => {
    try {
      const data = sessionStorage.getItem(
        `${STORAGE_KEYS.AI_HASHTAGS}${characterId}`
      );
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get AI hashtags:", error);
      return [];
    }
  },

  // 게시물 설정
  savePostSettings: (settings) => {
    sessionStorage.setItem(
      STORAGE_KEYS.POST_SETTINGS,
      JSON.stringify(settings)
    );
  },

  getPostSettings: () => {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.POST_SETTINGS);
      return data
        ? JSON.parse(data)
        : { visibility: "private", allowAIComments: true };
    } catch {
      return { visibility: "private", allowAIComments: true };
    }
  },

  // 수동 작성 관련
  saveManualContent: (content) => {
    sessionStorage.setItem(STORAGE_KEYS.MANUAL_CONTENT, content);
  },

  getManualContent: () => {
    return sessionStorage.getItem(STORAGE_KEYS.MANUAL_CONTENT) || "";
  },

  saveManualHashtags: (hashtags) => {
    sessionStorage.setItem(
      STORAGE_KEYS.MANUAL_HASHTAGS,
      JSON.stringify(hashtags)
    );
  },

  getManualHashtags: () => {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.MANUAL_HASHTAGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveManualMood: (mood) => {
    sessionStorage.setItem(STORAGE_KEYS.MANUAL_MOOD, mood || "");
  },

  getManualMood: () => {
    return sessionStorage.getItem(STORAGE_KEYS.MANUAL_MOOD) || null;
  },

  // 특정 캐릭터의 데이터만 클리어 (수정)
  clearCharacterData: (characterId) => {
    sessionStorage.removeItem(`${STORAGE_KEYS.CHAT_MESSAGES}${characterId}`);
    sessionStorage.removeItem(`${STORAGE_KEYS.CHAT_COUNT}${characterId}`);
    sessionStorage.removeItem(`${STORAGE_KEYS.CHAT_SUGGESTED}${characterId}`);
    sessionStorage.removeItem(
      `${STORAGE_KEYS.CHAT_DIARY_GENERATED}${characterId}`
    );
    sessionStorage.removeItem(`${STORAGE_KEYS.DIARY_GENERATED}${characterId}`);
    sessionStorage.removeItem(`${STORAGE_KEYS.DIARY_EDITED}${characterId}`);
    // AI 생성 데이터도 클리어
    sessionStorage.removeItem(`${STORAGE_KEYS.AI_MOOD}${characterId}`);
    sessionStorage.removeItem(`${STORAGE_KEYS.AI_HASHTAGS}${characterId}`);
    sessionStorage.removeItem(
      `${STORAGE_KEYS.AI_MOOD_CONFIDENCE}${characterId}`
    );
  },

  // 모든 post 관련 데이터 클리어 (수정)
  clearAll: () => {
    Object.keys(sessionStorage).forEach((key) => {
      if (
        key.startsWith("chat_") ||
        key.startsWith("diary_") ||
        key.startsWith("ai_generated_") ||
        key.startsWith("ai_mood_confidence_") ||
        key === STORAGE_KEYS.POST_SETTINGS ||
        key === STORAGE_KEYS.MANUAL_CONTENT ||
        key === STORAGE_KEYS.MANUAL_HASHTAGS ||
        key === STORAGE_KEYS.MANUAL_MOOD
      ) {
        sessionStorage.removeItem(key);
      }
    });
  },
};
