// src/components/hooks/useSearch.js - 해시태그 검색 제거 버전
import { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  searchUsers,
  searchPosts,
  getTrendingHashtags,
  saveRecentSearch,
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from "../../services/searchService";
import { useUserId } from "../../stores/userStore";

/**
 * 사용자 검색 훅
 */
export const useSearchUsers = (query, options = {}) => {
  const userId = useUserId();

  return useQuery({
    queryKey: ["searchUsers", query, options],
    queryFn: () => searchUsers(query, { ...options, currentUserId: userId }),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * 포스트 검색 훅 (무한 스크롤)
 */
export const useSearchPosts = (query) => {
  const userId = useUserId();

  return useInfiniteQuery({
    queryKey: ["searchPosts", query],
    queryFn: ({ pageParam = null }) =>
      searchPosts(query, {
        cursor: pageParam,
        currentUserId: userId,
        limit: 10,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!query && query.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * 인기 해시태그 훅 - 트렌딩 표시용
 */
export const useTrendingHashtags = (limit = 10) => {
  return useQuery({
    queryKey: ["trendingHashtags", limit],
    queryFn: () => getTrendingHashtags(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * 통합 검색 훅 - 해시태그 검색 제거
 */
export const useUnifiedSearch = (initialQuery = "") => {
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const userId = useUserId();

  // 검색 실행
  const handleSearch = useCallback(
    (newQuery) => {
      setQuery(newQuery);
      if (newQuery.trim().length >= 2) {
        setSearchQuery(newQuery);
        saveRecentSearch(newQuery, activeTab);
        // 커스텀 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("localStorageUpdated", {
            detail: { key: "recentSearches" },
          })
        );
      }
    },
    [activeTab]
  );

  // 탭 변경
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // 검색어 초기화
  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchQuery("");
  }, []);

  // 사용자 검색
  const usersQuery = useQuery({
    queryKey: ["searchUsers", searchQuery],
    queryFn: () =>
      searchUsers(searchQuery, {
        currentUserId: userId,
        limit: 5,
      }),
    enabled:
      !!searchQuery &&
      searchQuery.trim().length >= 2 &&
      (activeTab === "all" || activeTab === "users"),
    staleTime: 30 * 1000,
  });

  // 포스트 검색
  const postsQuery = useInfiniteQuery({
    queryKey: ["searchPosts", searchQuery],
    queryFn: ({ pageParam = null }) =>
      searchPosts(searchQuery, {
        cursor: pageParam,
        currentUserId: userId,
        limit: 10,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:
      !!searchQuery &&
      searchQuery.trim().length >= 2 &&
      (activeTab === "all" || activeTab === "posts"),
    staleTime: 30 * 1000,
  });

  // 로딩 상태
  const isLoading = usersQuery.isLoading || postsQuery.isLoading;

  // 에러 상태
  const hasError = usersQuery.error || postsQuery.error;

  // 결과가 있는지
  const hasResults =
    usersQuery.data?.users?.length > 0 ||
    postsQuery.data?.pages?.[0]?.posts?.length > 0;

  return {
    // States
    query,
    setQuery,
    searchQuery,
    activeTab,

    // Results
    users: usersQuery.data?.users || [],
    posts: postsQuery.data?.pages?.flatMap((page) => page.posts) || [],

    // Query objects
    usersQuery,
    postsQuery,

    // Status
    isLoading,
    hasError,
    hasResults,

    // Actions
    handleSearch,
    handleTabChange,
    clearSearch,

    // Infinite scroll
    fetchNextPosts: postsQuery.fetchNextPage,
    hasNextPosts: postsQuery.hasNextPage,
    isFetchingNextPosts: postsQuery.isFetchingNextPage,
  };
};

/**
 * 최근 검색어 훅
 */
export const useRecentSearches = () => {
  const [searches, setSearches] = useState(getRecentSearches());

  const refresh = useCallback(() => {
    setSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const handleUpdate = (e) => {
      // localStorageUpdated 이벤트일 때만 처리
      if (!e.detail || e.detail.key === "recentSearches") {
        refresh();
      }
    };

    window.addEventListener("storage", refresh); // 다른 탭
    window.addEventListener("localStorageUpdated", handleUpdate); // 같은 탭

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("localStorageUpdated", handleUpdate);
    };
  }, [refresh]);

  // 특정 검색어 삭제
  const remove = useCallback(
    (query, type) => {
      removeRecentSearch(query, type);
      refresh();
    },
    [refresh]
  );

  // 모든 검색어 삭제
  const clear = useCallback(() => {
    clearRecentSearches();
    setSearches([]);
  }, []);

  // 로컬 스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      refresh();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refresh]);

  return {
    searches,
    refresh,
    remove,
    clear,
    hasSearches: searches.length > 0,
  };
};

/**
 * 검색 필터 훅 (향후 확장용)
 */
export const useSearchFilters = () => {
  const [filters, setFilters] = useState({
    sortBy: "recent",
    dateRange: "all",
    hasImage: false,
  });

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      sortBy: "recent",
      dateRange: "all",
      hasImage: false,
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
};

/**
 * 검색 하이라이트 유틸리티
 */
export const useHighlight = (text, query) => {
  if (!query || query.trim().length < 2) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return { text: part, highlighted: true, key: index };
    }
    return { text: part, highlighted: false, key: index };
  });
};
