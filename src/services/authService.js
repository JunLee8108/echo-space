import supabase from "./supabaseClient";

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const updateDisplayName = async (displayName) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (error) {
    throw error;
  }

  return data;
};

export const updateLanguage = async (language) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { language: language },
  });

  if (error) {
    throw error;
  }

  return data;
};

export const updatePassword = async (currentPassword, newPassword) => {
  // 먼저 현재 비밀번호로 재인증
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }

  // 현재 비밀번호로 재인증
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }

  // 비밀번호 업데이트
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw updateError;
  }

  return { success: true };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { success: true };
};
