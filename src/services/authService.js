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
