// src/services/searchService.js - 해시태그 검색 제거 버전
import supabase from "./supabaseClient";

/**
 * 사용자 검색
 * @param {string} query - 검색어
 * @param {number} limit - 결과 제한
 * @param {number} offset - 오프셋 (페이지네이션)
 * @param {string} currentUserId - 현재 사용자 ID (제외용)
 */
export async function searchUsers(
  query,
  { limit = 10, offset = 0, currentUserId = null } = {}
) {
  if (!query || query.trim().length < 2) {
    return { users: [], total: 0 };
  }

  try {
    let queryBuilder = supabase
      .from("User_Profile")
      .select("*", { count: "exact" })
      .ilike("display_name", `%${query}%`);

    // 본인 제외
    if (currentUserId) {
      queryBuilder = queryBuilder.neq("id", currentUserId);
    }

    const { data, error, count } = await queryBuilder
      .order("display_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("❌ 사용자 검색 실패:", error.message);
      throw error;
    }

    return {
      users: data || [],
      total: count || 0,
      hasMore: count > offset + limit,
    };
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
}

/**
 * Public 포스트 검색 - 콘텐츠만 검색
 * @param {string} query - 검색어
 * @param {Object} options - 검색 옵션
 */
export async function searchPosts(query, { limit = 10, cursor = null } = {}) {
  if (!query || query.trim().length < 2) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  try {
    // RPC 함수 호출 - cursor 파라미터 수정
    const { data, error } = await supabase.rpc("search_posts_with_counts", {
      search_query: query,
      result_limit: limit,
      cursor_created_at: cursor?.created_at || null,
      cursor_id: cursor?.id || null,
    });

    if (error) {
      console.error("❌ 포스트 검색 실패:", error.message);
      throw error;
    }

    // 데이터가 없는 경우 처리
    if (!data || data.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    // 페이지네이션 처리
    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, limit) : data;

    // 다음 커서 생성
    const nextCursor =
      posts.length > 0 && hasMore
        ? {
            created_at: posts[posts.length - 1].created_at,
            id: posts[posts.length - 1].id,
          }
        : null;

    // 포스트 데이터 포맷팅
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      mood: post.mood,
      visibility: post.visibility,
      allow_ai_comments: post.allow_ai_comments,
      like: post.like,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_id: post.user_id,
      User_Profile: {
        id: post.user_id,
        display_name: post.user_display_name,
      },
      commentCount: Number(post.comment_count) || 0,
      likeCount: Number(post.like_count) || 0,
      hashtags: post.hashtags || [],
    }));

    return {
      posts: formattedPosts,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("Error searching posts:", error);
    throw error;
  }
}

/**
 * 인기 해시태그 가져오기 - 트렌딩 표시용
 * @param {number} limit - 가져올 개수
 */
export async function getTrendingHashtags(limit = 10, days = 7) {
  try {
    const { data, error } = await supabase.rpc("get_trending_hashtags", {
      day_range: days,
      result_limit: limit,
    });

    if (error) {
      console.error("❌ 인기 해시태그 가져오기 실패:", error.message);
      throw error;
    }

    // data가 null이거나 빈 배열인 경우 처리
    return data || [];
  } catch (error) {
    console.error("Error getting trending hashtags:", error);
    throw error;
  }
}

/**
 * 최근 검색어 저장 (로컬 스토리지)
 * @param {string} query - 검색어
 * @param {string} type - 검색 타입 (users, posts, all)
 */
export function saveRecentSearch(query, type = "all") {
  if (!query || query.trim().length < 2) return;

  const recentSearches = getRecentSearches();

  // 중복 제거
  const filtered = recentSearches.filter(
    (item) => !(item.query === query && item.type === type)
  );

  // 새 검색어를 맨 앞에 추가
  const newSearches = [
    { query, type, timestamp: Date.now() },
    ...filtered,
  ].slice(0, 10); // 최대 10개 유지

  localStorage.setItem("recentSearches", JSON.stringify(newSearches));
}

/**
 * 최근 검색어 가져오기
 */
export function getRecentSearches() {
  try {
    const stored = localStorage.getItem("recentSearches");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 최근 검색어 삭제
 */
export function clearRecentSearches() {
  localStorage.removeItem("recentSearches");
}

/**
 * 특정 검색어 삭제
 */
export function removeRecentSearch(query, type) {
  const recentSearches = getRecentSearches();
  const filtered = recentSearches.filter(
    (item) => !(item.query === query && item.type === type)
  );
  localStorage.setItem("recentSearches", JSON.stringify(filtered));
}
