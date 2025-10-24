// services/characterService.js
import supabase from "./supabaseClient";

/**
 * 사용자가 생성한 캐릭터와 시스템 기본 캐릭터를 모두 가져옵니다.
 * User_Character 관계 정보도 함께 포함됩니다.
 */
export async function fetchUserCreatedAndSystemCharacters(userId) {
  const { data, error } = await supabase
    .from("Character")
    .select(
      `
      id,
      name,
      korean_name,
      personality,
      visibility,
      is_system_default,
      description,
      korean_description,
      prompt_description,
      avatar_url,
      greeting_messages,
      User_Character (
        id,
        is_following,
        affinity
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
      korean_name: character.korean_name, // 추가
      personality: character.personality,
      visibility: character.visibility,
      is_system_default: character.is_system_default,
      description: character.description,
      korean_description: character.korean_description,
      prompt_description: character.prompt_description,
      avatar_url: character.avatar_url,
      greeting_messages: character.greeting_messages, // 추가
      // User_Character 관계 데이터
      user_character_id: character.User_Character?.[0]?.id || null,
      is_following: character.User_Character?.[0]?.is_following || false,
      affinity: character.User_Character?.[0]?.affinity || 0,
    })) || [];

  return formattedData;
}

/**
 * 개별 캐릭터의 팔로우 상태를 토글합니다.
 */
export async function switchUserCharacterFollow(userId, character) {
  // 1. 먼저 기존 레코드가 있는지 확인
  const { data: existing, error: checkError } = await supabase
    .from("User_Character")
    .select("id, is_following")
    .eq("user_id", userId)
    .eq("character_id", character.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(`Query failed: ${checkError.message}`);
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
      throw new Error(`Follow creation failed: ${insertError.message}`);
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
    throw new Error(`Update failed: ${updateError.message}`);
  }

  return {
    user_character_id: existing.id,
    is_following: newFollowingState,
  };
}

/**
 * 여러 캐릭터의 팔로우 상태를 배치로 처리합니다.
 * @param {string} userId - 사용자 ID
 * @param {Array<string>} characterIds - 캐릭터 ID 배열
 * @param {boolean} followState - 설정할 팔로우 상태 (true: follow, false: unfollow)
 * @returns {Promise<Object>} 처리 결과 객체
 */
export async function batchToggleFollow(userId, characterIds, followState) {
  if (!userId || !Array.isArray(characterIds) || characterIds.length === 0) {
    throw new Error("Invalid parameters for batch toggle follow");
  }

  // console.log(
  //   `Starting batch ${followState ? "follow" : "unfollow"} for ${
  //     characterIds.length
  //   } characters`
  // );

  // 모든 요청을 병렬로 처리
  const promises = characterIds.map(async (characterId) => {
    try {
      // 기존 레코드 확인
      const { data: existing, error: checkError } = await supabase
        .from("User_Character")
        .select("id, is_following")
        .eq("user_id", userId)
        .eq("character_id", characterId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(
          `Check failed for character ${characterId}: ${checkError.message}`
        );
      }

      // 레코드가 없으면 새로 생성
      if (!existing) {
        const { data: newRecord, error: insertError } = await supabase
          .from("User_Character")
          .insert([
            {
              user_id: userId,
              character_id: characterId,
              is_following: followState,
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error(
            `Insert failed for character ${characterId}: ${insertError.message}`
          );
        }

        return {
          characterId,
          user_character_id: newRecord.id,
          is_following: followState,
          success: true,
          action: "created",
        };
      }

      // 이미 원하는 상태면 스킵
      if (existing.is_following === followState) {
        return {
          characterId,
          user_character_id: existing.id,
          is_following: existing.is_following,
          success: true,
          skipped: true,
          action: "skipped",
        };
      }

      // 상태 업데이트
      const { error: updateError } = await supabase
        .from("User_Character")
        .update({ is_following: followState })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(
          `Update failed for character ${characterId}: ${updateError.message}`
        );
      }

      return {
        characterId,
        user_character_id: existing.id,
        is_following: followState,
        success: true,
        action: "updated",
      };
    } catch (error) {
      console.error(`Failed to process character ${characterId}:`, error);
      return {
        characterId,
        success: false,
        error: error.message,
        action: "failed",
      };
    }
  });

  // 모든 요청 완료 대기
  const results = await Promise.all(promises);

  // 결과 분석
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const skipped = results.filter((r) => r.success && r.skipped);
  const processed = results.filter((r) => r.success && !r.skipped);

  // console.log(`Batch ${followState ? "follow" : "unfollow"} completed:`, {
  //   total: results.length,
  //   successful: successful.length,
  //   failed: failed.length,
  //   skipped: skipped.length,
  //   processed: processed.length,
  // });

  return {
    successful,
    failed,
    skipped,
    processed,
    totalRequested: characterIds.length,
    totalProcessed: results.length,
    successCount: successful.length,
    failCount: failed.length,
    skippedCount: skipped.length,
    processedCount: processed.length,
  };
}
