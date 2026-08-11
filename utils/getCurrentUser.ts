import { createClient } from "@/utils/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, username, first_name, last_name, profile_image"
    )
    .eq("id", authUser.id)
    .single();

  return profile;
}