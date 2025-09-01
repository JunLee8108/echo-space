import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/utils/ScrollToTop";
import Header from "./components/layout/Header";
import BottomNavbar from "./components/layout/BottomNavbar";
import PWAInstallPrompt from "./components/utils/PWAInstallPrompt";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Post from "./pages/Post/Post";
import PostDetail from "./pages/Post/PostDetail";
import Search from "./pages/Search/Search";
import AuthForm from "./pages/Home/AuthForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// userStore imports
import {
  useUserLoading,
  useIsAuthenticated,
  setupAuthListener,
  useUserActions,
} from "./stores/userStore";

// QueryClient를 컴포넌트 밖에서 생성 (싱글톤 패턴)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
    mutations: {
      retry: 1,
    },
  },
});

// Main App Component
function App() {
  const loadingUser = useUserLoading();
  const isAuthenticated = useIsAuthenticated();
  const { initializeUser } = useUserActions();

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Setup auth listener
  useEffect(() => {
    const unsubscribe = setupAuthListener();
    return unsubscribe;
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <AuthForm />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Authenticated layout
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-white">
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1f2937",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                },
              }}
            />

            <ScrollToTop />

            {/* Global Header */}
            <Header />

            {/* Main Content */}
            <main className="pb-25 md:pb-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/search" element={<Search />} />
                <Route path="/post/new" element={<Post />} />
                <Route path="/post/edit/:id" element={<Post />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar />

            {/* PWA Install Prompt - Add this component */}
            {/* <PWAInstallPrompt /> */}
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </>
  );
}

export default App;
