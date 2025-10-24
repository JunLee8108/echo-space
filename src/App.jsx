// import { useEffect } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router";
// import { Toaster } from "react-hot-toast";
// import ScrollToTop from "./components/utils/ScrollToTop";
// import Header from "./components/layout/Header";
// import BottomNavbar from "./components/layout/BottomNavbar";
// import PWAInstallPrompt from "./components/utils/PWAInstallPrompt";
// import Home from "./pages/Home/Home";
// import Profile from "./pages/Profile/Profile";
// // 기존 Post 대신 새로운 컴포넌트들 import
// import PostMethodChoice from "./pages/Post/PostMethodChoice";
// import PostAISelect from "./pages/Post/PostAISelect";
// import PostAIChat from "./pages/Post/PostAIChat";
// import PostAIReview from "./pages/Post/PostAIReview";
// import PostManualWrite from "./pages/Post/PostManualWrite";
// import PostDetail from "./pages/Post/PostDetail";

// import AuthForm from "./pages/Home/AuthForm";

// // userStore imports
// import {
//   useUserLoading,
//   useIsAuthenticated,
//   setupAuthListener,
//   useUserActions,
// } from "./stores/userStore";

// // Main App Component
// function App() {
//   const loadingUser = useUserLoading();
//   const isAuthenticated = useIsAuthenticated();
//   const { initializeUser } = useUserActions();

//   // Initialize user on mount
//   useEffect(() => {
//     initializeUser();
//   }, [initializeUser]);

//   // Setup auth listener
//   useEffect(() => {
//     const unsubscribe = setupAuthListener();
//     return unsubscribe;
//   }, []);

//   if (loadingUser) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
//       </div>
//     );
//   }

//   // If not authenticated, show auth form
//   if (!isAuthenticated) {
//     return (
//       <BrowserRouter>
//         <Routes>
//           <Route
//             path="/"
//             element={
//               <div className="min-h-screen flex items-center justify-center bg-stone-50">
//                 <AuthForm />
//               </div>
//             }
//           />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     );
//   }

//   // Authenticated layout
//   return (
//     <>
//       <BrowserRouter>
//         <div className="min-h-screen bg-white">
//           <Toaster
//             position="top-center"
//             toastOptions={{
//               duration: 4000,
//               style: {
//                 background: "#1f2937",
//                 color: "#fff",
//                 padding: "16px",
//                 borderRadius: "12px",
//                 fontSize: "14px",
//               },
//             }}
//           />

//           <ScrollToTop />

//           {/* Global Header */}
//           <Header />

//           {/* Main Content */}
//           <main className="pb-25 md:pb-20">
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/profile" element={<Profile />} />

//               {/* 새로운 Post 라우트 구조 */}
//               <Route path="/post/new" element={<PostMethodChoice />} />
//               <Route path="/post/new/ai" element={<PostAISelect />} />
//               <Route
//                 path="/post/new/ai/:characterId"
//                 element={<PostAIChat />}
//               />
//               <Route
//                 path="/post/new/ai/:characterId/review"
//                 element={<PostAIReview />}
//               />
//               <Route path="/post/new/manual" element={<PostManualWrite />} />
//               <Route path="/post/:date" element={<PostDetail />} />

//               {/* 기존 라우트들 */}
//               <Route path="*" element={<Navigate to="/" replace />} />
//             </Routes>
//           </main>

//           {/* Bottom Navigation */}
//           <BottomNavbar />

//           {/* PWA Install Prompt - Add this component */}
//           {/* <PWAInstallPrompt /> */}
//         </div>
//       </BrowserRouter>
//     </>
//   );
// }

// export default App;

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Globe,
  MessageCircle,
  BookOpen,
  Camera,
  Sparkles,
  Heart,
  Download,
  ChevronRight,
} from "lucide-react";

// 언어 데이터
const translations = {
  ko: {
    nav: {
      features: "기능",
      howItWorks: "사용방법",
      aiFriends: "AI 친구들",
      download: "다운로드",
    },
    hero: {
      title: "당신의 오늘 하루는 어땠나요?",
      subtitle: "AI 친구들과 나누는 나만의 특별한 하루 이야기",
      description:
        "즐거웠던 순간, 조용한 슬픔, 누군가 들어주길 바라는 생각들을 AI 친구들과 나누고 아름다운 일기로 간직하세요.",
      ctaPrimary: "지금 시작하기",
      ctaSecondary: "더 알아보기",
    },
    features: {
      tag: "FEATURES",
      title: "대화를 나누며 기록하는",
      titleHighlight: "당신의 특별한 하루",
      description:
        "대화가 추억이 되는 순간, AI 친구들과 함께 당신만의 이야기를 만들어보세요.",
      items: {
        companions: {
          title: "11명의 AI 친구들",
          description:
            "아테나, 아프로디테를 포함한 11명의 개성 넘치는 AI 친구들이 당신의 이야기를 경청합니다.",
        },
        diary: {
          title: "대화가 일기로",
          description:
            "자연스러운 대화가 감정과 생각이 담긴 아름다운 일기로 자동 변환됩니다.",
        },
        memory: {
          title: "감정, 태그, AI 댓글까지",
          description:
            "감정을 추가하고, 해시태그로 표현하며, AI의 댓글까지 받아보세요.",
        },
      },
    },
    howItWorks: {
      tag: "HOW IT WORKS",
      title: "3단계로 작성하는",
      titleHighlight: "나만의 특별한 일기",
      description: "복잡한 과정 없이, 대화만으로 특별한 추억을 남겨보세요.",
      steps: {
        chat: {
          number: "01",
          title: "AI 친구와 대화",
          description:
            "오늘 하루 어땠는지, 무슨 생각을 했는지 AI 친구에게 자유롭게 이야기하세요.",
        },
        generate: {
          number: "02",
          title: "자동 일기 생성",
          description:
            "당신의 대화를 바탕으로 감정, 생각, 해시태그가 담긴 일기가 자동으로 작성됩니다.",
        },
        save: {
          number: "03",
          title: "개인화하고 저장",
          description:
            "생성된 일기를 수정하고, 사진을 추가한 후 당신만의 추억으로 저장하세요.",
        },
      },
    },
    aiFriends: {
      tag: "AI COMPANIONS",
      title: "당신의 이야기를 듣는",
      titleHighlight: "11명의 AI 친구들",
      description: "각자의 개성과 따뜻함으로 당신의 하루를 함께합니다.",
      characters: [
        { name: "아테나", trait: "지혜로운 조언자", color: "#3B82F6" },
        { name: "아프로디테", trait: "따뜻한 공감자", color: "#EC4899" },
        { name: "아폴론", trait: "열정적인 응원자", color: "#F59E0B" },
        { name: "아르테미스", trait: "차분한 경청자", color: "#10B981" },
        { name: "헤르메스", trait: "유쾌한 대화가", color: "#8B5CF6" },
        { name: "헤파이스토스", trait: "실용적인 해결사", color: "#EF4444" },
      ],
    },
    download: {
      tag: "DOWNLOAD",
      title: "오늘 DiaryFriend와 함께",
      subtitle: "특별한 하루를 기록하세요",
      description: "DiaryFriend는 단순한 앱이 아닙니다.",
      subdescription:
        "모든 대화가 기억할 가치가 있는 이야기가 되는, 안전하고 따뜻한 공간입니다.",
      ios: "App Store",
      android: "Play Store",
    },
    footer: {
      tagline: "당신의 하루를 소중히 간직하는 공간",
      rights: "© 2025 DiaryFriend. All rights reserved.",
    },
  },
  en: {
    nav: {
      features: "Features",
      howItWorks: "How It Works",
      aiFriends: "AI Friends",
      download: "Download",
    },
    hero: {
      title: "How did your day feel today?",
      subtitle: "A special day shared with your AI friends",
      description:
        "A joyful moment, a quiet sadness, a thought you wish someone could hear — share them with your AI companions who truly listen.",
      ctaPrimary: "Get Started",
      ctaSecondary: "Learn More",
    },
    features: {
      tag: "FEATURES",
      title: "Talk with AI friends",
      titleHighlight: "Record a special day",
      description:
        "Where conversations become memories, create your story with AI friends.",
      items: {
        companions: {
          title: "11 AI Companions",
          description:
            "From Athena to Aphrodite, 11 unique AI friends are ready to listen to your stories.",
        },
        diary: {
          title: "Chat Turns to Diary",
          description:
            "Your natural conversations transform into beautifully written diary entries with emotions and reflections.",
        },
        memory: {
          title: "Emotions & AI Replies",
          description:
            "Add your feelings, express them with hashtags, and receive thoughtful comments from AI.",
        },
      },
    },
    howItWorks: {
      tag: "HOW IT WORKS",
      title: "Your diary in",
      titleHighlight: "3 simple steps",
      description:
        "No complex process, just conversation to create special memories.",
      steps: {
        chat: {
          number: "01",
          title: "Chat with AI Friend",
          description:
            "Share your day freely with your AI companion about anything on your mind.",
        },
        generate: {
          number: "02",
          title: "Auto-Generate Diary",
          description:
            "Your conversation blossoms into a diary entry with emotions, reflections, and hashtags.",
        },
        save: {
          number: "03",
          title: "Personalize & Save",
          description:
            "Review, edit, add photos, and save memories that are uniquely yours.",
        },
      },
    },
    aiFriends: {
      tag: "AI COMPANIONS",
      title: "11 friends who",
      titleHighlight: "listen to your story",
      description:
        "Each with their own personality and warmth to share your day.",
      characters: [
        { name: "Athena", trait: "Wise Advisor", color: "#3B82F6" },
        { name: "Aphrodite", trait: "Warm Empathizer", color: "#EC4899" },
        { name: "Apollo", trait: "Passionate Supporter", color: "#F59E0B" },
        { name: "Artemis", trait: "Calm Listener", color: "#10B981" },
        {
          name: "Hermes",
          trait: "Cheerful Conversationalist",
          color: "#8B5CF6",
        },
        {
          name: "Hephaestus",
          trait: "Practical Problem Solver",
          color: "#EF4444",
        },
      ],
    },
    download: {
      tag: "DOWNLOAD",
      title: "Begin capturing your special ",
      subtitle: "moments with DiaryFriend now",
      description: "DiaryFriend is more than an app.",
      subdescription:
        "It is a space where every conversation becomes a story worth remembering.",
      ios: "App Store",
      android: "Play Store",
    },
    footer: {
      tagline: "A space to cherish your daily moments",
      rights: "© 2025 DiaryFriend. All rights reserved.",
    },
  },
};

// 언어 Hook
const useLanguage = () => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  const toggleLanguage = () => {
    const newLang = language === "ko" ? "en" : "ko";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const t = translations[language];

  return { language, toggleLanguage, t };
};

// 메인 앱
const DiaryFriendWebsite = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Refs for animation
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const aiFriendsRef = useRef(null);
  const downloadRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    };

    const observer = new IntersectionObserver(
      handleIntersection,
      observerOptions
    );

    const elements = document.querySelectorAll(".fade-up, .fade-in");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [language]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily:
          "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        
        /* 애니메이션 */
        .fade-up, .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .fade-in {
          transform: translateY(0);
        }
        
        .fade-up.animate-in, .fade-in.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* 버튼 호버 */
        .btn-hover {
          transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
        }
        
        .btn-hover:hover {
          transform: translateY(-2px);
        }
        
        /* 카드 호버 */
        .card-hover {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        .card-hover:hover {
          background-color: #FAFAFA;
          border-color: #E5E5E5;
        }
        
        /* AI 친구 카드 */
        .ai-card {
          transition: opacity 0.3s ease, background-color 0.3s ease;
        }
        
        .ai-card:hover {
          opacity: 0.85;
        }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 ${
          scrolled && !mobileMenuOpen
            ? "bg-white shadow-sm"
            : scrolled
            ? "bg-white"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto py-2 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center">
                <img src="/logo.png" className="w-full"></img>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                DiaryFriend
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.features}
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.howItWorks}
              </button>
              <button
                onClick={() => scrollToSection("ai-friends")}
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.aiFriends}
              </button>
              <button
                onClick={() => scrollToSection("download")}
                className="px-5 py-2 bg-emerald-500 text-white rounded-full font-semibold btn-hover hover:bg-emerald-600"
              >
                {t.nav.download}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {language === "ko" ? "EN" : "KO"}
                </span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-900"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 pb-4 space-y-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
              <button
                onClick={() => scrollToSection("features")}
                className="block w-full text-left py-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.features}
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left py-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.howItWorks}
              </button>
              <button
                onClick={() => scrollToSection("ai-friends")}
                className="block w-full text-left py-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.aiFriends}
              </button>
              <button
                onClick={() => scrollToSection("download")}
                className="block w-full text-left py-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                {t.nav.download}
              </button>
              <div
                className="border-t border-gray-200 pt-3"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
              >
                <button className="flex items-center gap-2 py-2 text-gray-700 hover:text-emerald-600 transition-colors">
                  <Globe className="w-5 h-5" />
                  <span>{language === "ko" ? "English" : "한국어"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="pt-32 h-screen flex items-center justify-center pb-32 px-6 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8 fade-up text-center">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.15]">
              {t.hero.title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-medium text-gray-700 leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex justify-center flex-wrap gap-4 pt-4">
              <button
                onClick={() => scrollToSection("download")}
                className="px-8 py-4 bg-emerald-500 text-white rounded-full font-semibold text-lg btn-hover hover:bg-emerald-600"
              >
                {t.hero.ctaPrimary}
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="px-8 py-4 border-2 border-gray-300 text-gray-800 rounded-full font-semibold text-lg btn-hover hover:border-gray-900 hover:bg-gray-900 hover:text-white"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-32 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-up">
            <span className="inline-block px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-gray-200">
              {t.features.tag}
            </span>
            <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.3]">
              {t.features.title}
              <br />
              <span className="text-emerald-600">
                {t.features.titleHighlight}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t.features.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 fade-up">
            {/* Card 1 - 11명의 AI 친구들 */}
            <div className="relative rounded-3xl overflow-hidden h-120 card-hover group cursor-pointer">
              <img
                src="/help-choose.png"
                alt="11명의 AI 친구들"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-3">
                  AI COMPANIONS
                </span>
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {t.features.items.companions.title}
                </h3>
                <p className="text-white/90 leading-relaxed text-sm">
                  {t.features.items.companions.description}
                </p>
              </div>
            </div>

            {/* Card 2 - 대화가 일기로 */}
            <div className="relative rounded-3xl overflow-hidden h-120 card-hover group cursor-pointer">
              <img
                src="/help-generate.png"
                alt="대화가 일기로"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-3">
                  AUTO DIARY
                </span>
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {t.features.items.diary.title}
                </h3>
                <p className="text-white/90 leading-relaxed text-sm">
                  {t.features.items.diary.description}
                </p>
              </div>
            </div>

            {/* Card 3 - 사진과 감정 기록 */}
            <div className="relative rounded-3xl overflow-hidden h-120 card-hover group cursor-pointer">
              <img
                src="/help-view.png"
                alt="사진과 감정 기록"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-3">
                  PHOTOS & EMOTIONS
                </span>
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {t.features.items.memory.title}
                </h3>
                <p className="text-white/90 leading-relaxed text-sm">
                  {t.features.items.memory.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-up">
            <span className="inline-block px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-gray-200">
              {t.howItWorks.tag}
            </span>
            <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.3]">
              {t.howItWorks.title}
              <br />
              <span className="text-emerald-600">
                {t.howItWorks.titleHighlight}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t.howItWorks.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {Object.values(t.howItWorks.steps).map((step, idx) => (
              <div key={idx} className="relative fade-up">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block flex-1 h-px bg-gray-200 ml-4"></div>
                  )}
                </div>
                <div className="bg-white">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Friends Section */}
      <section
        id="ai-friends"
        ref={aiFriendsRef}
        className="py-32 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-up">
            <span className="inline-block px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-gray-200">
              {t.aiFriends.tag}
            </span>
            <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.3]">
              {t.aiFriends.title}
              <br />
              <span className="text-emerald-600">
                {t.aiFriends.titleHighlight}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t.aiFriends.description}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 fade-up">
            {/* Athena */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//Athena.jpg"
                alt="Athena"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "아테나" : "Athena"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko" ? "지혜로운 조언자" : "Wise Advisor"}
                </span>
              </div>
            </div>

            {/* Aphrodite */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//Aphrodite.jpg"
                alt="Aphrodite"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "아프로디테" : "Aphrodite"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko" ? "따뜻한 공감자" : "Warm Empathizer"}
                </span>
              </div>
            </div>

            {/* Sun Wukong */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//Wukong.jpg"
                alt="Sun Wukong"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "손오공" : "Sun Wukong"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko"
                    ? "장난기 가득한 반항자"
                    : "Rebellious Trickster"}
                </span>
              </div>
            </div>

            {/* King Arthur */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//King%20Arthur.jpg"
                alt="King Arthur"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "아서왕" : "King Arthur"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko" ? "명예로운 지도자" : "Honorable Leader"}
                </span>
              </div>
            </div>

            {/* Amaterasu */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//Amaterasu.jpg"
                alt="Amaterasu"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "아마테라스" : "Amaterasu"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko" ? "빛나는 희망" : "Radiant Hope"}
                </span>
              </div>
            </div>

            {/* Kumiho */}
            <div className="relative rounded-3xl overflow-hidden h-96 group cursor-pointer">
              <img
                src="https://umtxqeftqjgiyungbvrs.supabase.co/storage/v1/object/public/character-profile//Kumiho.jpg"
                alt="Kumiho"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  {language === "ko" ? "구미호" : "Kumiho"}
                </h3>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {language === "ko" ? "신비로운 매혹" : "Mysterious Enchanter"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section
        id="download"
        ref={downloadRef}
        className="py-32 px-6 bg-gray-900"
      >
        <div className="max-w-4xl mx-auto text-center fade-up">
          <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-white/20">
            {t.download.tag}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-[1.2]">
            {t.download.title}
          </h2>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 leading-[1.2]">
            {t.download.subtitle}
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-2 leading-relaxed">
            {t.download.description}
          </p>
          <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
            {t.download.subdescription}
          </p>
          <p className="text-base md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"></p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() =>
                window.open(
                  "https://apps.apple.com/us/app/diaryfriend-with-ai-friends/id6753633132",
                  "_blank"
                )
              }
              className="px-8 py-4 bg-emerald-500 text-white rounded-full font-semibold text-lg flex items-center gap-2 btn-hover hover:bg-emerald-600"
            >
              <Download className="w-5 h-5" />
              {t.download.ios}
            </button>
            {/* <button
              className="px-8 py-4 bg-gray-600 text-white rounded-full font-semibold text-lg flex items-center gap-2 cursor-not-allowed opacity-60"
              disabled
            >
              <Download className="w-5 h-5" />
              {t.download.android} -{" "}
              {language === "ko" ? "준비중" : "Coming Soon"}
            </button> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">DiaryFriend</span>
          </div>
          <p className="text-gray-400 mb-4">{t.footer.tagline}</p>
          <p className="text-sm text-gray-500">{t.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
};

export default DiaryFriendWebsite;
