// src/pages/Search/Search.jsx - 탭 전환 시 스크롤 초기화 버전
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search as SearchIcon,
  X,
  Users,
  FileText,
  Hash as HashIcon,
  TrendingUp,
  Clock,
  Loader,
} from "lucide-react";
import {
  useUnifiedSearch,
  useRecentSearches,
  useTrendingHashtags,
} from "../../components/hooks/useSearch";
import SearchResults from "./SearchResults";
import "./Search.css";

const Search = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const {
    query,
    setQuery,
    searchQuery,
    activeTab,
    users,
    posts,
    isLoading,
    hasResults,
    handleSearch,
    handleTabChange: originalHandleTabChange,
    clearSearch,
    fetchNextPosts,
    hasNextPosts,
    isFetchingNextPosts,
  } = useUnifiedSearch();

  const {
    searches: recentSearches,
    remove: removeRecentSearch,
    clear: clearRecentSearches,
    hasSearches,
  } = useRecentSearches();

  const { data: trendingHashtags, isLoading: loadingTrending } =
    useTrendingHashtags(5);

  // 탭 변경 핸들러 - 스크롤 초기화 추가
  const handleTabChange = useCallback(
    (tab) => {
      // 원래의 탭 변경 함수 호출
      originalHandleTabChange(tab);

      // 스크롤을 최상단으로 이동
      requestAnimationFrame(() => {
        window.scrollTo(0, 0); // smooth 제거하고 즉시 이동
      });
    },
    [originalHandleTabChange]
  );

  // 검색창 포커스 시 제안 표시
  useEffect(() => {
    setShowSuggestions(isFocused && !searchQuery);
  }, [isFocused, searchQuery]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsFocused(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 입력 핸들러
  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  // Enter 키 핸들러 - 검색 시에도 스크롤 초기화
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim().length >= 2) {
        handleSearch(query);
        setShowSuggestions(false);
        // 새로운 검색 시 스크롤 초기화
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  };

  // 최근 검색어 클릭 - 스크롤 초기화 추가
  const handleRecentSearchClick = useCallback(
    (searchItem) => {
      setQuery(searchItem.query);
      handleSearch(searchItem.query);
      if (searchItem.type !== "all") {
        originalHandleTabChange(searchItem.type);
      }
      setShowSuggestions(false);
      // 최근 검색어 클릭 시 스크롤 초기화
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    [handleSearch, originalHandleTabChange, setQuery]
  );

  // 트렌딩 해시태그 클릭 - 스크롤 초기화 추가
  const handleTrendingClick = useCallback(
    (hashtag) => {
      const searchTerm = hashtag.name; // # 없이 검색
      setQuery(searchTerm);
      handleSearch(searchTerm);
      originalHandleTabChange("posts"); // Posts 탭으로 이동
      setShowSuggestions(false);
      // 트렌딩 클릭 시 스크롤 초기화
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    [handleSearch, originalHandleTabChange, setQuery]
  );

  // 검색어 지우기
  const handleClear = () => {
    clearSearch();
    searchInputRef.current?.focus();
  };

  // Intersection Observer for infinite scroll
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPosts && !isFetchingNextPosts) {
        fetchNextPosts();
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPosts, isFetchingNextPosts, fetchNextPosts]);

  // 탭 아이템 설정
  const tabs = [
    { id: "all", label: "All", icon: null },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
  ];

  // 결과 카운트
  const resultCounts = {
    users: users.length,
    posts: posts.length,
    all: users.length + posts.length,
  };

  return (
    <div className="search-page min-h-screen bg-white">
      {/* 검색 헤더 */}
      <div className="search-header sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto">
          {/* 검색 입력창 */}
          <div ref={searchContainerRef} className="px-4 py-3">
            <div className="relative">
              <div
                className={`search-input-container flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-2xl transition-all duration-200 ${
                  isFocused ? "ring-2 ring-stone-900 bg-white" : ""
                }`}
              >
                <SearchIcon className="w-5 h-5 text-stone-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    setIsFocused(true);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search users or posts..."
                  className="flex-1 bg-transparent outline-none text-stone-900 placeholder-stone-400"
                />
                {query && (
                  <button
                    onClick={handleClear}
                    className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                )}
              </div>

              {/* 검색 제안 드롭다운 */}
              {showSuggestions && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-50">
                  {/* 최근 검색어 */}
                  {hasSearches && (
                    <div className="p-3 border-b border-stone-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-stone-700">
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.slice(0, 5).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between group"
                          >
                            <button
                              onClick={() => handleRecentSearchClick(item)}
                              className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-left"
                            >
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span className="text-sm text-stone-700">
                                {item.query}
                              </span>
                              {item.type !== "all" && (
                                <span className="text-xs text-stone-400">
                                  in {item.type}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                removeRecentSearch(item.query, item.type)
                              }
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-stone-100 rounded transition-all"
                            >
                              <X className="w-3 h-3 text-stone-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 트렌딩 해시태그 */}
                  {!loadingTrending && trendingHashtags?.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Trending Topics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trendingHashtags.map((hashtag, index) => (
                          <button
                            key={index}
                            onClick={() => handleTrendingClick(hashtag)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-full text-sm transition-colors"
                          >
                            <HashIcon className="w-3 h-3" />
                            {hashtag.name}
                            <span className="text-xs text-stone-400">
                              ({hashtag.count})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 빈 상태 */}
                  {!hasSearches &&
                    (!trendingHashtags || trendingHashtags.length === 0) && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-stone-500">
                          Type and press Enter to search
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* 탭 네비게이션 */}
          {searchQuery && (
            <div className="px-4 pb-3 mt-1.5">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const count = resultCounts[tab.id];
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span className="text-sm font-medium">{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.id
                              ? "bg-white/20"
                              : "bg-stone-200"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 영역 */}
      <div className="search-content max-w-2xl mx-auto">
        {searchQuery ? (
          <>
            {isLoading ? (
              // 로딩 상태
              <div className="flex items-center justify-center py-20">
                <Loader className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : hasResults ? (
              // 검색 결과
              <SearchResults
                query={searchQuery}
                activeTab={activeTab}
                users={users}
                posts={posts}
              />
            ) : (
              // 결과 없음
              <div className="text-center py-20 px-6">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-medium text-stone-900 mb-2">
                  No results found
                </h3>
                <p className="text-sm text-stone-500">
                  Try searching with different keywords
                </p>
              </div>
            )}

            {/* Infinite scroll trigger */}
            {activeTab !== "users" && (
              <div ref={loadMoreRef} className="h-10" />
            )}

            {/* Loading more indicator */}
            {isFetchingNextPosts && (
              <div className="flex justify-center py-4">
                <Loader className="w-5 h-5 animate-spin text-stone-400" />
              </div>
            )}
          </>
        ) : (
          // 초기 상태
          <div className="py-20 px-6">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-10 h-10 text-stone-500" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">
                Discover DiaryFriend
              </h2>
              <p className="text-stone-500 text-sm">
                Search for users and posts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
