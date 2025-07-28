import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import ScrollToTop from "./components/utils/ScrollToTop";
import Header from "./components/layout/Header";
import BottomNavbar from "./components/layout/BottomNavbar";
import PostFormModal from "./components/UI/PostFormModal";
import "./components/UI/PostFormModal.css";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AuthForm from "./components/AuthForm";
import supabase from "./services/supabaseClient";
import { getCurrentUser } from "./services/authService";
import { CharacterProvider } from "./components/contexts/CharacterContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatePost } from "./components/hooks/useCreatePost";

// QueryClient를 컴포넌트 밖에서 생성 (싱글톤 패턴)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
    mutations: {
      retry: 1,
    },
  },
});

// Main App Content Component
function AppContent({ user }) {
  // Global notification count
  const [notificationCount, setNotificationCount] = useState(0);

  // PostFormModal state
  const [showPostModal, setShowPostModal] = useState(false);

  // Scroll position ref
  const scrollPositionRef = useRef(0);

  // Function to increment notification count
  const incrementNotificationCount = () => {
    setNotificationCount((prev) => prev + 1);
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }, 5000);
  };

  // useCreatePost hook 사용
  const createPostMutation = useCreatePost(user, {
    onSuccess: () => {
      incrementNotificationCount();
    },
  });

  // Handle post submission from modal
  const handlePostSubmit = (post) => {
    createPostMutation.mutate(post);
  };

  // Scroll position management
  useEffect(() => {
    let timer;

    if (showPostModal) {
      // Save current scroll position before fixing body
      scrollPositionRef.current = window.scrollY;

      // Apply fixed positioning with negative top to maintain visual position
      document.body.style.top = `-${scrollPositionRef.current}px`;

      timer = setTimeout(() => {
        document.body.classList.add("modal-open");
      }, 600);
    } else {
      // Remove modal-open class
      document.body.classList.remove("modal-open");

      // Reset body styles
      document.body.style.top = "";

      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      clearTimeout(timer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPostModal]);

  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />

      {/* Global Header */}
      <Header notificationCount={notificationCount} />

      {/* Main Content */}
      <main className="pb-20">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={user}
                incrementNotificationCount={incrementNotificationCount}
              />
            }
          />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <BottomNavbar onAddClick={() => setShowPostModal(true)} />

      {/* Post Form Modal */}
      <PostFormModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostSubmit={handlePostSubmit}
      />
    </div>
  );
}

// Main App Component
function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Check initial auth state
  useEffect(() => {
    (async () => {
      const current = await getCurrentUser();
      setUser(current);
      setLoadingUser(false);
    })();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const current = session?.user ?? null;
        setUser(current);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If not authenticated, show auth form
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <AuthForm
                  onAuthSuccess={() => {
                    /* handled by onAuthStateChange */
                  }}
                />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Authenticated layout with providers
  return (
    <QueryClientProvider client={queryClient}>
      <CharacterProvider userId={user?.id}>
        <BrowserRouter>
          <AppContent user={user} />
        </BrowserRouter>
      </CharacterProvider>
    </QueryClientProvider>
  );
}

export default App;
