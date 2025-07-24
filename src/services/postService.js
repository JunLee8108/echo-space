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
        like: likeCharacters.length, // 캐싱된 like 수 저장
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
    character: c.character.name,
    message: c.message,
    profile: c.character.profile,
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
    character: c.name,
  }));

  const { error: likeError } = await supabase
    .from("Post_Like")
    .insert(likeData);

  if (likeError) {
    console.error("❌ 좋아요 저장 실패:", likeError.message);
    throw likeError;
  }

  return postId;
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
export async function fetchPostsWithCommentsAndLikes(uid) {
  if (!uid) throw new Error("user_id가 없습니다.");

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
        character,
        message,
        created_at,
        profile
      ),
      Post_Like (
        character
      )
    `
    )
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 불러오기 실패:", error.message);
    throw error;
  }

  return data;
}
