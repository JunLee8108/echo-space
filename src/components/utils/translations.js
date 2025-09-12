// utils/translations.js

export const translations = {
  // ============= Common UI Elements =============
  "common.save": {
    English: "Save",
    Korean: "저장",
  },
  "common.cancel": {
    English: "Cancel",
    Korean: "취소",
  },
  "common.delete": {
    English: "Delete",
    Korean: "삭제",
  },
  "common.edit": {
    English: "Edit",
    Korean: "수정",
  },
  "common.confirm": {
    English: "Confirm",
    Korean: "확인",
  },
  "common.loading": {
    English: "Loading...",
    Korean: "로딩 중...",
  },
  "common.error": {
    English: "Error",
    Korean: "오류",
  },
  "common.remove": {
    English: "Remove",
    Korean: "제거",
  },

  // ============= Header =============
  // 로그아웃
  "header.signOut": {
    English: "Sign Out",
    Korean: "로그아웃",
  },

  // ============= CustomEditor =============
  // 버튼 텍스트
  "editor.button.date": {
    English: "Today",
    Korean: "오늘",
  },
  "editor.button.time": {
    English: "Time",
    Korean: "시간",
  },
  "editor.button.emoji": {
    English: "Emoji",
    Korean: "이모티콘",
  },
  "editor.button.image": {
    English: "Image",
    Korean: "이미지",
  },

  // 툴팁
  "editor.tooltip.bold": {
    English: "Bold (Ctrl+B)",
    Korean: "굵게 (Ctrl+B)",
  },
  "editor.tooltip.italic": {
    English: "Italic (Ctrl+I)",
    Korean: "기울임 (Ctrl+I)",
  },
  "editor.tooltip.underline": {
    English: "Underline (Ctrl+U)",
    Korean: "밑줄 (Ctrl+U)",
  },
  "editor.tooltip.alignLeft": {
    English: "Align Left",
    Korean: "왼쪽 정렬",
  },
  "editor.tooltip.alignCenter": {
    English: "Align Center",
    Korean: "가운데 정렬",
  },
  "editor.tooltip.alignRight": {
    English: "Align Right",
    Korean: "오른쪽 정렬",
  },
  "editor.tooltip.insertDate": {
    English: "Insert Today Date",
    Korean: "오늘 날짜 삽입",
  },
  "editor.tooltip.insertTime": {
    English: "Insert Current Time",
    Korean: "현재 시간 삽입",
  },
  "editor.tooltip.insertEmoji": {
    English: "Insert Emoji",
    Korean: "이모티콘 삽입",
  },
  "editor.tooltip.addImage": {
    English: "Add Image",
    Korean: "이미지 추가",
  },

  // 색상
  "editor.color.black": {
    English: "Black",
    Korean: "검정",
  },
  "editor.color.red": {
    English: "Red",
    Korean: "빨강",
  },
  "editor.color.blue": {
    English: "Blue",
    Korean: "파랑",
  },
  "editor.color.green": {
    English: "Green",
    Korean: "초록",
  },

  // Placeholder
  "editor.placeholder": {
    English: "Share your story...",
    Korean: "당신의 이야기를 공유해주세요...",
  },

  // 이모지 카테고리
  "editor.emoji.emotions": {
    English: "Emotions",
    Korean: "감정",
  },
  "editor.emoji.activities": {
    English: "Activities",
    Korean: "활동",
  },
  "editor.emoji.weather": {
    English: "Weather",
    Korean: "날씨",
  },
  "editor.emoji.symbols": {
    English: "Symbols",
    Korean: "기호",
  },

  // ============= Post Manual Write Page =============
  "postManual.title": {
    English: "Write Diary",
    Korean: "직접 작성",
  },

  // Mood Section
  "postManual.mood.title": {
    English: "Today's Mood",
    Korean: "오늘의 기분",
  },
  "postManual.mood.happy": {
    English: "Happy",
    Korean: "행복",
  },
  "postManual.mood.neutral": {
    English: "Neutral",
    Korean: "보통",
  },
  "postManual.mood.sad": {
    English: "Sad",
    Korean: "슬픔",
  },

  // Hashtag Section
  "postManual.hashtag.title": {
    English: "Hashtags (${count}/5)",
    Korean: "해시태그 (${count}/5)",
  },
  "postManual.hashtag.empty": {
    English: "Add hashtags to your post",
    Korean: "해시태그를 추가해주세요",
  },
  "postManual.hashtag.placeholder": {
    English: "Add hashtag (max 5)",
    Korean: "해시태그 추가 (최대 5개)",
  },
  "postManual.hashtag.maxReached": {
    English: "Maximum 5 hashtags allowed",
    Korean: "최대 5개까지 추가 가능합니다",
  },
  "postManual.hashtag.error.empty": {
    English: "Please enter a hashtag",
    Korean: "해시태그를 입력해주세요",
  },
  "postManual.hashtag.error.duplicate": {
    English: "This hashtag already exists",
    Korean: "이미 추가된 해시태그입니다",
  },

  // Visibility Section
  "postManual.visibility.title": {
    English: "Visibility",
    Korean: "공개 범위",
  },
  "postManual.visibility.private": {
    English: "Private",
    Korean: "나만 보기",
  },
  "postManual.visibility.public": {
    English: "Public",
    Korean: "모두 공개",
  },

  // AI Comments Section
  "postManual.aiComments.title": {
    English: "AI Comments",
    Korean: "AI 댓글",
  },
  "postManual.aiComments.description": {
    English: "AI can comment on your diary",
    Korean: "AI가 당신의 일기에 댓글을 남길 수 있어요",
  },

  // Save Section
  "postManual.save.button": {
    English: "Save",
    Korean: "저장하기",
  },
  "postManual.save.saving": {
    English: "Saving...",
    Korean: "저장 중...",
  },

  // Alert Messages
  "postManual.alert.emptyContent": {
    English: "Please write something in your diary.",
    Korean: "일기 내용을 입력해주세요.",
  },
  "postManual.alert.saveFailed": {
    English: "Failed to save. Please try again.",
    Korean: "저장에 실패했습니다.",
  },

  // ============= Post Method Choice Page =============
  "postMethod.title": {
    English: "New Diary",
    Korean: "새 일기 작성",
  },
  "postMethod.mainTitle": {
    English: "Record Your Day",
    Korean: "오늘 하루를 기록하기",
  },
  "postMethod.dateTitle": {
    English: "Write diary for ${date}",
    Korean: "${month}월 ${day}일 일기 작성하기",
  },
  "postMethod.subtitle": {
    English: "How would you like to write?",
    Korean: "어떤 방식으로 작성하시겠어요?",
  },
  "postMethod.aiOption.title": {
    English: "Write with AI Conversation",
    Korean: "AI와 대화하며 작성",
  },
  "postMethod.aiOption.description": {
    English: "Complete your diary with your AI friend",
    Korean: "AI 친구와 대화를 나누며 자연스럽게 일기를 완성해보세요",
  },
  "postMethod.manualOption.title": {
    English: "Write Directly",
    Korean: "직접 작성하기",
  },
  "postMethod.manualOption.description": {
    English: "Write your diary freely in your own style",
    Korean: "나만의 스타일로 자유롭게 일기를 작성해보세요",
  },
  "postMethod.startButton": {
    English: "Get Started",
    Korean: "시작하기",
  },

  // ============= Post AI General =============
  "postAI.title": {
    English: "AI Diary Writing",
    Korean: "AI 일기 작성",
  },

  // ============= Post AI Select Page =============
  "postAISelect.title": {
    English: "AI Select",
    Korean: "AI 선택",
  },
  "postAISelect.subtitle": {
    English: "Choose an AI friend to chat with",
    Korean: "대화할 AI 친구를 선택하세요",
  },
  "postAISelect.noFollowedAI": {
    English: "You haven't followed any AI characters yet",
    Korean: "아직 팔로우한 AI 캐릭터가 없습니다",
  },
  "postAISelect.findAICharacters": {
    English: "Find AI Characters",
    Korean: "AI 캐릭터 찾기",
  },

  // ============= Post AI Chat Page =============
  "postAIChat.title": {
    English: "AI Chat",
    Korean: "AI 대화",
  },

  "postAIChat.chatting": {
    English: "Chatting",
    Korean: "대화 중",
  },
  "postAIChat.messagePlaceholder": {
    English: "Type your message...",
    Korean: "메시지를 입력하세요...",
  },
  "postAIChat.limitReached": {
    English: "Conversation limit reached",
    Korean: "대화 제한에 도달했습니다",
  },

  // Hashtag Modal
  "post.hashtag.title": {
    English: "Add Hashtags",
    Korean: "해시태그 추가",
  },
  "post.hashtag.placeholder": {
    English: "Type hashtag...",
    Korean: "해시태그 입력...",
  },
  "post.hashtag.searching": {
    English: "Searching...",
    Korean: "검색 중...",
  },
  "post.hashtag.pressEnter": {
    English: 'Press Enter to add "#${hashtag}"',
    Korean: 'Enter를 눌러 "#${hashtag}" 추가',
  },

  // Visibility Modal
  "post.visibility.title": {
    English: "Visibility",
    Korean: "공개 설정",
  },
  "post.visibility.private": {
    English: "Private",
    Korean: "비공개",
  },
  "post.visibility.privateDesc": {
    English: "Only you can see",
    Korean: "나만 볼 수 있음",
  },
  "post.visibility.public": {
    English: "Public",
    Korean: "공개",
  },
  "post.visibility.publicDesc": {
    English: "Anyone can see",
    Korean: "모두가 볼 수 있음",
  },

  // AI Comments Modal
  "post.ai.title": {
    English: "AI Comments",
    Korean: "AI 댓글",
  },
  "post.ai.enable": {
    English: "Enable",
    Korean: "허용",
  },
  "post.ai.enableDesc": {
    English: "AI can comment",
    Korean: "AI가 댓글 작성",
  },
  "post.ai.disable": {
    English: "Disable",
    Korean: "금지",
  },
  "post.ai.disableDesc": {
    English: "No AI comments",
    Korean: "AI가 댓글 작성하지 않음",
  },

  // Character count
  "post.characterCount": {
    English: "${count} / 500",
    Korean: "${count} / 500",
  },

  // ============= Profile Page =============
  "profile.editProfile": {
    English: "Edit Profile",
    Korean: "프로필 편집",
  },
  "profile.general": {
    English: "General",
    Korean: "일반",
  },
  "profile.password": {
    English: "Password",
    Korean: "비밀번호",
  },
  "profile.displayName": {
    English: "Display Name",
    Korean: "표시 이름",
  },
  "profile.displayNameHint": {
    English: "Max lenght: ",
    Korean: "최대길이: ",
  },
  "profile.language": {
    English: "Language",
    Korean: "언어",
  },
  "profile.languageHint": {
    English: "AI characters will respond in this language",
    Korean: "AI 캐릭터가 이 언어로 응답합니다",
  },
  "profile.currentPassword": {
    English: "Current Password",
    Korean: "현재 비밀번호",
  },
  "profile.newPassword": {
    English: "New Password",
    Korean: "새 비밀번호",
  },
  "profile.confirmPassword": {
    English: "Confirm New Password",
    Korean: "새 비밀번호 확인",
  },
  "profile.enterName": {
    English: "Enter your name",
    Korean: "이름을 입력하세요",
  },
  "profile.enterCurrentPassword": {
    English: "Enter current password",
    Korean: "현재 비밀번호 입력",
  },
  "profile.enterNewPassword": {
    English: "Enter new password",
    Korean: "새 비밀번호 입력",
  },
  "profile.reenterNewPassword": {
    English: "Re-enter new password",
    Korean: "새 비밀번호 재입력",
  },
  "profile.aiCharacters": {
    English: "AI Characters",
    Korean: "AI 캐릭터",
  },
  "profile.managingUserInfo": {
    English: "Managing user information",
    Korean: "사용자 정보 관리",
  },
  "profile.proTip": {
    English: "Pro Tip",
    Korean: "중요한 팁",
  },
  "profile.proTipMessage": {
    English:
      "Different AI characters have unique personalities and will respond differently to your posts. Try following different combinations!",
    Korean:
      "각 AI 캐릭터는 개성과 성격이 모두 달라, 같은 게시글이라도 전혀 다른 반응과 답변을 보입니다. 다양한 캐릭터를 팔로우하면, 더 흥미롭고 다채로운 피드를 경험할 수 있습니다.",
  },
  "profile.followedOnlyHint": {
    English:
      "Only followed AI characters will comment on and like your posts. You can change this anytime.",
    Korean:
      "팔로우한 AI 캐릭터만 댓글과 좋아요를 남기며, 언제든 설정을 변경할 수 있습니다.",
  },
  "profile.following": {
    English: "Following",
    Korean: "팔로잉",
  },
  "profile.follow": {
    English: "Follow",
    Korean: "팔로우",
  },
  "profile.unfollow": {
    English: "Unfollow",
    Korean: "팔로우 취소",
  },
  "profile.followAll": {
    English: "Follow all",
    Korean: "전체 팔로우",
  },
  "profile.unfollowAll": {
    English: "Unfollow all",
    Korean: "전체 팔로우 취소",
  },
  "profile.quickActions": {
    English: "Quick Actions",
    Korean: "빠른 작업",
  },
  "profile.manageCompanions": {
    English: "Manage all companions at once",
    Korean: "모든 캐릭터를 한 번에 관리하기",
  },
  "profile.interactionStats": {
    English: "Interaction Stats",
    Korean: "상호작용 현황",
  },
  "profile.active": {
    English: "Active",
    Korean: "활성",
  },
  "profile.inactive": {
    English: "Inactive",
    Korean: "비활성",
  },
  "profile.showMore": {
    English: "Show ${count} more",
    Korean: "${count}개 더 보기",
  },
  "profile.showLess": {
    English: "Show less",
    Korean: "접기",
  },
  "profile.showingCount": {
    English: "Showing ${shown} of ${total}",
    Korean: "전체 ${total}개 중 ${shown}개 표시 중",
  },

  // ============= Profile Modal - Affinity Guide =============
  "profile.affinity.modalTitle": {
    English: "How to Increase Affinity",
    Korean: "친밀도를 높이는 방법",
  },
  "profile.affinity.method1Title": {
    English: "Comment on your posts",
    Korean: "게시글에 댓글 달기",
  },
  "profile.affinity.method1Desc": {
    English:
      "When the character replies to your posts, there's a random chance to gain affinity points",
    Korean: "캐릭터가 내 게시글에 댓글을 달면 일정 확률로 친밀도가 상승합니다",
  },
  "profile.affinity.method2Title": {
    English: "Like their comments",
    Korean: "댓글에 좋아요 누르기",
  },
  "profile.affinity.method2Desc": {
    English:
      "Liking the character's comments has a random chance to increase your affinity level",
    Korean: "캐릭터의 댓글에 좋아요를 누르면 일정 확률로 친밀도가 상승합니다",
  },
  "profile.affinity.level": {
    English: "Affinity Level",
    Korean: "친밀도 레벨",
  },
  "profile.affinity.points": {
    English: "Affinity Points",
    Korean: "친밀도 포인트",
  },

  // ============= Home Page =============
  "home.startConversation": {
    English: "Create your first post",
    Korean: "첫 게시글을 작성해보세요",
  },
  "home.shareFirstThought": {
    English: "What's on your mind?",
    Korean: "지금 어떤 생각을 하고 계신가요?",
  },
  "home.allCaughtUp": {
    English: "You're all caught up",
    Korean: "모두 확인했습니다",
  },
  "home.backToTop": {
    English: "Back to top",
    Korean: "맨 위로",
  },
  "home.justNow": {
    English: "Just now",
    Korean: "방금 전",
  },
  "home.minuteAgo": {
    English: " minute ago",
    Korean: "분 전",
  },
  "home.minutesAgo": {
    English: " minutes ago",
    Korean: "분 전",
  },
  "home.hourAgo": {
    English: " hour ago",
    Korean: "시간 전",
  },
  "home.hoursAgo": {
    English: " hours ago",
    Korean: "시간 전",
  },
  "home.edited": {
    English: "edited",
    Korean: "수정됨",
  },
  "home.like": {
    English: "Like",
    Korean: "좋아요",
  },
  "home.likes": {
    English: "Likes",
    Korean: "좋아요",
  },
  "home.aiThinking": {
    English: "AI friends are thinking...",
    Korean: "AI 친구들이 생각 중...",
  },

  // ============= Confirmation Messages =============
  "confirm.deletePost": {
    English: "Delete Post?",
    Korean: "게시글을 삭제하시겠습니까?",
  },
  "confirm.deletePostMessage": {
    English:
      'Are you sure you want to delete "${title}"? This action cannot be undone.',
    Korean: '"${title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  },
  "confirm.followAllTitle": {
    English: "Follow all?",
    Korean: "모두 팔로우하시겠습니까?",
  },
  "confirm.followAllMessage": {
    English: "This will follow ${count} AI characters.",
    Korean: "${count}명의 AI 캐릭터를 팔로우합니다.",
  },
  "confirm.unfollowAllTitle": {
    English: "Unfollow all?",
    Korean: "모두 팔로우 취소하시겠습니까?",
  },
  "confirm.unfollowAllMessage": {
    English: "This will unfollow ${count} AI characters. ",
    Korean: "${count}명의 AI 캐릭터를 팔로우 취소합니다. ",
  },
  "confirm.yes": {
    English: "Yes, Continue",
    Korean: "네, 계속하기",
  },

  // ============= Error Messages =============
  "error.fillAllFields": {
    English: "Please fill in all fields.",
    Korean: "모든 필드를 입력해주세요.",
  },
  "error.passwordLength": {
    English: "New password must be at least 6 characters.",
    Korean: "새 비밀번호는 최소 6자 이상이어야 합니다.",
  },
  "error.passwordMismatch": {
    English: "Passwords do not match.",
    Korean: "비밀번호가 일치하지 않습니다.",
  },
  "error.passwordSame": {
    English: "New password must be different from the current password.",
    Korean: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
  },
  "error.passwordIncorrect": {
    English: "Current password is incorrect.",
    Korean: "현재 비밀번호가 올바르지 않습니다.",
  },
  "error.updateFailed": {
    English: "Failed to update. Please try again.",
    Korean: "업데이트에 실패했습니다. 다시 시도해주세요.",
  },
  "error.hashtagSearch": {
    English: "Failed to search hashtags",
    Korean: "해시태그 검색 실패",
  },
  "error.postSave": {
    English: "Failed to save post",
    Korean: "포스트 저장 실패",
  },

  // ============= Success Messages =============
  "success.passwordChanged": {
    English: "Password changed successfully.",
    Korean: "비밀번호가 성공적으로 변경되었습니다.",
  },
  "success.profileUpdated": {
    English: "Profile updated successfully.",
    Korean: "프로필이 성공적으로 업데이트되었습니다.",
  },

  // ============= PWA Install Prompt =============
  "pwa.installTitle": {
    English: "DiaryFriend works better as an app",
    Korean: "DiaryFriend를 앱으로 사용해보세요",
  },
  "pwa.installBenefit": {
    English: "Faster access & works offline",
    Korean: "빠른 접근 • 오프라인 사용 가능",
  },
  "pwa.installButton": {
    English: "Install App",
    Korean: "앱 설치",
  },
  "pwa.installLater": {
    English: "Not now",
    Korean: "나중에",
  },
  "pwa.ios.instruction": {
    English: "Tap",
    Korean: "탭",
  },
  "pwa.ios.share": {
    English: "Share",
    Korean: "공유",
  },
  "pwa.ios.click": {
    English: "Click",
    Korean: "클릭",
  },
  "pwa.ios.addToHome": {
    English: '"Add to Home Screen"',
    Korean: '"홈 화면에 추가"',
  },
  "pwa.ios.add": {
    English: "Add",
    Korean: "추가",
  },
};

// 번역 헬퍼 함수
export const createTranslator = (language) => {
  return (key, variables = {}) => {
    let text =
      translations[key]?.[language] || translations[key]?.["English"] || key;

    // 변수 치환 (${variable} 형식)
    Object.keys(variables).forEach((varKey) => {
      text = text.replace(
        new RegExp(`\\$\\{${varKey}\\}`, "g"),
        variables[varKey]
      );
    });

    return text;
  };
};
