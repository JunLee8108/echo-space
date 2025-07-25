import supabase from "./supabaseClient";

// 게시글 + 댓글 + 좋아요 캐릭터 저장 (SAVE)
export async function savePostWithCommentsAndLikes(
  post,
  comments,
  likeCharacters
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
        title: post.title,
        content: post.content,
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

  // 4. 저장된 전체 데이터를 다시 조회하여 반환
  const { data: savedPost, error: fetchError } = await supabase
    .from("Post")
    .select(
      `
      id,
      title,
      content,
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
          avatar_url,
          prompt_description
        )
      ),
      Post_Like (
        character_id,
        Character (
          id,
          name,
          avatar_url,
          prompt_description
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
        avatar_url: comment.Character?.avatar_url || null,
        prompt_description: comment.Character?.prompt_description || "",
      })) || [],
    Post_Like:
      savedPost.Post_Like?.map((like) => ({
        character_id: like.character_id,
        character: like.Character?.name || "Unknown",
        avatar_url: like.Character?.avatar_url || null,
        prompt_description: like.Character?.prompt_description || "",
      })) || [],
  };

  return formattedPost;
}

// DELETE
export async function deletePostById(postId, uid) {
  if (!uid) throw new Error("user_id가 없습니다.");

  // RLS 정책이 'user_id = auth.uid()' 로 걸려 있으면
  // uid 체크 없이 delete 만 호출해도 안전합니다.
  const { error } = await supabase
    .from("Post")
    .delete()
    .eq("id", postId)
    .eq("user_id", uid); // 안전망 한 번 더

  if (error) {
    console.error("❌ Post 삭제 실패:", error.message);
    throw error;
  }
}

// Post + 연결된 댓글 + 좋아요 누른 캐릭터까지 모두 불러오기 (FETCH)

export async function fetchPostsWithCommentsAndLikes(
  uid,
  { limit = 5, offset = 0 } = {}
) {
  if (!uid) throw new Error("user_id가 없습니다.");

  try {
    // 전체 포스트 개수 조회 (hasMore 판단용)
    const { count } = await supabase
      .from("Post")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid);

    // 페이지네이션된 포스트 조회
    const { data, error } = await supabase
      .from("Post")
      .select(
        `
        id,
        title,
        content,
        like,
        created_at,
        Comment (
          id,
          character_id,
          message,
          created_at,
          Character (
            id,
            name,
            avatar_url,
            prompt_description
          )
        ),
        Post_Like (
          character_id,
          Character (
            id,
            name,
            avatar_url,
            prompt_description
          )
        )
      `
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1); // LIMIT과 OFFSET 적용

    if (error) {
      console.error("❌ 불러오기 실패:", error.message);
      throw error;
    }

    // 데이터 구조 평탄화
    const formattedData =
      data?.map((post) => ({
        ...post,
        Comment:
          post.Comment?.map((comment) => ({
            id: comment.id,
            character_id: comment.character_id,
            message: comment.message,
            created_at: comment.created_at,
            character: comment.Character?.name || "Unknown",
            avatar_url: comment.Character?.avatar_url || null,
            prompt_description: comment.Character?.prompt_description || "",
          })) || [],
        Post_Like:
          post.Post_Like?.map((like) => ({
            character_id: like.character_id,
            character: like.Character?.name || "Unknown",
            avatar_url: like.Character?.avatar_url || null,
            prompt_description: like.Character?.prompt_description || "",
          })) || [],
      })) || [];

    return {
      posts: formattedData,
      totalCount: count,
      hasMore: offset + limit < count,
    };
  } catch (error) {
    console.error("Error in fetchPostsWithCommentsAndLikes:", error);
    throw error;
  }
}
