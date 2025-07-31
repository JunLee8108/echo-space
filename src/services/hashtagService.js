import supabase from "./supabaseClient";

// 모든 해시태그 가져오기 (자동완성용)
export async function fetchAllHashtags() {
  const { data, error } = await supabase
    .from("Hashtag")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ 해시태그 목록 가져오기 실패:", error.message);
    throw error;
  }

  return data || [];
}

// 해시태그 검색 (자동완성)
export async function searchHashtags(query) {
  if (!query || query.length < 1) return [];

  const { data, error } = await supabase
    .from("Hashtag")
    .select("id, name")
    .ilike("name", `${query}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("❌ 해시태그 검색 실패:", error.message);
    throw error;
  }

  return data || [];
}

// 새로운 해시태그 생성 또는 기존 해시태그 ID 반환
export async function createOrGetHashtags(hashtagNames) {
  const hashtagIds = [];

  for (const name of hashtagNames) {
    const cleanName = name.toLowerCase().trim();

    // 먼저 기존 해시태그 확인
    const { data: existing, error: searchError } = await supabase
      .from("Hashtag")
      .select("id")
      .eq("name", cleanName)
      .maybeSingle();

    if (searchError && searchError.code !== "PGRST116") {
      console.error("❌ 해시태그 검색 실패:", searchError.message);
      throw searchError;
    }

    if (existing) {
      hashtagIds.push(existing.id);
    } else {
      // 새로운 해시태그 생성
      const { data: newHashtag, error: createError } = await supabase
        .from("Hashtag")
        .insert([{ name: cleanName }])
        .select()
        .single();

      if (createError) {
        console.error("❌ 해시태그 생성 실패:", createError.message);
        throw createError;
      }

      hashtagIds.push(newHashtag.id);
    }
  }

  return hashtagIds;
}

// 포스트에 해시태그 연결
export async function attachHashtagsToPost(postId, hashtagIds) {
  const postHashtags = hashtagIds.map((hashtagId) => ({
    post_id: postId,
    hashtag_id: hashtagId,
  }));

  const { error } = await supabase.from("Post_Hashtag").insert(postHashtags);

  if (error) {
    console.error("❌ 해시태그 연결 실패:", error.message);
    throw error;
  }
}
