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

export const resetPasswordForEmail = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/account/update-password`,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
};
