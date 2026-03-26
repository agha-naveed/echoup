import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { comments } from "@/schema/comment";
import redis from "@/lib/redis";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const body = await req.json();

        if (!body.postId || !body.content || body.content.trim() === "") {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        const rateLimitKey = `rate_limit:comment:${userId}`;
        const commentCount = await (await redis).incr(rateLimitKey);
        if (commentCount === 1) await (await redis).expire(rateLimitKey, 60);
        if (commentCount > 5) return NextResponse.json({ error: "Too fast" }, { status: 429 });

        const targetPhotoIndex = body.photoIndex !== undefined ? body.photoIndex : null;

        const newComment = await db.insert(comments).values({
            content: body.content,
            authorId: userId,
            postId: body.postId,
            photoIndex: targetPhotoIndex
        }).returning({ id: comments.id });

        if (newComment) {
            revalidatePath(`/`);
            revalidatePath(`/post/${body.postId}`);

            return NextResponse.json({ success: true, commentId: newComment[0].id }, { status: 200 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}