// src/pages/Search/SearchResults.jsx - 해시태그 검색 제거 버전
import { useState } from "react";
import UserSearchItem from "./UserSearchItem";
import PostSearchItem from "./PostSearchItem";
import { Users, FileText } from "lucide-react";

const SearchResults = ({ query, activeTab, users = [], posts = [] }) => {
  const [expandedUsers, setExpandedUsers] = useState(false);

  // 하이라이트 텍스트 렌더링
  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return (
          <mark
            key={index}
            className="bg-yellow-200 text-stone-900 px-0.5 rounded"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // All 탭 렌더링
  if (activeTab === "all") {
    const hasUsers = users.length > 0;
    const hasPosts = posts.length > 0;

    // 표시할 사용자 수 (확장 시 전체, 기본 3개)
    const displayUsers = expandedUsers ? users : users.slice(0, 3);

    return (
      <div className="search-results-container">
        {/* Users Section */}
        {hasUsers && (
          <div className="section-container mb-6">
            <div className="section-header flex items-center justify-between px-6 py-3 bg-stone-50">
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
                <span className="text-xs text-stone-500">({users.length})</span>
              </h3>
              {users.length > 3 && (
                <button
                  onClick={() => setExpandedUsers(!expandedUsers)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {expandedUsers ? "Show less" : `Show all ${users.length}`}
                </button>
              )}
            </div>
            <div className="divide-y divide-stone-100">
              {displayUsers.map((user) => (
                <UserSearchItem
                  key={user.id}
                  user={user}
                  query={query}
                  highlightText={highlightText}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts Section */}
        {hasPosts && (
          <div className="section-container mb-6">
            <div className="section-header flex items-center justify-between px-6 py-3 bg-stone-50">
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Posts
                <span className="text-xs text-stone-500">({posts.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-stone-100">
              {posts.slice(0, 5).map((post, index) => (
                <PostSearchItem
                  key={post.id}
                  post={post}
                  query={query}
                  highlightText={highlightText}
                  animationDelay={index * 50}
                />
              ))}
            </div>
            {posts.length > 5 && (
              <div className="px-6 py-3 bg-stone-50 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all {posts.length} posts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Users 탭
  if (activeTab === "users") {
    return (
      <div className="search-results-container">
        <div className="divide-y divide-stone-100">
          {users.map((user) => (
            <UserSearchItem
              key={user.id}
              user={user}
              query={query}
              highlightText={highlightText}
            />
          ))}
        </div>
      </div>
    );
  }

  // Posts 탭
  if (activeTab === "posts") {
    return (
      <div className="search-results-container">
        <div className="divide-y divide-stone-100">
          {posts.map((post) => (
            <PostSearchItem
              key={post.id}
              post={post}
              query={query}
              highlightText={highlightText}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SearchResults;
