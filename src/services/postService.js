// services/postService.js
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

// 월별 포스트 조회 (새로 추가)
export async function getMonthlyPosts(userId, startDate, endDate) {
  if (!userId) throw new Error("user_id가 없습니다.");

  try {
    const { data, error } = await supabase
      .from("Post")
      .select(
        `
       id,
       content,
       mood,
       allow_ai_comments,
       ai_processing_status,
       entry_date,
       created_at,
       updated_at,
       user_id,
       character_id,
       Comment (
         id,
         character_id,
         message,
         created_at,
         Character (
           name,
           korean_name,
           description,
           korean_description,
           avatar_url,
           personality,
           User_Character!inner (
              affinity
           )
         )
       ),
       Post_Hashtag (
         hashtag_id,
         Hashtag (
           name
         )
       )
     `
      )
      .eq("user_id", userId)
      .eq("Comment.Character.User_Character.user_id", userId)
      .gte("entry_date", startDate.split("T")[0])
      .lte("entry_date", endDate.split("T")[0])
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 날짜별로 그룹핑
    const groupedEntries = {};

    data.forEach((post) => {
      const dateKey = post.entry_date || formatDateKey(post.created_at);

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
    console.error("Error in getMonthlyPosts:", error);
    throw error;
  }
}

// ===================== 단일 포스트 전체 데이터 fetch (AI 댓글 포함) =====================
export async function fetchSinglePost(postId, userId) {
  const { data, error } = await supabase
    .from("Post")
    .select(
      `
      id,
      content,
      mood,
      allow_ai_comments,
      ai_processing_status,
      entry_date,
      created_at,
      updated_at,
      user_id,
      Comment (
        id,
        character_id,
        message,
        created_at,
        Character (
          name,
          korean_name,
          description,
          korean_description,
          personality,
          avatar_url,
          User_Character!inner (
              affinity
          )
        )
      ),
      Post_Hashtag (
        hashtag_id,
        Hashtag (
          name
        )
      )
    `
    )
    .eq("id", postId)
    .eq("Comment.Character.User_Character.user_id", userId)
    .single();

  if (error) throw error;

  // formatPostForHome 형식으로 반환
  return formatPostForHome(data);
}

// ===================== 데이터 생성 =====================
export async function createPostImmediate(post, userId) {
  if (!userId) throw new Error("user_id가 없습니다.");

  try {
    // 1. Post 저장 - entry_date 파라미터로 받기
    const { data: postData, error: postError } = await supabase
      .from("Post")
      .insert([
        {
          content: post.content,
          mood: post.mood || null,
          visibility: post.visibility || "private",
          allow_ai_comments: post.allowAIComments !== false, // 기본값 true
          like: 0,
          ai_processing_status: post.allowAIComments
            ? "not_started"
            : "fetched",
          user_id: userId,
          entry_date: post.entry_date
            ? post.entry_date.split("T")[0] // ISO string에서 날짜만 추출
            : new Date().toISOString().split("T")[0],
        },
      ])
      .select(
        `
       id,
       content,
       mood,
       visibility,
       ai_processing_status,
       allow_ai_comments,
       like,
       entry_date,
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
            Hashtag: {
              name: ph.Hashtag?.name || "",
            },
          })) || [];
      } catch (hashtagError) {
        console.error("❌ 해시태그 저장 실패:", hashtagError.message);
      }
    }

    // 4. formatPostForHome 형식으로 데이터 구성
    const formattedPost = formatPostForHome({
      ...postData,
      character_id: null,
      Comment: [], // 아직 댓글 없음
      Post_Hashtag: savedHashtags,
      Character: null, // AI 캐릭터 아님
    });

    // 5. 조건부 Edge Function 호출 - AI 댓글이 허용된 경우에만
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

    // 6. formatPostForHome 형식으로 반환
    return formattedPost;
  } catch (error) {
    console.error("Error in createPostImmediate:", error);
    throw error;
  }
}

// ===================== AI 프로세싱 =====================
export async function updatePostAIProcessingStatus(postId, status) {
  try {
    // 유효한 상태값 체크
    const validStatuses = ["not_started", "completed", "fetched"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const { error } = await supabase
      .from("Post")
      .update({ ai_processing_status: status })
      .eq("id", postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Failed to update post status to ${status}:`, error);
    throw error;
  }
}

// ===================== AI 프로세싱 =====================
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

// ===================== 데이터 포맷팅 =====================
function formatPostForHome(post) {
  return {
    id: post.id,
    content: post.content,
    mood: post.mood,
    entryDate: post.entry_date || post.created_at.split("T")[0],
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    allowAIComments: post.allow_ai_comments,
    aiProcessingStatus: post.ai_processing_status,

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
            description: comment.Character?.description,
            korean_description: comment.Character?.korean_description,
            affinity: comment.Character?.User_Character[0]?.affinity || 0,
            avatarUrl: comment.Character?.avatar_url,
            personality: comment.Character?.personality || [],
          },
        })) || [],

    // 해시태그
    hashtags:
      post.Post_Hashtag?.map((ph) => ph.Hashtag?.name).filter(Boolean) || [],
  };
}
