import supabase from "./supabaseClient";
import { createOrGetHashtags, attachHashtagsToPost } from "./hashtagService";

// 게시글 + 댓글 + 좋아요 캐릭터 + 해시태그 저장 (SAVE)
export async function savePostWithCommentsAndLikes(
  post,
  comments,
  likeCharacters,
  hashtags = []
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // 1. 게시글 저장
  const { data: postData, error: postError } = await supabase
    .from("Post")
    .insert([
      {
        content: post.content,
        mood: post.mood || null, // mood 추가
        like: likeCharacters.length,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (postError) {
    console.error("❌ Post 저장 실패:", postError.message);
    throw postError;
  }

  const postId = postData.id;

  // 2. 댓글 저장
  const commentData = comments.map((c) => ({
    post_id: postId,
    character_id: c.character.id,
    message: c.message,
  }));

  const { error: commentError } = await supabase
    .from("Comment")
    .insert(commentData);

  if (commentError) {
    console.error("❌ 댓글 저장 실패:", commentError.message);
    throw commentError;
  }

  // 3. 좋아요 저장
  const likeData = likeCharacters.map((c) => ({
    post_id: postId,
    character_id: c.id,
  }));

  const { error: likeError } = await supabase
    .from("Post_Like")
    .insert(likeData);

  if (likeError) {
    console.error("❌ 좋아요 저장 실패:", likeError.message);
    throw likeError;
  }

  // 4. 해시태그 저장
  if (hashtags.length > 0) {
    try {
      const hashtagIds = await createOrGetHashtags(hashtags);
      await attachHashtagsToPost(postId, hashtagIds);
    } catch (hashtagError) {
      console.error("❌ 해시태그 저장 실패:", hashtagError.message);
      throw hashtagError;
    }
  }

  // 5. 저장된 전체 데이터를 다시 조회하여 반환
  const { data: savedPost, error: fetchError } = await supabase
    .from("Post")
    .select(
      `
      id,
      content,
      mood,
      like,
      created_at,
      user_id,
      Comment (
        id,
        character_id,
        message,
        created_at,
        Character (
          id,
          name,
          personality,
          avatar_url,
          description,
          prompt_description,
          User_Character (
            affinity
          )
        )
      ),
      Post_Like (
        character_id,
        Character (
          id,
          name,
          personality,
          avatar_url,
          description,
          prompt_description,
          User_Character (
            affinity
          )
        )
      ),
      Post_Hashtag (
        hashtag_id,
        Hashtag (
          id,
          name
        )
      )
    `
    )
    .eq("id", postId)
    .single();

  if (fetchError) {
    console.error("❌ 저장된 포스트 조회 실패:", fetchError.message);
    throw fetchError;
  }

  // 데이터 구조 평탄화 (fetchPostsWithCommentsAndLikes와 동일한 형식)
  const formattedPost = {
    ...savedPost,
    Comment:
      savedPost.Comment?.map((comment) => ({
        id: comment.id,
        character_id: comment.character_id,
        message: comment.message,
        created_at: comment.created_at,
        character: comment.Character?.name || "Unknown",
        personality: comment.Character?.personality || [],
        avatar_url: comment.Character?.avatar_url || null,
        description: comment.Character?.description || "",
        prompt_description: comment.Character?.prompt_description || "",
        affinity: comment.Character?.User_Character[0]?.affinity || 0,
      })) || [],
    Post_Like:
      savedPost.Post_Like?.map((like) => ({
        character_id: like.character_id,
        character: like.Character?.name || "Unknown",
        personality: like.Character?.personality || [],
        avatar_url: like.Character?.avatar_url || null,
        description: like.Character?.description || "",
        prompt_description: like.Character?.prompt_description || "",
        affinity: like.Character?.User_Character[0]?.affinity || 0,
      })) || [],
    Post_Hashtag:
      savedPost.Post_Hashtag?.map((ph) => ({
        hashtag_id: ph.hashtag_id,
        name: ph.Hashtag?.name || "",
      })) || [],
  };

  return formattedPost;
}

// DELETE
export async function deletePostById(postId, uid) {
  if (!uid) throw new Error("user_id가 없습니다.");

  const { error } = await supabase
    .from("Post")
    .delete()
    .eq("id", postId)
    .eq("user_id", uid);

  if (error) {
    console.error("❌ Post 삭제 실패:", error.message);
    throw error;
  }
}

// CURSOR 기반 페이지네이션으로 포스트 가져오기
export async function fetchPostsWithCommentsAndLikes(
  uid,
  { limit = 5, cursor = null } = {}
) {
  if (!uid) throw new Error("user_id가 없습니다.");

  try {
    let query = supabase
      .from("Post")
      .select(
        `
        id,
        content,
        mood,
        like,
        created_at,
        user_id,
        Comment (
          id,
          character_id,
          message,
          created_at,
          Character (
            id,
            name,
            personality,
            avatar_url,
            description,
            prompt_description,
            User_Character (
            affinity
            )
          )
        ),
        Post_Like (
          character_id,
          Character (
            id,
            name,
            personality,
            avatar_url,
            description,
            prompt_description,
            User_Character (
            affinity
            )
          )
        ),
        Post_Hashtag (
          hashtag_id,
          Hashtag (
            id,
            name
          )
        )
      `
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }) // created_at이 같을 경우를 위한 2차 정렬
      .limit(limit + 1); // hasMore 확인을 위해 1개 더 가져옴

    // cursor가 있으면 해당 지점부터 시작
    if (cursor) {
      // cursor는 { created_at, id } 형태의 객체
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 불러오기 실패:", error.message);
      throw error;
    }

    // hasMore 판단 및 실제 반환할 데이터 준비
    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, -1) : data; // 마지막 1개 제거

    // 다음 cursor 준비
    const nextCursor =
      posts.length > 0
        ? {
            created_at: posts[posts.length - 1].created_at,
            id: posts[posts.length - 1].id,
          }
        : null;

    // 데이터 구조 평탄화
    const formattedData = posts.map((post) => ({
      ...post,
      Comment:
        post.Comment?.map((comment) => ({
          id: comment.id,
          character_id: comment.character_id,
          message: comment.message,
          created_at: comment.created_at,
          character: comment.Character?.name || "Unknown",
          personality: comment.Character?.personality || [],
          avatar_url: comment.Character?.avatar_url || null,
          description: comment.Character?.description || "",
          prompt_description: comment.Character?.prompt_description || "",
          affinity: comment.Character?.User_Character[0]?.affinity || 0,
        })) || [],
      Post_Like:
        post.Post_Like?.map((like) => ({
          character_id: like.character_id,
          character: like.Character?.name || "Unknown",
          personality: like.Character?.personality || [],
          avatar_url: like.Character?.avatar_url || null,
          description: like.Character?.description || "",
          prompt_description: like.Character?.prompt_description || "",
          affinity: like.Character?.User_Character[0]?.affinity || 0,
        })) || [],
      Post_Hashtag:
        post.Post_Hashtag?.map((ph) => ({
          hashtag_id: ph.hashtag_id,
          name: ph.Hashtag?.name || "",
        })) || [],
    }));

    return {
      posts: formattedData,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("Error in fetchPostsWithCommentsAndLikes:", error);
    throw error;
  }
}
