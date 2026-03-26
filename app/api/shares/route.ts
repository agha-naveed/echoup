import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { shares } from "@/schema/share";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { postId } = await req.json();

        // Try to insert the share. If they already shared it, it just quietly succeeds.
        try {
            await db.insert(shares).values({ postId: postId, userId: session.user.id });
        } catch (e) {
            // Ignore unique constraint errors if they click share twice
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}