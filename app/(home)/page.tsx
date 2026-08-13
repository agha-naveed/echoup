import CreatePost from "@/app/components/post/CreatePost";
import FeedPage from "@/components/Feed";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let initialPosts = [] as any;

    if (user) {
        // Step 1: Get the IDs of everyone the current user is following
        const { data: following } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);

        // Extract the IDs into an array
        const followedIds = following?.map(f => f.following_id) || [];
        
        // Add the current user's own ID so they can see their own posts on the feed!
        const allowedIds = [...followedIds, user.id];

        // Step 2: Fetch posts ONLY from those allowed IDs
        const { data: posts } = await supabase
            .from("posts")
            .select(`
                id,
                content,
                image_url,
                video_url,
                is_reel,
                created_at,
                author:users ( id, username, first_name, last_name, profile_image ),
                likes ( id, user_id, photo_index ),
                like_count,
                comment_count,
                comments (
                    id, content, created_at, photo_index,
                    author:users ( id, username, first_name, last_name, profile_image )
                ),
                shares ( id, user_id, photo_index )
            `)
            .in("author_id", allowedIds)
            .order("created_at", { ascending: false })
            .limit(20);

        initialPosts = posts || [];
    }


  return (
    <div className="w-full xl:px-10 md:px-7 flex flex-col gap-5 min-h-screen">
      <CreatePost />
      <FeedPage initialPosts={initialPosts || []} />
    </div>
  );
}