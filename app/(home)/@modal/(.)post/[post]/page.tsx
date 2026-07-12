import ModelPostOpen from "@/app/components/ModelPostOpen"; // Adjust path if needed
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ post: string }>, 
    searchParams: Promise<{ photo: string }> 
}) {
    // Resolve the Next.js 15+ promises
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const supabase = await createClient();

    // Fetch the single post and all its relational data
    const { data: postData, error } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            created_at,
            image_url,
            video_url,
            author:users ( 
                id,
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
                    id,
                    username, 
                    first_name, 
                    last_name, 
                    profile_image 
                )
            )
        `)
        .eq("id", resolvedParams.post)
        .order("created_at", { foreignTable: "comments", ascending: false })
        .single(); // Use .single() instead of .limit(1) since we are querying by primary key

    // If there's an error (like an invalid UUID) or the post doesn't exist, show 404
    if (error || !postData) {
        console.error("Error fetching single post:", error);
        notFound();
    }

    return (
        <div className='text-3xl grid place-content-center fixed top-0 left-0 w-full h-full bg-zinc-900/30 backdrop-blur-md text-white z-20'>
            <div className="overflow-hidden">
                <div className="w-full relative h-full overflow-auto post-open">
                    {/* Pass the fully resolved data and query params down to your Client Component */}
                    <ModelPostOpen initialPost={postData} query={resolvedSearchParams} />
                </div>
            </div>
        </div>
    )
}