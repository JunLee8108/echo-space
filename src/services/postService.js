import supabase from "./supabaseClient";
import { createOrGetHashtags, attachHashtagsToPost } from "./hashtagService";
import { updateCharacterAffinity } from "./characterService";

// 게시글 + 댓글 + 좋아요 캐릭터 + 해시태그 저장 (SAVE)
export async function savePostWithCommentsAndLikes(
  post,
  comments,
  likeCharacters,
  hashtags = []
) {
  // 1. 게시글 저장
  const { data: postData, error: postError } = await supabase
    .from("Post")
    .insert([
      {
        content: post.content,
        mood: post.mood || null, // mood 추가
        like: likeCharacters.length,
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
      ai_generated,
      character_id,
      created_at,
      updated_at,
      user_id,
      Comment (
        id,
        character_id,
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
        like: comment.like || 0,
        created_at: comment.created_at,
        character: comment.Character?.name || "Unknown",
        personality: comment.Character?.personality || [],
        avatar_url: comment.Character?.avatar_url || null,
        description: comment.Character?.description || "",
        prompt_description: comment.Character?.prompt_description || "",
        affinity: comment.Character?.User_Character[0]?.affinity || 0,
        isLikedByUser:
          comment.Comment_Like?.some(
            (like) =>
              like.user_id === savedPost.user_id && like.is_active === true
          ) || false,
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

export async function updatePost(postId, { content, mood, hashtags, userId }) {
  if (!userId) throw new Error("user_id가 없습니다.");
  if (!postId) throw new Error("post_id가 없습니다.");

  try {
    // 1. 포스트 내용 업데이트
    const { error: updateError } = await supabase
      .from("Post")
      .update({
        content,
        mood: mood || null,
        updated_at: new Date().toISOString(), // updated_at 필드가 있다면
      })
      .eq("id", postId)
      .eq("user_id", userId); // 본인 포스트만 수정 가능

    if (updateError) {
      console.error("❌ Post 업데이트 실패:", updateError.message);
      throw updateError;
    }

    // 2. 기존 해시태그 연결 삭제
    const { error: deleteHashtagError } = await supabase
      .from("Post_Hashtag")
      .delete()
      .eq("post_id", postId);

    if (deleteHashtagError) {
      console.error("❌ 기존 해시태그 삭제 실패:", deleteHashtagError.message);
      throw deleteHashtagError;
    }

    // 3. 새로운 해시태그 추가
    if (hashtags && hashtags.length > 0) {
      try {
        const hashtagIds = await createOrGetHashtags(hashtags);
        await attachHashtagsToPost(postId, hashtagIds);
      } catch (hashtagError) {
        console.error("❌ 해시태그 저장 실패:", hashtagError.message);
        throw hashtagError;
      }
    }

    // 4. 업데이트된 전체 데이터를 다시 조회하여 반환
    const { data: fullPost, error: fetchError } = await supabase
      .from("Post")
      .select(
        `
        id,
        content,
        mood,
        like,
        ai_generated,
        character_id,
        created_at,
        updated_at,
        user_id,
        Comment (
          id,
          character_id,
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

    if (fetchError) {
      console.error("❌ 업데이트된 포스트 조회 실패:", fetchError.message);
      throw fetchError;
    }

    // 데이터 구조 평탄화 (fetchPostsWithCommentsAndLikes와 동일한 형식)
    const formattedPost = {
      ...fullPost,
      Comment:
        fullPost.Comment?.map((comment) => ({
          id: comment.id,
          character_id: comment.character_id,
          message: comment.message,
          like: comment.like || 0,
          created_at: comment.created_at,
          character: comment.Character?.name || "Unknown",
          personality: comment.Character?.personality || [],
          avatar_url: comment.Character?.avatar_url || null,
          description: comment.Character?.description || "",
          prompt_description: comment.Character?.prompt_description || "",
          affinity: comment.Character?.User_Character[0]?.affinity || 0,
          isLikedByUser:
            comment.Comment_Like?.some(
              (like) => like.user_id === userId && like.is_active === true
            ) || false,
        })) || [],
      Post_Like:
        fullPost.Post_Like?.map((like) => ({
          character_id: like.character_id,
          character: like.Character?.name || "Unknown",
          personality: like.Character?.personality || [],
          avatar_url: like.Character?.avatar_url || null,
          description: like.Character?.description || "",
          prompt_description: like.Character?.prompt_description || "",
          affinity: like.Character?.User_Character[0]?.affinity || 0,
        })) || [],
      Post_Hashtag:
        fullPost.Post_Hashtag?.map((ph) => ({
          hashtag_id: ph.hashtag_id,
          name: ph.Hashtag?.name || "",
        })) || [],
    };

    return formattedPost;
  } catch (error) {
    console.error("Error in updatePost:", error);
    throw error;
  }
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

export async function toggleCommentLike(commentId, userId) {
  if (!userId) throw new Error("user_id가 없습니다.");
  if (!commentId) throw new Error("comment_id가 없습니다.");

  try {
    // 1. 댓글 정보 가져오기 (캐릭터 ID 필요)
    const { data: commentData, error: commentError } = await supabase
      .from("Comment")
      .select("like, character_id")
      .eq("id", commentId)
      .single();

    if (commentError) throw commentError;

    // 2. 기존 좋아요 레코드 확인 (활성/비활성 모두 포함)
    const { data: existingLike, error: checkError } = await supabase
      .from("Comment_Like")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    // 레코드가 있는 경우
    if (existingLike) {
      const newActiveState = !existingLike.is_active;

      // 3-1. is_active 상태 토글
      const { error: updateError } = await supabase
        .from("Comment_Like")
        .update({ is_active: newActiveState })
        .eq("id", existingLike.id);

      if (updateError) throw updateError;

      // 4-1. Comment 테이블의 like 수 업데이트
      if (newActiveState) {
        // 활성화 (좋아요 추가)
        await supabase
          .from("Comment")
          .update({ like: (commentData?.like || 0) + 1 })
          .eq("id", commentId);
      } else {
        // 비활성화 (좋아요 취소)
        await supabase
          .from("Comment")
          .update({ like: Math.max(0, (commentData?.like || 1) - 1) })
          .eq("id", commentId);
      }

      return {
        liked: newActiveState,
        likeCount: newActiveState
          ? (commentData?.like || 0) + 1
          : Math.max(0, (commentData?.like || 1) - 1),
        affinityIncreased: false, // 기존 레코드가 있으면 친밀도는 이미 증가했음
      };
    } else {
      // 3-2. 새로운 좋아요 레코드 생성
      const { data: newLike, error: insertError } = await supabase
        .from("Comment_Like")
        .insert([
          {
            comment_id: commentId,
            user_id: userId,
            is_active: true,
            affinity_increased: false, // 초기값
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 4-2. Comment 테이블의 like 수 증가
      await supabase
        .from("Comment")
        .update({ like: (commentData?.like || 0) + 1 })
        .eq("id", commentId);

      // 5. 처음 좋아요를 누르는 경우에만 친밀도 증가 (확률적)
      let affinityActuallyIncreased = false;
      if (commentData.character_id) {
        try {
          // 현재 캐릭터의 affinity 가져오기
          const { data: userCharData } = await supabase
            .from("User_Character")
            .select("affinity")
            .eq("user_id", userId)
            .eq("character_id", commentData.character_id)
            .single();

          const currentAffinity = userCharData?.affinity || 0;

          // affinity에 따른 확률 계산 (높을수록 확률 감소)
          let probability = 0.5; // 기본 50%
          if (currentAffinity > 30) probability = 0.1; // 10%
          else if (currentAffinity > 20) probability = 0.2; // 20%
          else if (currentAffinity > 10) probability = 0.3; // 30%

          const shouldIncreaseAffinity = Math.random() < probability;

          if (shouldIncreaseAffinity) {
            await updateCharacterAffinity(userId, commentData.character_id, 1);

            // 친밀도 증가 성공 시 플래그 업데이트
            await supabase
              .from("Comment_Like")
              .update({ affinity_increased: true })
              .eq("id", newLike.id);

            affinityActuallyIncreased = true;
            // console.log(
            //   `✅ 캐릭터 ${
            //     commentData.character_id
            //   }의 친밀도가 증가했습니다. (확률: ${probability * 100}%)`
            // );
          } else {
            // console.log(`⏭️ 친밀도 증가 스킵 (확률: ${probability * 100}%)`);
            // affinity_increased는 false로 유지 (다음에 다시 시도 가능)
          }
        } catch (affinityError) {
          console.error("❌ 친밀도 증가 실패:", affinityError);
        }
      }

      return {
        liked: true,
        likeCount: (commentData?.like || 0) + 1,
        affinityIncreased: affinityActuallyIncreased,
      };
    }
  } catch (error) {
    console.error("❌ 댓글 좋아요 토글 실패:", error.message);
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
        ai_generated,
        character_id,
        created_at,
        updated_at,
        user_id,
        Comment (
          id,
          character_id,
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
      .eq("user_id", uid)
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

    // 데이터 구조 평탄화 - Comment_Like 정보 포함
    const formattedData = posts.map((post) => ({
      ...post,
      Comment:
        post.Comment?.map((comment) => ({
          id: comment.id,
          character_id: comment.character_id,
          message: comment.message,
          like: comment.like || 0,
          created_at: comment.created_at,
          character: comment.Character?.name || "Unknown",
          personality: comment.Character?.personality || [],
          avatar_url: comment.Character?.avatar_url || null,
          description: comment.Character?.description || "",
          prompt_description: comment.Character?.prompt_description || "",
          affinity: comment.Character?.User_Character[0]?.affinity || 0,
          // 현재 사용자가 좋아요를 눌렀는지 확인
          isLikedByUser:
            comment.Comment_Like?.some((like) => {
              return like.user_id === uid && like.is_active === true;
            }) || false,
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
