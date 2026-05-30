import PostOpen from '@/app/components/PostOpen' // Adjust path if needed
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

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

    // Fetch the post and its associated author directly from Supabase
    const { data: postData, error } = await supabase
        .from('posts')
        .select(`
            *,
            author:users (
                username,
                first_name,
                last_name,
                profile_image
            )
        `)
        .eq('id', resolvedParams.post)
        .single(); // .single() expects exactly one row, perfect for finding by ID

    // If there's an error (like an invalid UUID) or the post doesn't exist, show 404
    if (error || !postData) {
        console.error("Error fetching post:", error);
        notFound();
    }

    return (
        <div className='max-w-150'>
            {/* Pass the fully resolved data and query params down to your Client Component */}
            <PostOpen initialPost={postData} query={resolvedSearchParams} />
        </div>
    )
}