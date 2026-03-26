import ModelPostOpen from "@/app/components/ModelPostOpen";
import db from "@/lib/db";
import { posts } from "@/schema/post";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

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
            },
            comments: {
                with: {
                    author: {
                        columns: {
                            username: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: (comments, { desc }) => [desc(comments.createdAt)]
            }
        }
    });


    if (!postData) {
        notFound();
    }

    return (
        <div className='text-3xl grid place-content-center fixed top-0 left-0 w-full h-full bg-zinc-900/30 backdrop-blur-md text-white z-20'>
            <div className="overflow-hidden">
                <div className="w-full relative h-full overflow-auto post-open">
                    <ModelPostOpen initialPost={postData} query={await searchParams} />
                </div>
            </div>
        </div>
    )
}