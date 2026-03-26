import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { posts } from "@/schema/post";
import redis from "@/lib/redis";


export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const rateLimitKey = `rate_limit:post:${userId}`;

        const postCount = await (await redis).incr(rateLimitKey);

        if (postCount === 1) {
            await (await redis).expire(rateLimitKey, 60);
        }

        if (postCount > 3) {
            return NextResponse.json(
                { error: "You are echoing too fast. Please wait a minute." },
                { status: 429 }
            );
        }


        const body = await req.json();

        if ((!body.content || body.content.trim() === "") && !body.imageUrls) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const newPost = await db.insert(posts).values({
            content: body.content,
            authorId: userId,
            imageUrl: body.imageUrls
        }).returning({ id: posts.id });

        return NextResponse.json({ success: true, postId: newPost[0].id });

    } catch (error) {
        console.error("Failed to create post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}