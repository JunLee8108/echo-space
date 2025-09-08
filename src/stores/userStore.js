// stores/userStore.js
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import supabase from "../services/supabaseClient";
import {
  getCurrentUser as getCurrentUserService,
  updateDisplayName as updateDisplayNameService,
  updateLanguage as updateLanguageService,
  updatePassword as updatePasswordService,
  signOut as signOutService,
} from "../services/authService";

const useUserStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      user: null,
      loading: true,
      error: null,

      // Computed values - 직접 state에서 파생되는 값들
      isAuthenticated: () => !!get().user,

      getUserId: () => get().user?.id || null,

      getDisplayName: () => {
        const user = get().user;
        return (
          user?.user_metadata?.display_name ||
          user?.email?.split("@")[0] ||
          "User"
        );
      },

      getUserEmail: () => get().user?.email || null,

      getLanguage: () => {
        const user = get().user;
        return user?.user_metadata?.language || "English";
      },

      // Actions
      setUser: (user) => set({ user, error: null }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Initialize user (called on app start)
      initializeUser: async () => {
        try {
          set({ loading: true, error: null });
          const user = await getCurrentUserService();
          set({ user, loading: false });

          // Character store 초기화
          if (user?.id) {
            const { initializeCharacterStore } = await import(
              "./characterStore"
            );
            await initializeCharacterStore(user.id);
          }

          return user;
        } catch (error) {
          set({ error: error.message, loading: false });
          console.error("Error initializing user:", error);
          return null;
        }
      },

      // Update display name
      updateDisplayName: async (displayName) => {
        try {
          set({ error: null });
          const data = await updateDisplayNameService(displayName);

          // Update local state
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                user_metadata: {
                  ...currentUser.user_metadata,
                  display_name: displayName,
                },
              },
            });
          }

          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Update language
      updateLanguage: async (language) => {
        try {
          set({ error: null });
          const data = await updateLanguageService(language);

          // Update local state
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                user_metadata: {
                  ...currentUser.user_metadata,
                  language: language,
                },
              },
            });
          }

          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Update password
      updatePassword: async (currentPassword, newPassword) => {
        try {
          set({ error: null });
          const result = await updatePasswordService(
            currentPassword,
            newPassword
          );
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ error: null });
          await signOutService();
          set({ user: null });
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    })),
    {
      name: "user-store", // DevTools에서 보일 이름
    }
  )
);

// Selector hooks
export const useUser = () => useUserStore((state) => state.user);
export const useUserId = () => useUserStore((state) => state.getUserId());
export const useDisplayName = () =>
  useUserStore((state) => state.getDisplayName());
export const useUserEmail = () => useUserStore((state) => state.getUserEmail());
export const useUserLanguage = () =>
  useUserStore((state) => state.getLanguage());
export const useUserLoading = () => useUserStore((state) => state.loading);
export const useUserError = () => useUserStore((state) => state.error);
export const useIsAuthenticated = () =>
  useUserStore((state) => state.isAuthenticated());

// Action hooks
export const useUserActions = () => {
  const setUser = useUserStore((state) => state.setUser);
  const initializeUser = useUserStore((state) => state.initializeUser);
  const updateDisplayName = useUserStore((state) => state.updateDisplayName);
  const updateLanguage = useUserStore((state) => state.updateLanguage);
  const updatePassword = useUserStore((state) => state.updatePassword);
  const signOut = useUserStore((state) => state.signOut);
  const clearError = useUserStore((state) => state.clearError);

  return {
    setUser,
    initializeUser,
    updateDisplayName,
    updateLanguage,
    updatePassword,
    signOut,
    clearError,
  };
};

// Supabase Auth Listener Setup
let activeListener = null;
let characterStoreInitialized = false;

export const setupAuthListener = () => {
  // 이미 리스너가 있으면 기존 것을 반환
  if (activeListener) {
    return () => {};
  }

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // TOKEN_REFRESHED 이벤트는 무시 (429 에러의 주요 원인)
      if (event === "TOKEN_REFRESHED") {
        return;
      }

      const user = session?.user ?? null;
      useUserStore.getState().setUser(user);
      useUserStore.getState().setLoading(false);

      // Character store 초기화 - SIGNED_IN 이벤트이고 아직 초기화 안된 경우만
      if (event === "SIGNED_IN" && user?.id && !characterStoreInitialized) {
        characterStoreInitialized = true;
        const { initializeCharacterStore } = await import("./characterStore");
        await initializeCharacterStore(user.id);
      }

      // SIGNED_OUT 시 플래그 리셋
      if (event === "SIGNED_OUT") {
        characterStoreInitialized = false;
      }
    }
  );

  activeListener = listener;

  return () => {
    activeListener = null;
    characterStoreInitialized = false;
    listener.subscription.unsubscribe();
  };
};

export default useUserStore;
