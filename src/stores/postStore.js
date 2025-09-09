// stores/postStore.js
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getRecentPosts } from "../services/postService";

// 날짜 유틸리티 함수
function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const usePostStore = create(
  devtools((set, get) => ({
    // ==================== State ====================
    recentPosts: null,
    loading: false,
    error: null,
    lastFetch: null,

    // ==================== Actions ====================

    // 최근 포스트 로드
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

    // 새 포스트 추가 (포스트 생성 시 사용)
    addNewPost: (post) => {
      set((state) => {
        // recentPosts가 없으면 초기화
        if (!state.recentPosts) {
          const dateKey = formatDateKey(post.entryDate);
          return {
            recentPosts: {
              entries: {
                [dateKey]: [post],
              },
              totalCount: 1,
            },
          };
        }

        const dateKey = formatDateKey(post.entryDate);
        const updatedEntries = { ...state.recentPosts.entries };

        // 해당 날짜 배열이 없으면 생성
        if (!updatedEntries[dateKey]) {
          updatedEntries[dateKey] = [];
        }

        // 중복 체크 (같은 ID가 이미 있는지)
        const exists = updatedEntries[dateKey].some((p) => p.id === post.id);
        if (!exists) {
          // 최신 포스트를 배열 앞에 추가
          updatedEntries[dateKey] = [post, ...updatedEntries[dateKey]];
        }

        return {
          recentPosts: {
            entries: updatedEntries,
            totalCount: state.recentPosts.totalCount + (exists ? 0 : 1),
          },
        };
      });
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
        loading: false,
      });
    },
  })),
  { name: "post-store" }
);

// ==================== Selector hooks ====================
export const useRecentPosts = () => usePostStore((state) => state.recentPosts);
export const usePostsLoading = () => usePostStore((state) => state.loading);
export const usePostsByDate = (dateStr) =>
  usePostStore((state) => state.getPostsByDate(dateStr));

// ==================== Action hooks ====================
export const usePostActions = () => {
  const loadRecentPosts = usePostStore((state) => state.loadRecentPosts);
  const addNewPost = usePostStore((state) => state.addNewPost);
  const getPostsByDate = usePostStore((state) => state.getPostsByDate);
  const clearCache = usePostStore((state) => state.clearCache);

  return {
    loadRecentPosts,
    addNewPost,
    getPostsByDate,
    clearCache,
  };
};

export default usePostStore;
