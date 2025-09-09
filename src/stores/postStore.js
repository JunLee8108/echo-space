// stores/postStore.js
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getRecentPosts } from "../services/postService";

const usePostStore = create(
  devtools((set, get) => ({
    // State
    recentPosts: null,
    loading: false,
    error: null,
    lastFetch: null,

    // Actions
    loadRecentPosts: async (userId, forceRefresh = false) => {
      const { lastFetch, recentPosts } = get();

      // 5분 내 캐시된 데이터가 있으면 반환
      if (!forceRefresh && recentPosts && lastFetch) {
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - lastFetch < fiveMinutes) {
          return recentPosts;
        }
      }

      try {
        set({ loading: true, error: null });
        const data = await getRecentPosts(userId);
        set({
          recentPosts: data,
          loading: false,
          lastFetch: Date.now(),
        });
        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    // 특정 날짜의 포스트 가져오기
    getPostsByDate: (dateStr) => {
      const { recentPosts } = get();
      return recentPosts?.entries?.[dateStr] || null;
    },

    // 캐시 클리어
    clearCache: () => {
      set({
        recentPosts: null,
        lastFetch: null,
        error: null,
      });
    },
  })),
  { name: "post-store" }
);

// Selector hooks
export const useRecentPosts = () => usePostStore((state) => state.recentPosts);
export const usePostsLoading = () => usePostStore((state) => state.loading);
export const usePostsByDate = (dateStr) =>
  usePostStore((state) => state.getPostsByDate(dateStr));

// Action hooks
export const usePostActions = () => {
  const loadRecentPosts = usePostStore((state) => state.loadRecentPosts);
  const getPostsByDate = usePostStore((state) => state.getPostsByDate);
  const clearCache = usePostStore((state) => state.clearCache);

  return { loadRecentPosts, getPostsByDate, clearCache };
};

export default usePostStore;
