import supabase from "./supabaseClient";
import useCharacterStore from "../stores/characterStore";
import { createOrGetHashtags, attachHashtagsToPost } from "./hashtagService";

// ===================== 날짜 유틸리티 =====================
function formatDateKey(date) {
  // UTC가 아닌 로컬 시간 기준으로 처리
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ===================== Home용 데이터 조회 =====================

// 최근 3개월 포스트 조회 (Home 메인용)
export async function getRecentPosts(userId) {
  if (!userId) throw new Error("user_id가 없습니다.");

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    const { data, error } = await supabase
      .from("Post")
      .select(
        `
        id,
        content,
        mood,
        entry_date,
        created_at,
        updated_at,
        user_id,
        ai_generated,
        character_id,
        Comment (
          id,
          character_id,
          message,
          created_at,
          Character (
            name,
            korean_name,
            avatar_url
          )
        ),
        Post_Hashtag (
          hashtag_id,
          Hashtag (
            name
          )
        ),
        Character (
          name,
          korean_name,
          avatar_url
        ),
        User_Profile (
          display_name
        )
      `
      )
      .eq("user_id", userId)
      .gte("entry_date", threeMonthsAgo.toISOString())
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 날짜별로 그룹핑
    const groupedEntries = {};

    data.forEach((post) => {
      const dateKey = formatDateKey(post.entry_date || post.created_at);

      if (!groupedEntries[dateKey]) {
        groupedEntries[dateKey] = [];
      }

      groupedEntries[dateKey].push(formatPostForHome(post));
    });

    return {
      entries: groupedEntries,
      totalCount: data.length,
    };
  } catch (error) {
    console.error("Error in getRecentPosts:", error);
    throw error;
  }
}

// 추가 날짜 범위 데이터 로드 (스크롤/네비게이션시)
export async function loadPostsByDateRange(userId, startDate, endDate) {
  if (!userId) throw new Error("user_id가 없습니다.");

  try {
    const { data, error } = await supabase
      .from("Post")
      .select(
        `
        id,
        content,
        mood,
        entry_date,
        created_at,
        updated_at,
        user_id,
        ai_generated,
        character_id,
        Comment (
          id,
          character_id,
          message,
          created_at,
          Character (
            name,
            korean_name,
            avatar_url
          )
        ),
        Post_Hashtag (
          hashtag_id,
          Hashtag (
            name
          )
        ),
        Character (
          name,
          korean_name,
          avatar_url
        ),
        User_Profile (
          display_name
        )
      `
      )
      .eq("user_id", userId)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 날짜별로 그룹핑
    const groupedEntries = {};

    data.forEach((post) => {
      const dateKey = formatDateKey(post.entry_date || post.created_at);

      if (!groupedEntries[dateKey]) {
        groupedEntries[dateKey] = [];
      }

      groupedEntries[dateKey].push(formatPostForHome(post));
    });

    return {
      entries: groupedEntries,
      totalCount: data.length,
    };
  } catch (error) {
    console.error("Error in loadPostsByDateRange:", error);
    throw error;
  }
}

// ===================== 데이터 포맷팅 =====================

function formatPostForHome(post) {
  return {
    id: post.id,
    content: post.content,
    mood: post.mood,
    entryDate: post.entry_date || post.created_at,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    isAIGenerated: post.ai_generated,

    // AI가 작성한 경우 캐릭터 정보
    aiCharacter:
      post.ai_generated && post.Character
        ? {
            name: post.Character.name,
            koreanName: post.Character.korean_name,
            avatarUrl: post.Character.avatar_url,
          }
        : null,

    // 사용자 정보
    author: post.ai_generated
      ? post.Character?.name || "AI"
      : post.User_Profile?.display_name || "Me",

    // AI 리플렉션 (댓글)
    aiReflections:
      post.Comment?.filter((c) => c.character_id) // AI 댓글만
        ?.map((comment) => ({
          id: comment.id,
          message: comment.message,
          createdAt: comment.created_at,
          character: {
            name: comment.Character?.name || "AI Friend",
            koreanName: comment.Character?.korean_name,
            avatarUrl: comment.Character?.avatar_url,
          },
        })) || [],

    // 해시태그
    hashtags:
      post.Post_Hashtag?.map((ph) => ph.Hashtag?.name).filter(Boolean) || [],
  };
}

export async function createPostImmediate(post, userId) {
  if (!userId) throw new Error("user_id가 없습니다.");

  try {
    // 1. Post 저장 - allowAIComments 추가
    const { data: postData, error: postError } = await supabase
      .from("Post")
      .insert([
        {
          content: post.content,
          mood: post.mood || null,
          visibility: post.visibility || "private",
          allow_ai_comments: post.allowAIComments !== false, // 기본값 true
          like: 0,
          user_id: userId,
        },
      ])
      .select(
        `
        id,
        content,
        mood,
        visibility,
        allow_ai_comments,
        like,
        created_at,
        updated_at,
        user_id
      `
      )
      .single();

    if (postError) {
      console.error("❌ Post 저장 실패:", postError.message);
      throw postError;
    }

    const postId = postData.id;

    // 2. 해시태그 저장
    let savedHashtags = [];
    if (post.hashtags && post.hashtags.length > 0) {
      try {
        const hashtagIds = await createOrGetHashtags(post.hashtags);
        await attachHashtagsToPost(postId, hashtagIds);

        const { data: hashtagData } = await supabase
          .from("Post_Hashtag")
          .select(
            `
            hashtag_id,
            Hashtag (
              id,
              name
            )
          `
          )
          .eq("post_id", postId);

        savedHashtags =
          hashtagData?.map((ph) => ({
            hashtag_id: ph.hashtag_id,
            name: ph.Hashtag?.name || "",
          })) || [];
      } catch (hashtagError) {
        console.error("❌ 해시태그 저장 실패:", hashtagError.message);
      }
    }

    // 3. 조건부 Edge Function 호출 - AI 댓글이 허용된 경우에만
    if (post.allowAIComments !== false) {
      console.log("🤖 AI 댓글 처리 시작 (allow_ai_comments: true)");

      triggerAIProcessing(
        postId,
        post.content,
        post.hashtags,
        post.mood,
        post.visibility,
        post.allowAIComments,
        userId
      )
        .then(() => console.log("✅ AI 처리 시작됨"))
        .catch((error) => console.error("❌ AI 처리 트리거 실패:", error));
    } else {
      console.log("🚫 AI 댓글 비활성화됨 (allow_ai_comments: false)");
    }

    // 4. 완성된 Post 반환
    const formattedPost = {
      ...postData,
      visibility: postData.visibility || "private",
      allow_ai_comments: postData.allow_ai_comments,
      Comment: [],
      Post_Like: [],
      Post_Hashtag: savedHashtags,
    };

    return formattedPost;
  } catch (error) {
    console.error("Error in createPostImmediate:", error);
    throw error;
  }
}

async function triggerAIProcessing(
  postId,
  content,
  hashtags,
  mood,
  visibility,
  allowAIComments,
  userId
) {
  try {
    // 팔로우한 캐릭터 체크 추가
    const { followedCharacterIds } = useCharacterStore.getState();
    if (followedCharacterIds.size === 0) {
      console.log("⚡ No followed characters - skipping AI processing");
      return { skipped: true, reason: "no_followed_characters" };
    }

    const { data, error } = await supabase.functions.invoke("process-post-ai", {
      body: {
        postId,
        content,
        hashtags: hashtags || [],
        mood: mood || null,
        visibility: visibility || "private",
        allowAIComments: allowAIComments !== false, // 명시적으로 전달
        userId: userId,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Edge Function 호출 실패:", error);
    throw error;
  }
}
