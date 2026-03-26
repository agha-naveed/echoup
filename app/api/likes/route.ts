import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { likes } from "@/schema/like";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const body = await req.json();

        if (!body.postId) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

        // Grab the photoIndex (defaults to null if it's a general post like)
        const targetPhotoIndex = body.photoIndex !== undefined ? body.photoIndex : null;

        // 1. Check if the user already liked THIS SPECIFIC photo
        const existingLike = await db.query.likes.findFirst({
            where: and(
                eq(likes.postId, body.postId),
                eq(likes.userId, userId),
                targetPhotoIndex === null
                    ? isNull(likes.photoIndex)
                    : eq(likes.photoIndex, targetPhotoIndex)
            )
        });

        if (existingLike) {
            // 2. UNLIKE: Delete that specific like
            await db.delete(likes).where(eq(likes.id, existingLike.id));
            return NextResponse.json({ success: true, action: "unliked" });
        } else {
            // 3. LIKE: Insert the new like with the photoIndex
            await db.insert(likes).values({
                postId: body.postId,
                userId: userId,
                photoIndex: targetPhotoIndex
            });
            return NextResponse.json({ success: true, action: "liked" });
        }
    } catch (error) {
        console.error("Like Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}