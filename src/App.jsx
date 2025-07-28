// import { useState, useEffect } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router";
// import ScrollToTop from "./components/utils/ScrollToTop";
// import Header from "./components/layout/Header";
// import BottomNavbar from "./components/layout/BottomNavbar";
// import Home from "./pages/Home";
// import Profile from "./pages/Profile";
// import AuthForm from "./components/AuthForm";
// import supabase from "./services/supabaseClient";
// import { getCurrentUser } from "./services/authService";
// import { CharacterProvider } from "./components/contexts/CharacterContext";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// // QueryClient를 컴포넌트 밖에서 생성 (싱글톤 패턴)
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       refetchOnWindowFocus: false,
//       staleTime: 5 * 60 * 1000, // 5분
//       cacheTime: 10 * 60 * 1000, // 10분
//     },
//     mutations: {
//       retry: 1,
//     },
//   },
// });

// function App() {
//   // Auth state
//   const [user, setUser] = useState(null);
//   const [loadingUser, setLoadingUser] = useState(true);

//   // Global notification count
//   const [notificationCount, setNotificationCount] = useState(0);

//   // Check initial auth state
//   useEffect(() => {
//     (async () => {
//       const current = await getCurrentUser();
//       setUser(current);
//       setLoadingUser(false);
//     })();
//   }, []);

//   // Listen to auth state changes
//   useEffect(() => {
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         const current = session?.user ?? null;
//         setUser(current);
//       }
//     );
//     return () => listener.subscription.unsubscribe();
//   }, []);

//   // Function to increment notification count
//   const incrementNotificationCount = () => {
//     setNotificationCount((prev) => prev + 1);
//     // Clear notification after 5 seconds
//     setTimeout(() => {
//       setNotificationCount((prev) => Math.max(0, prev - 1));
//     }, 5000);
//   };

//   if (loadingUser) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   // If not authenticated, show auth form
//   if (!user) {
//     return (
//       <BrowserRouter>
//         <Routes>
//           <Route
//             path="/"
//             element={
//               <div className="min-h-screen flex items-center justify-center bg-stone-50">
//                 <AuthForm
//                   onAuthSuccess={() => {
//                     /* handled by onAuthStateChange */
//                   }}
//                 />
//               </div>
//             }
//           />
//           {/* Redirect all other routes to root when not authenticated */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     );
//   }

//   // Authenticated layout with CharacterProvider
//   return (
//     <QueryClientProvider client={queryClient}>
//       <CharacterProvider userId={user?.id}>
//         <BrowserRouter>
//           <div className="min-h-screen bg-white">
//             <ScrollToTop />

//             {/* Global Header */}
//             <Header notificationCount={notificationCount} />

//             {/* Main Content */}
//             <main className="pb-20">
//               {/* padding-bottom for BottomNavbar */}
//               <Routes>
//                 <Route
//                   path="/"
//                   element={
//                     <Home
//                       user={user}
//                       incrementNotificationCount={incrementNotificationCount}
//                     />
//                   }
//                 />
//                 <Route path="/profile" element={<Profile user={user} />} />
//                 {/* Redirect any unknown routes to home */}
//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </main>

//             {/* Bottom Navigation */}
//             <BottomNavbar />
//           </div>
//         </BrowserRouter>
//       </CharacterProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;

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

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Global notification count
  const [notificationCount, setNotificationCount] = useState(0);

  // PostFormModal state
  const [showPostModal, setShowPostModal] = useState(false);

  // Ref to access Home component's createPostMutation
  const homeRef = useRef(null);

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

  // Function to increment notification count
  const incrementNotificationCount = () => {
    setNotificationCount((prev) => prev + 1);
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }, 5000);
  };

  // Handle post submission from modal
  const handlePostSubmit = (post) => {
    if (homeRef.current && homeRef.current.handlePostSubmit) {
      homeRef.current.handlePostSubmit(post);
    }
  };

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
          {/* Redirect all other routes to root when not authenticated */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Authenticated layout with CharacterProvider
  return (
    <QueryClientProvider client={queryClient}>
      <CharacterProvider userId={user?.id}>
        <BrowserRouter>
          <div className="min-h-screen bg-white">
            <ScrollToTop />

            {/* Global Header */}
            <Header notificationCount={notificationCount} />

            {/* Main Content */}
            <main className="pb-20">
              {/* padding-bottom for BottomNavbar */}
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      ref={homeRef}
                      user={user}
                      incrementNotificationCount={incrementNotificationCount}
                    />
                  }
                />
                <Route path="/profile" element={<Profile user={user} />} />
                {/* Redirect any unknown routes to home */}
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
        </BrowserRouter>
      </CharacterProvider>
    </QueryClientProvider>
  );
}

export default App;
