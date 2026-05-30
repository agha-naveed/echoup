import CreatePost from "@/components/CreatePost";
import FeedPage from "@/components/Feed";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  // Fetch the latest 20 posts with all relational data
  const { data: initialPosts, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      created_at,
      image_url,
      author:users ( 
        username, 
        first_name, 
        last_name, 
        profile_image 
      ),
      likes ( 
        id, 
        user_id, 
        photo_index 
      ),
      shares ( 
        id, 
        user_id, 
        photo_index 
      ),
      comments (
        id,
        content,
        created_at,
        photo_index,
        author:users ( 
          username, 
          first_name, 
          last_name, 
          profile_image 
        )
      )
    `)
    // 1. Order the main posts by newest first
    .order("created_at", { ascending: false })
    // 2. Order the nested comments by newest first
    .order("created_at", { foreignTable: "comments", ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch posts:", error);
  }

  return (
    <div className="w-full xl:px-10 md:px-7 flex flex-col gap-5 min-h-screen">
      <CreatePost />
      {/* Pass the fetched data down to the client component. Default to an empty array if undefined */}
      <FeedPage initialPosts={initialPosts || []} />
    </div>
  );
}