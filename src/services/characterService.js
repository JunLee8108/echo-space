// /services/characterService.js
import supabase from "./supabaseClient";

/**
 * “사용 가능한” 캐릭터만 바로 가져온다.
 * - 시스템 기본(is_system_default = true)
 * - 내가 팔로우한 캐릭터(user_characters.is_following = true)
 */
export async function fetchAvailableCharacters(uid) {
  if (!uid) throw new Error("user_id가 없습니다.");

  const { data, error } = await supabase.rpc("get_user_characters", {
    user_id_param: uid,
  });

  if (error) throw error;
  return data; // 👉 이미 필터링 끝!
}

export async function fetchUserCreatedAndSystemCharacters(userId) {
  const { data, error } = await supabase
    .from("Character")
    .select(
      `
      id,
      name,
      visibility,
      is_system_default,
      prompt_description,
      avatar_url,
      User_Character (
        id,
        is_following
      )
    `
    )
    .or(`created_by.eq.${userId},is_system_default.eq.true`)
    .eq("User_Character.user_id", userId)
    .order("name");

  if (error) {
    console.error("Error fetching characters:", error);
    throw error;
  }

  // 데이터 구조 평탄화
  const formattedData =
    data?.map((character) => ({
      id: character.id,
      name: character.name,
      visibility: character.visibility,
      is_system_default: character.is_system_default,
      prompt_description: character.prompt_description,
      avatar_url: character.avatar_url,
      // User_Character 관계 데이터
      user_character_id: character.User_Character?.[0]?.id || null,
      is_following: character.User_Character?.[0]?.is_following || false,
    })) || [];

  return formattedData;
}

export async function switchUserCharacterFollow(userId, character) {
  // 1. 먼저 기존 레코드가 있는지 확인
  const { data: existing, error: checkError } = await supabase
    .from("User_Character")
    .select("id, is_following")
    .eq("user_id", userId)
    .eq("character_id", character.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(`조회 실패: ${checkError.message}`);
  }

  // 2. 레코드가 없으면 새로 생성 (is_following: true)
  if (!existing) {
    const { data: newRecord, error: insertError } = await supabase
      .from("User_Character")
      .insert([
        {
          user_id: userId,
          character_id: character.id,
          is_following: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`팔로우 생성 실패: ${insertError.message}`);
    }

    return {
      user_character_id: newRecord.id,
      is_following: true,
    };
  }

  // 3. 레코드가 있으면 is_following 상태 토글
  const newFollowingState = !existing.is_following;

  const { error: updateError } = await supabase
    .from("User_Character")
    .update({ is_following: newFollowingState })
    .eq("id", existing.id);

  if (updateError) {
    throw new Error(`업데이트 실패: ${updateError.message}`);
  }

  return {
    user_character_id: existing.id,
    is_following: newFollowingState,
  };
}
