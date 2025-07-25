// src/contexts/CharacterContext.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchUserCreatedAndSystemCharacters,
  switchUserCharacterFollow,
} from "../../services/characterService";
import { CharacterContext } from "./CharacterContextBase";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds

export const CharacterProvider = ({ children, userId }) => {
  // State management - 단일 데이터 소스
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache management - 단순화
  const cacheRef = useRef({
    data: null,
    timestamp: null,
    promise: null,
  });

  // Check if cache is valid
  const isCacheValid = useCallback((cache) => {
    if (!cache.data || !cache.timestamp) return false;
    const now = Date.now();
    return now - cache.timestamp < CACHE_DURATION;
  }, []);

  // Check if cache is stale (needs background refresh)
  const isCacheStale = useCallback((cache) => {
    if (!cache.timestamp) return true;
    const now = Date.now();
    return now - cache.timestamp > STALE_TIME;
  }, []);

  // Memoized values for performance - 필터링으로 파생 데이터 생성
  const followedCharacters = useMemo(
    () => characters.filter((c) => c.is_following),
    [characters]
  );

  // Available characters = followed + system default
  const availableCharacters = useMemo(
    () => characters.filter((c) => c.is_following),
    [characters]
  );

  const followedCharacterIds = useMemo(
    () => new Set(followedCharacters.map((c) => c.id)),
    [followedCharacters]
  );

  // Load characters with caching
  const loadCharacters = useCallback(
    async (forceRefresh = false) => {
      if (!userId) return;

      const cache = cacheRef.current;

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid(cache)) {
        setCharacters(cache.data);
        setLoading(false);

        // Background refresh if stale
        if (isCacheStale(cache)) {
          fetchUserCreatedAndSystemCharacters(userId)
            .then((data) => {
              cacheRef.current = {
                data,
                timestamp: Date.now(),
                promise: null,
              };
              setCharacters(data);
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
          setLoading(true);
          setError(null);
          const data = await fetchUserCreatedAndSystemCharacters(userId);

          // Update cache
          cacheRef.current = {
            data,
            timestamp: Date.now(),
            promise: null,
          };

          setCharacters(data);
          return data;
        } catch (err) {
          setError(err.message);
          console.error("Error loading characters:", err);
          throw err;
        } finally {
          setLoading(false);
        }
      })();

      // Store promise to prevent duplicate requests
      cacheRef.current.promise = promise;
      return promise;
    },
    [userId, isCacheValid, isCacheStale]
  );

  // Toggle follow status with optimistic updates
  const toggleFollow = useCallback(
    async (character) => {
      if (!userId) return;

      // Store previous state for rollback
      const previousCharacters = [...characters];

      // Optimistic update
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === character.id
            ? {
                ...c,
                is_following: !c.is_following,
                user_character_id: c.user_character_id || `temp_${Date.now()}`,
              }
            : c
        )
      );

      try {
        // Perform actual update and get the result
        const result = await switchUserCharacterFollow(userId, character);

        // Update with actual server data AND update cache
        setCharacters((prev) => {
          const updatedCharacters = prev.map((c) =>
            c.id === character.id
              ? {
                  ...c,
                  is_following: result.is_following,
                  user_character_id: result.user_character_id,
                }
              : c
          );

          // ✅ 캐시 업데이트를 setState 내부에서 수행
          cacheRef.current = {
            data: updatedCharacters,
            timestamp: Date.now(),
            promise: null,
          };

          return updatedCharacters;
        });
      } catch (error) {
        // Rollback on error
        console.error("Failed to toggle follow:", error);
        setCharacters(previousCharacters);

        // 에러 시에만 전체 데이터 리로드 (데이터 일관성 보장)
        try {
          await loadCharacters(true);
        } catch (reloadError) {
          console.error("Failed to reload characters:", reloadError);
        }

        throw error;
      }
    },
    [userId, characters, loadCharacters]
  );

  // Get random characters for AI comments/likes
  const getRandomCharacters = useCallback(
    (count) => {
      const shuffled = [...availableCharacters].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
    [availableCharacters]
  );

  // Clear cache when user changes
  useEffect(() => {
    cacheRef.current = {
      data: null,
      timestamp: null,
      promise: null,
    };
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadCharacters();
    }
  }, [userId, loadCharacters]);

  // Manual cache management functions
  const clearCache = useCallback(() => {
    cacheRef.current = {
      data: null,
      timestamp: null,
      promise: null,
    };
  }, []);

  const refreshCharacters = useCallback(() => {
    return loadCharacters(true);
  }, [loadCharacters]);

  // Context value with memoization for performance
  const contextValue = useMemo(
    () => ({
      // State
      characters,
      availableCharacters,
      followedCharacters,
      followedCharacterIds,
      loading,
      error,

      // Actions
      toggleFollow,
      getRandomCharacters,
      refreshCharacters,
      clearCache,

      // Cache info (for debugging or UI indicators)
      cacheInfo: {
        age: cacheRef.current.timestamp
          ? Date.now() - cacheRef.current.timestamp
          : null,
        isStale: isCacheStale(cacheRef.current),
        isValid: isCacheValid(cacheRef.current),
      },
    }),
    [
      characters,
      availableCharacters,
      followedCharacters,
      followedCharacterIds,
      loading,
      error,
      toggleFollow,
      getRandomCharacters,
      refreshCharacters,
      clearCache,
      isCacheStale,
      isCacheValid,
    ]
  );

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
};
