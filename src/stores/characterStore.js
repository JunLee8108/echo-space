// stores/characterStore.js
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
  fetchUserCreatedAndSystemCharacters,
  switchUserCharacterFollow,
  batchToggleFollow, // 새로 추가된 배치 함수
} from "../services/characterService";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds

const useCharacterStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      characters: [],
      loading: true,
      error: null,
      userId: null,

      // Derived state - 미리 계산해서 저장
      followedCharacters: [],
      followedCharacterIds: new Set(),

      // Cache management
      cache: {
        data: null,
        timestamp: null,
        promise: null,
      },

      // Helper function to update derived state
      updateDerivedState: (characters) => {
        const followed = characters.filter((c) => c.is_following);
        const followedIds = new Set(followed.map((c) => c.id));

        return {
          followedCharacters: followed,
          followedCharacterIds: followedIds,
        };
      },

      // Actions
      setUserId: (userId) => set({ userId }),

      // Cache helper methods
      isCacheValid: () => {
        const { cache } = get();
        if (!cache.data || !cache.timestamp) return false;
        const now = Date.now();
        return now - cache.timestamp < CACHE_DURATION;
      },

      isCacheStale: () => {
        const { cache } = get();
        if (!cache.timestamp) return true;
        const now = Date.now();
        return now - cache.timestamp > STALE_TIME;
      },

      // Load characters with caching
      loadCharacters: async (forceRefresh = false) => {
        const {
          userId,
          cache,
          isCacheValid,
          isCacheStale,
          updateDerivedState,
        } = get();
        if (!userId) return;

        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid()) {
          const derivedState = updateDerivedState(cache.data);
          set({
            characters: cache.data,
            loading: false,
            ...derivedState,
          });

          // Background refresh if stale
          if (isCacheStale()) {
            fetchUserCreatedAndSystemCharacters(userId)
              .then((data) => {
                const derivedState = updateDerivedState(data);
                set({
                  characters: data,
                  ...derivedState,
                  cache: {
                    data,
                    timestamp: Date.now(),
                    promise: null,
                  },
                });
              })
              .catch(console.error);
          }

          return cache.data;
        }

        // Prevent duplicate requests
        if (cache.promise) {
          return cache.promise;
        }

        // Create new request
        const promise = (async () => {
          try {
            set({ loading: true, error: null });
            const data = await fetchUserCreatedAndSystemCharacters(userId);
            const derivedState = updateDerivedState(data);

            set({
              characters: data,
              ...derivedState,
              loading: false,
              cache: {
                data,
                timestamp: Date.now(),
                promise: null,
              },
            });

            return data;
          } catch (err) {
            set({
              error: err.message,
              loading: false,
              cache: { ...cache, promise: null },
            });
            console.error("Error loading characters:", err);
            throw err;
          }
        })();

        // Store promise to prevent duplicate requests
        set((state) => ({
          cache: { ...state.cache, promise },
        }));

        return promise;
      },

      // Toggle follow status with optimistic updates
      toggleFollow: async (character, skipApiCall = false) => {
        const { userId, characters, updateDerivedState } = get();
        if (!userId) return;

        // skipApiCall이 true면 상태만 업데이트 (배치 처리용)
        if (skipApiCall) {
          const updatedCharacters = characters.map((c) =>
            c.id === character.id
              ? {
                  ...c,
                  is_following: !c.is_following,
                }
              : c
          );

          const updatedDerivedState = updateDerivedState(updatedCharacters);

          set({
            characters: updatedCharacters,
            ...updatedDerivedState,
            cache: {
              data: updatedCharacters,
              timestamp: Date.now(),
              promise: null,
            },
          });
          return;
        }

        // Store previous state for rollback
        const previousCharacters = [...characters];
        const previousDerivedState = updateDerivedState(previousCharacters);

        // Optimistic update
        const optimisticCharacters = characters.map((c) =>
          c.id === character.id
            ? {
                ...c,
                is_following: !c.is_following,
                user_character_id: c.user_character_id || `temp_${Date.now()}`,
              }
            : c
        );

        const optimisticDerivedState = updateDerivedState(optimisticCharacters);

        set({
          characters: optimisticCharacters,
          ...optimisticDerivedState,
        });

        try {
          // Perform actual update
          const result = await switchUserCharacterFollow(userId, character);

          // Update with actual server data AND update cache
          const updatedCharacters = get().characters.map((c) =>
            c.id === character.id
              ? {
                  ...c,
                  is_following: result.is_following,
                  user_character_id: result.user_character_id,
                }
              : c
          );

          const updatedDerivedState = updateDerivedState(updatedCharacters);

          set({
            characters: updatedCharacters,
            ...updatedDerivedState,
            cache: {
              data: updatedCharacters,
              timestamp: Date.now(),
              promise: null,
            },
          });
        } catch (error) {
          // Rollback on error
          console.error("Failed to toggle follow:", error);
          set({
            characters: previousCharacters,
            ...previousDerivedState,
          });

          // Reload data to ensure consistency
          try {
            await get().loadCharacters(true);
          } catch (reloadError) {
            console.error("Failed to reload characters:", reloadError);
          }

          throw error;
        }
      },

      // 새로 추가: 배치 follow/unfollow 처리
      batchToggleFollow: async (characterIds, followState) => {
        const { userId, characters, updateDerivedState } = get();
        if (!userId || !characterIds.length)
          return { successful: [], failed: [] };

        try {
          // 배치 API 호출
          const result = await batchToggleFollow(
            userId,
            characterIds,
            followState
          );

          // 성공한 업데이트들을 store에 반영
          if (result.successful.length > 0) {
            const updatedCharacters = characters.map((character) => {
              const successResult = result.successful.find(
                (r) => r.characterId === character.id && !r.skipped
              );

              if (successResult) {
                return {
                  ...character,
                  is_following: successResult.is_following,
                  user_character_id: successResult.user_character_id,
                };
              }
              return character;
            });

            const updatedDerivedState = updateDerivedState(updatedCharacters);

            set({
              characters: updatedCharacters,
              ...updatedDerivedState,
              cache: {
                data: updatedCharacters,
                timestamp: Date.now(),
                promise: null,
              },
            });
          }

          return result;
        } catch (error) {
          console.error("Batch toggle follow failed:", error);

          // 에러 발생 시 데이터 다시 로드
          try {
            await get().loadCharacters(true);
          } catch (reloadError) {
            console.error(
              "Failed to reload characters after batch error:",
              reloadError
            );
          }

          throw error;
        }
      },

      // Get random characters for AI comments/likes
      getRandomCharacters: (count) => {
        const { followedCharacters } = get();
        const shuffled = [...followedCharacters].sort(
          () => 0.5 - Math.random()
        );
        return shuffled.slice(0, count);
      },

      // Clear cache
      clearCache: () => {
        set({
          cache: {
            data: null,
            timestamp: null,
            promise: null,
          },
        });
      },

      // Refresh characters (force reload)
      refreshCharacters: () => {
        return get().loadCharacters(true);
      },
    })),
    {
      name: "character-store", // DevTools에서 보일 이름
    }
  )
);

// Selector hooks for better performance
export const useCharacters = () =>
  useCharacterStore((state) => state.characters);
export const useFollowedCharacters = () =>
  useCharacterStore((state) => state.followedCharacters);
export const useFollowedCharacterIds = () =>
  useCharacterStore((state) => state.followedCharacterIds);
export const useCharacterLoading = () =>
  useCharacterStore((state) => state.loading);
export const useCharacterError = () =>
  useCharacterStore((state) => state.error);

// Action hooks
export const useCharacterActions = () => {
  const toggleFollow = useCharacterStore((state) => state.toggleFollow);
  const batchToggleFollow = useCharacterStore(
    (state) => state.batchToggleFollow
  );
  const getRandomCharacters = useCharacterStore(
    (state) => state.getRandomCharacters
  );
  const refreshCharacters = useCharacterStore(
    (state) => state.refreshCharacters
  );
  const clearCache = useCharacterStore((state) => state.clearCache);
  const loadCharacters = useCharacterStore((state) => state.loadCharacters);
  const setUserId = useCharacterStore((state) => state.setUserId);

  return {
    toggleFollow,
    batchToggleFollow,
    getRandomCharacters,
    refreshCharacters,
    clearCache,
    loadCharacters,
    setUserId,
  };
};

// Hook for cache info
export const useCacheInfo = () => {
  return useCharacterStore((state) => ({
    age: state.cache.timestamp ? Date.now() - state.cache.timestamp : null,
    isStale: state.isCacheStale(),
    isValid: state.isCacheValid(),
  }));
};

// Initialize store with userId
export const initializeCharacterStore = (userId) => {
  const { setUserId, loadCharacters, clearCache } =
    useCharacterStore.getState();

  // Clear cache when user changes
  clearCache();

  // Set new userId
  setUserId(userId);

  // Load characters if userId exists
  if (userId) {
    loadCharacters();
  }
};

export default useCharacterStore;
