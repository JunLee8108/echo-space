import supabase from "./supabaseClient";
import { createOrGetHashtags, attachHashtagsToPost } from "./hashtagService";
import { deletePostImages, cleanupUnusedImages } from "./imageService";

// 사용자 댓글 추가 함수
export async function addUserComment(postId, userId, message) {
  if (!userId) throw new Error("user_id가 없습니다.");
  if (!postId) throw new Error("post_id가 없습니다.");
  if (!message || message.trim() === "")
    throw new Error("댓글 내용이 없습니다.");

  try {
    // 1. 댓글 저장
    const { data: commentData, error: commentError } = await supabase
      .from("Comment")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          message: message.trim(),
          like: 0,
        },
      ])
      .select(
        `
        id,
        user_id,
        message,
        like,
        created_at,
        User_Profile (
          id,
          display_name
        )
      `
      )
      .single();

    if (commentError) {
      console.error("❌ 사용자 댓글 저장 실패:", commentError.message);
      throw commentError;
    }

    // 2. 포맷팅된 댓글 반환
    const formattedComment = {
      id: commentData.id,
      character_id: null,
      user_id: commentData.user_id,
      message: commentData.message,
      like: commentData.like || 0,
      created_at: commentData.created_at,
      isUserComment: true,
      character: commentData.User_Profile?.display_name || "User",
      avatar_url: null,
      personality: [],
      description: "",
      prompt_description: "",
      affinity: null,
      isLikedByUser: false,
      User_Profile: commentData.User_Profile,
    };

    return formattedComment;
  } catch (error) {
    console.error("❌ addUserComment 실패:", error);
    throw error;
  }
}

// UPDATE POST - visibility 추가
export async function updatePost(
  postId,
  { content, mood, hashtags, visibility, userId }
) {
  if (!userId) throw new Error("user_id가 없습니다.");
  if (!postId) throw new Error("post_id가 없습니다.");

  try {
    // 1. 기존 포스트 내용 가져오기 (이미지 정리를 위해)
    const { data: oldPost, error: fetchError } = await supabase
      .from("Post")
      .select("content")
      .eq("id", postId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("❌ 기존 포스트 조회 실패:", fetchError.message);
      throw fetchError;
    }

    // 2. 포스트 내용 업데이트 - visibility 추가
    const { error: updateError } = await supabase
      .from("Post")
      .update({
        content,
        mood: mood || null,
        visibility: visibility || "private", // ✅ visibility 추가
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Post 업데이트 실패:", updateError.message);
      throw updateError;
    }

    // 3. 사용하지 않는 이미지 정리 (비동기로 처리)
    if (oldPost?.content && oldPost.content !== content) {
      cleanupUnusedImages(oldPost.content, content, userId)
        .then(() => console.log("✅ 사용하지 않는 이미지 정리 완료"))
        .catch((error) => console.error("⚠️ 이미지 정리 중 오류:", error));
    }

    // 4. 기존 해시태그 연결 삭제
    const { error: deleteHashtagError } = await supabase
      .from("Post_Hashtag")
      .delete()
      .eq("post_id", postId);

    if (deleteHashtagError) {
      console.error("❌ 기존 해시태그 삭제 실패:", deleteHashtagError.message);
      throw deleteHashtagError;
    }

    // 5. 새로운 해시태그 추가
    if (hashtags && hashtags.length > 0) {
      try {
        const hashtagIds = await createOrGetHashtags(hashtags);
        await attachHashtagsToPost(postId, hashtagIds);
      } catch (hashtagError) {
        console.error("❌ 해시태그 저장 실패:", hashtagError.message);
        throw hashtagError;
      }
    }

    // 6. 업데이트된 전체 데이터를 다시 조회하여 반환 - visibility 포함
    const { data: fullPost, error: fetchError2 } = await supabase
      .from("Post")
      .select(
        `
        id,
        content,
        mood,
        visibility,
        like,
        ai_generated,
        character_id,
        created_at,
        updated_at,
        user_id,
        Comment (
          id,
          character_id,
          user_id,
          message,
          like,
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
          ),
          User_Profile (
            id,
            display_name
          ),
          Comment_Like (
            user_id,
            is_active
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
        ),
        Character (
          name,
          avatar_url,
          description,
          personality,
          User_Character (
            affinity
          )
        ),
        User_Profile (
          display_name
        )
      `
      )
      .eq("id", postId)
      .single();

    if (fetchError2) {
      console.error("❌ 업데이트된 포스트 조회 실패:", fetchError2.message);
      throw fetchError2;
    }

    // 데이터 구조 평탄화
    const formattedPost = formatPostData(fullPost, userId);

    return formattedPost;
  } catch (error) {
    console.error("Error in updatePost:", error);
    throw error;
  }
}

// DELETE
export async function deletePostById(postId, uid) {
  if (!uid) throw new Error("user_id가 없습니다.");

  try {
    // 1. 삭제하기 전에 포스트 내용을 먼저 가져오기 (이미지 URL 추출을 위해)
    const { data: postData, error: fetchError } = await supabase
      .from("Post")
      .select("content")
      .eq("id", postId)
      .eq("user_id", uid)
      .single();

    if (fetchError) {
      console.error("❌ Post 조회 실패:", fetchError.message);
      throw fetchError;
    }

    // 2. 포스트가 존재하고 content가 있는 경우
    if (postData && postData.content) {
      try {
        // content에서 Supabase Storage URL 추출 및 삭제
        await deletePostImages(postData.content, uid);
        console.log("✅ 포스트 이미지 삭제 완료");
      } catch (imageError) {
        console.error("⚠️ 이미지 삭제 중 오류 발생:", imageError);
      }
    }

    // 3. 포스트 삭제 (CASCADE로 Comment, Post_Like, Post_Hashtag도 자동 삭제)
    const { error } = await supabase
      .from("Post")
      .delete()
      .eq("id", postId)
      .eq("user_id", uid);

    if (error) {
      console.error("❌ Post 삭제 실패:", error.message);
      throw error;
    }

    console.log(`✅ Post ${postId} 삭제 완료`);
  } catch (error) {
    console.error("❌ deletePostById 실패:", error);
    throw error;
  }
}

// 댓글 좋아요 토글
export async function toggleCommentLike(commentId, userId) {
  if (!userId) throw new Error("user_id가 없습니다.");
  if (!commentId) throw new Error("comment_id가 없습니다.");

  try {
    const { data, error } = await supabase.rpc(
      "toggle_comment_like_and_update_affinity",
      {
        p_comment_id: commentId,
        p_user_id: userId,
      }
    );

    if (error) {
      console.error("❌ 댓글 좋아요 토글 RPC 실패:", error.message);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(data[0]);
      return data[0];
    }

    throw new Error("서버로부터 유효한 응답을 받지 못했습니다.");
  } catch (error) {
    console.error("❌ toggleCommentLike 실패:", error);
    throw error;
  }
}

// FETCH POSTS - visibility 처리 추가
export async function fetchPostsWithCommentsAndLikes(
  uid,
  { limit = 5, cursor = null, includePublic = true } = {}
) {
  if (!uid) throw new Error("user_id가 없습니다.");

  try {
    let query = supabase.from("Post").select(
      `
        id,
        content,
        mood,
        visibility,
        like,
        ai_generated,
        character_id,
        created_at,
        updated_at,
        user_id,
        Comment (
          id,
          character_id,
          user_id,
          message,
          like,
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
          ),
          User_Profile (
            id,
            display_name
          ),
          Comment_Like (
            user_id,
            is_active
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
        ),
        Character (
          name,
          avatar_url,
          description,
          personality,
          User_Character (
            affinity
          )
        ),
        User_Profile (
          display_name
        )
      `
    );

    // ✅ visibility 조건 추가: 내 포스트 + public 포스트
    if (includePublic) {
      query = query.or(`user_id.eq.${uid},visibility.eq.public`);
    } else {
      query = query.eq("user_id", uid);
    }

    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 불러오기 실패:", error.message);
      throw error;
    }

    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, -1) : data;

    const nextCursor =
      posts.length > 0
        ? {
            created_at: posts[posts.length - 1].created_at,
            id: posts[posts.length - 1].id,
          }
        : null;

    // 데이터 구조 평탄화
    const formattedData = posts.map((post) => formatPostData(post, uid));

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

// 포스트 데이터 포맷팅 헬퍼 함수 - visibility 추가
function formatPostData(post, userId) {
  return {
    ...post,
    visibility: post.visibility || "private", // ✅ visibility 추가
    Comment:
      post.Comment?.map((comment) => ({
        id: comment.id,
        character_id: comment.character_id,
        user_id: comment.user_id,
        message: comment.message,
        like: comment.like || 0,
        created_at: comment.created_at,
        // AI 댓글인 경우
        ...(comment.character_id && {
          character: comment.Character?.name || "Unknown",
          personality: comment.Character?.personality || [],
          avatar_url: comment.Character?.avatar_url || null,
          description: comment.Character?.description || "",
          prompt_description: comment.Character?.prompt_description || "",
          affinity: comment.Character?.User_Character[0]?.affinity || 0,
        }),
        // 사용자 댓글인 경우
        ...(comment.user_id && {
          isUserComment: true,
          character: comment.User_Profile?.display_name || "User",
          avatar_url: null,
          personality: [],
          description: "",
          prompt_description: "",
          affinity: null,
        }),
        // 현재 사용자가 좋아요를 눌렀는지 확인
        isLikedByUser:
          comment.Comment_Like?.some((like) => {
            return like.user_id === userId && like.is_active === true;
          }) || false,
        User_Profile: comment.User_Profile,
      }))?.sort((a, b) => {
        if (b.like !== a.like) {
          return b.like - a.like;
        }
        return a.id - b.id;
      }) || [],
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
  };
}

// Edge Function 호출 함수 - visibility 추가
async function triggerAIProcessing(
  postId,
  content,
  hashtags,
  mood,
  visibility,
  userId
) {
  try {
    const { data, error } = await supabase.functions.invoke("process-post-ai", {
      body: {
        postId,
        content,
        hashtags: hashtags || [],
        mood: mood || null,
        visibility: visibility || "private", // ✅ visibility 추가
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

// CREATE POST - visibility 추가 부분만 수정
export async function createPostImmediate(post, userId) {
  if (!userId) throw new Error("user_id가 없습니다.");

  try {
    // 1. Post 저장 - visibility 추가
    const { data: postData, error: postError } = await supabase
      .from("Post")
      .insert([
        {
          content: post.content,
          mood: post.mood || null,
          visibility: post.visibility || "private", // ✅ visibility 추가
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

    // 3. Edge Function 호출 - ✅ 조건 없이 모든 포스트에 AI 처리
    triggerAIProcessing(
      postId,
      post.content,
      post.hashtags,
      post.mood,
      post.visibility,
      userId
    )
      .then(() => console.log("✅ AI 처리 시작됨"))
      .catch((error) => console.error("❌ AI 처리 트리거 실패:", error));

    // 4. 완성된 Post 반환
    const formattedPost = {
      ...postData,
      visibility: postData.visibility || "private", // ✅ visibility 포함
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
