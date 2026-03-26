import db from '@/app/api/lib/db';
import PostOpen from '@/app/components/PostOpen'
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function page({ params, searchParams }: { params: Promise<{ post: string }>, searchParams: Promise<{ photo: string }> }) {

    const postData = await db.query.posts.findFirst({
        where: eq(posts.id, (await params).post),
        with: {
            author: {
                columns: {
                    username: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                }
            }
        }
    });


    if (!postData) {
        notFound();
    }
    return (
        <div className='max-w-150'>
            <PostOpen initialPost={postData} query={await searchParams} />
        </div>
    )
}