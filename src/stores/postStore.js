// stores/postStore.js
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getMonthlyPosts } from "../services/postService";

// 날짜 유틸리티 함수
function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthStartEnd(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

const usePostStore = create(
  devtools((set, get) => ({
    // ==================== State ====================
    monthlyCache: {}, // { "2024-01": { entries: {...}, totalCount: 0, lastFetch: timestamp } }
    currentMonth: null, // "2024-01"
    viewMonth: new Date(), // 사용자가 현재 보고 있는 월
    loadingMonths: {}, // { "2024-01": true/false }
    error: null,
    maxCachedMonths: 6, // 최대 캐시 월 수
    cacheTimeout: 5 * 60 * 1000, // 5분

    // ==================== Actions ====================

    // 사용자가 보는 월 설정
    setViewMonth: (date) => {
      set({ viewMonth: date });
    },

    // 현재 월 데이터 로드 (초기 로드)
    loadCurrentMonth: async (userId) => {
      const currentMonthKey = formatMonthKey(new Date());
      return get().loadMonthData(userId, currentMonthKey);
    },

    // 특정 월 데이터 로드
    loadMonthData: async (userId, monthKey, forceReload = false) => {
      const { monthlyCache, cacheTimeout, loadingMonths, maxCachedMonths } =
        get();

      // monthKey 형식: "2024-01"
      const [year, month] = monthKey.split("-").map(Number);

      // 이미 로딩 중이면 스킵
      if (loadingMonths[monthKey]) {
        console.log(`Already loading ${monthKey}`);
        return monthlyCache[monthKey];
      }

      // 캐시 확인 (forceReload가 true면 캐시 무시)
      if (!forceReload) {
        const cached = monthlyCache[monthKey];
        if (cached && cached.lastFetch) {
          const isExpired = Date.now() - cached.lastFetch > cacheTimeout;
          if (!isExpired) {
            console.log(`Using cached data for ${monthKey}`);

            // 캐시 사용 시 lastAccess 업데이트 (LRU를 위해)
            set((state) => ({
              monthlyCache: {
                ...state.monthlyCache,
                [monthKey]: {
                  ...state.monthlyCache[monthKey],
                  lastAccess: Date.now(),
                },
              },
              currentMonth: monthKey,
            }));

            return cached;
          }
        }
      }

      try {
        // 로딩 상태 설정
        set((state) => ({
          loadingMonths: { ...state.loadingMonths, [monthKey]: true },
          error: null,
        }));

        // 월 데이터 fetch
        const { start, end } = getMonthStartEnd(year, month);
        const data = await getMonthlyPosts(
          userId,
          start.toISOString(),
          end.toISOString()
        );

        // 캐시 저장
        const monthData = {
          entries: data.entries || {},
          totalCount: data.totalCount || 0,
          lastFetch: Date.now(),
          lastAccess: Date.now(), // 접근 시간도 기록
        };

        set((state) => {
          const newCache = { ...state.monthlyCache };
          const cacheKeys = Object.keys(newCache);

          // 캐시 크기 관리 - 개선된 로직
          if (cacheKeys.length >= maxCachedMonths) {
            // 절대 삭제하면 안 되는 월들 정의
            const viewMonthKey = formatMonthKey(state.viewMonth);
            const currentMonthKey = formatMonthKey(new Date());

            const protectedMonths = new Set([
              viewMonthKey, // 1. 사용자가 현재 보고 있는 월 (최우선)
              currentMonthKey, // 2. 오늘이 속한 월
              monthKey, // 3. 지금 로딩한 월
            ]);

            // 현재 로딩 중인 모든 월들도 보호
            Object.keys(state.loadingMonths).forEach((key) => {
              if (state.loadingMonths[key]) {
                protectedMonths.add(key);
              }
            });

            // viewMonth의 인접 월도 보호 (선택적)
            const [viewYear, viewMonthNum] = viewMonthKey
              .split("-")
              .map(Number);
            const prevMonth = viewMonthNum === 1 ? 12 : viewMonthNum - 1;
            const prevYear = viewMonthNum === 1 ? viewYear - 1 : viewYear;
            const nextMonth = viewMonthNum === 12 ? 1 : viewMonthNum + 1;
            const nextYear = viewMonthNum === 12 ? viewYear + 1 : viewYear;

            protectedMonths.add(
              `${prevYear}-${String(prevMonth).padStart(2, "0")}`
            );
            protectedMonths.add(
              `${nextYear}-${String(nextMonth).padStart(2, "0")}`
            );

            // 삭제 가능한 캐시만 필터링
            const deletableKeys = cacheKeys.filter(
              (key) => !protectedMonths.has(key)
            );

            if (deletableKeys.length > 0) {
              // LRU: lastAccess 또는 lastFetch 기준으로 정렬
              const sortedKeys = deletableKeys.sort((a, b) => {
                const aTime =
                  newCache[a].lastAccess || newCache[a].lastFetch || 0;
                const bTime =
                  newCache[b].lastAccess || newCache[b].lastFetch || 0;
                return aTime - bTime;
              });

              const keyToRemove = sortedKeys[0];
              delete newCache[keyToRemove];
              console.log(
                `Safely removed cache: ${keyToRemove} (protected: ${Array.from(
                  protectedMonths
                ).join(", ")})`
              );
            } else {
              console.warn(
                `Cache limit exceeded but all ${cacheKeys.length} months are protected. Keeping all.`
              );
              // 모든 캐시가 보호 대상이면 한도 초과 허용
            }
          }

          newCache[monthKey] = monthData;

          return {
            monthlyCache: newCache,
            currentMonth: monthKey,
            loadingMonths: { ...state.loadingMonths, [monthKey]: false },
          };
        });

        return monthData;
      } catch (error) {
        set((state) => ({
          error: error.message,
          loadingMonths: { ...state.loadingMonths, [monthKey]: false },
        }));
        throw error;
      }
    },

    // AI 댓글 업데이트 메서드 (새로 추가)
    updatePostComments: (postId, newComment) => {
      set((state) => {
        const newCache = { ...state.monthlyCache };

        // 모든 월 캐시를 순회하며 해당 포스트 찾기
        Object.keys(newCache).forEach((monthKey) => {
          const monthData = newCache[monthKey];
          if (!monthData?.entries) return;

          // 각 날짜의 포스트들 확인
          Object.keys(monthData.entries).forEach((dateKey) => {
            const posts = monthData.entries[dateKey];
            if (!posts) return;

            // 해당 포스트 찾기
            const postIndex = posts.findIndex((p) => p.id === postId);
            if (postIndex === -1) return;

            // 포스트 복사 및 댓글 추가
            const updatedPosts = [...posts];
            const updatedPost = { ...updatedPosts[postIndex] };

            // AI 댓글 배열이 없으면 생성
            if (!updatedPost.aiReflections) {
              updatedPost.aiReflections = [];
            }

            // 중복 체크 (댓글 ID로)
            const exists = updatedPost.aiReflections.some(
              (ref) => ref.id === newComment.id
            );

            if (!exists) {
              // 새 댓글 추가
              updatedPost.aiReflections = [
                ...updatedPost.aiReflections,
                {
                  id: newComment.id,
                  message: newComment.message,
                  createdAt: newComment.created_at,
                  character: {
                    name: newComment.Character?.name || "AI Friend",
                    koreanName: newComment.Character?.korean_name,
                    description: newComment.Character?.description,
                    korean_description:
                      newComment.Character?.korean_description,
                    affinity:
                      newComment.Character?.User_Character?.[0]?.affinity || 0,
                    avatarUrl: newComment.Character?.avatar_url,
                  },
                },
              ];

              updatedPosts[postIndex] = updatedPost;
              monthData.entries[dateKey] = updatedPosts;
            }
          });
        });

        return { monthlyCache: newCache };
      });
    },

    // 여러 월 데이터 병합 조회 (PostDetail 등에서 사용)
    getAllCachedPosts: () => {
      const { monthlyCache } = get();
      const allEntries = {};
      let totalCount = 0;

      Object.values(monthlyCache).forEach((monthData) => {
        Object.assign(allEntries, monthData.entries);
        totalCount += monthData.totalCount;
      });

      return { entries: allEntries, totalCount };
    },

    // 특정 날짜의 포스트 가져오기
    getPostsByDate: (dateStr) => {
      const { monthlyCache } = get();
      const monthKey = dateStr.substring(0, 7); // "2024-01-15" -> "2024-01"

      const monthData = monthlyCache[monthKey];
      return monthData?.entries?.[dateStr] || null;
    },

    // 새 포스트 추가 (포스트 생성 시 사용)
    addNewPost: (post) => {
      set((state) => {
        const dateKey = formatDateKey(post.entryDate);
        const monthKey = dateKey.substring(0, 7);

        const newCache = { ...state.monthlyCache };

        // 해당 월 캐시가 없으면 생성
        if (!newCache[monthKey]) {
          newCache[monthKey] = {
            entries: {},
            totalCount: 0,
            lastFetch: Date.now(),
          };
        }

        const monthData = { ...newCache[monthKey] };
        const updatedEntries = { ...monthData.entries };

        // 해당 날짜 배열이 없으면 생성
        if (!updatedEntries[dateKey]) {
          updatedEntries[dateKey] = [];
        }

        // 중복 체크
        const exists = updatedEntries[dateKey].some((p) => p.id === post.id);
        if (!exists) {
          updatedEntries[dateKey] = [post, ...updatedEntries[dateKey]];
          monthData.totalCount += 1;
        }

        monthData.entries = updatedEntries;
        newCache[monthKey] = monthData;

        return { monthlyCache: newCache };
      });
    },

    // 월 로딩 상태 확인
    isMonthLoading: (monthKey) => {
      const { loadingMonths } = get();
      return loadingMonths[monthKey] || false;
    },

    // 월 캐시 존재 여부 확인
    hasMonthCache: (monthKey) => {
      const { monthlyCache, cacheTimeout } = get();
      const cached = monthlyCache[monthKey];

      if (!cached) return false;

      const isExpired = Date.now() - cached.lastFetch > cacheTimeout;
      return !isExpired;
    },

    // 프리페치 (선택적)
    prefetchAdjacentMonths: async (userId, currentMonthKey) => {
      const [year, month] = currentMonthKey.split("-").map(Number);

      // 이전 월
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

      // 다음 월
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

      // 백그라운드로 로드 (에러 무시)
      const { hasMonthCache, loadMonthData } = get();

      if (!hasMonthCache(prevMonthKey)) {
        loadMonthData(userId, prevMonthKey).catch(() => {});
      }

      if (!hasMonthCache(nextMonthKey)) {
        loadMonthData(userId, nextMonthKey).catch(() => {});
      }
    },

    // 캐시 클리어
    clearCache: () => {
      set({
        monthlyCache: {},
        currentMonth: null,
        loadingMonths: {},
        error: null,
        // viewMonth는 유지
      });
    },

    // 특정 월 캐시 클리어
    clearMonthCache: (monthKey) => {
      set((state) => {
        const newCache = { ...state.monthlyCache };
        delete newCache[monthKey];
        return { monthlyCache: newCache };
      });
    },
  })),
  { name: "post-store" }
);

// ==================== Selector hooks ====================
export const useMonthlyCache = () =>
  usePostStore((state) => state.monthlyCache);
export const useCurrentMonth = () =>
  usePostStore((state) => state.currentMonth);
export const useViewMonth = () => usePostStore((state) => state.viewMonth);
export const useMonthLoading = (monthKey) =>
  usePostStore((state) => state.loadingMonths[monthKey] || false);
export const usePostsByDate = (dateStr) =>
  usePostStore((state) => state.getPostsByDate(dateStr));
export const useAllCachedPosts = () =>
  usePostStore((state) => state.getAllCachedPosts());

// ==================== Action hooks ====================
export const usePostActions = () => {
  const loadCurrentMonth = usePostStore((state) => state.loadCurrentMonth);
  const loadMonthData = usePostStore((state) => state.loadMonthData);
  const addNewPost = usePostStore((state) => state.addNewPost);
  const getPostsByDate = usePostStore((state) => state.getPostsByDate);
  const clearCache = usePostStore((state) => state.clearCache);
  const clearMonthCache = usePostStore((state) => state.clearMonthCache);
  const prefetchAdjacentMonths = usePostStore(
    (state) => state.prefetchAdjacentMonths
  );
  const hasMonthCache = usePostStore((state) => state.hasMonthCache);
  const setViewMonth = usePostStore((state) => state.setViewMonth);
  const updatePostComments = usePostStore((state) => state.updatePostComments);

  return {
    loadCurrentMonth,
    loadMonthData,
    addNewPost,
    getPostsByDate,
    clearCache,
    clearMonthCache,
    prefetchAdjacentMonths,
    hasMonthCache,
    setViewMonth,
    updatePostComments, // 새로 추가
  };
};

export default usePostStore;
