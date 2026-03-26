import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { likes } from "@/schema/like";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const { postId } = await req.json();

        if (!postId) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

        const existingLike = await db.query.likes.findFirst({
            where: and(eq(likes.postId, postId), eq(likes.userId, userId))
        });

        if (existingLike) {
            await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
            return NextResponse.json({ success: true, action: "unliked" });
        } else {
            await db.insert(likes).values({ postId, userId });
            return NextResponse.json({ success: true, action: "liked" });
        }
    } catch (error) {
        console.error("Like Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}