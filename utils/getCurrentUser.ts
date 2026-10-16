import { cache } from "react";
import { createClient, getAuthUser } from "@/utils/supabase/server";

export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, username, first_name, last_name, profile_image")
    .eq("id", authUser.id)
    .single();

  return profile;
});
