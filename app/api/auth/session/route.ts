import { NextRequest, NextResponse } from "next/server";
import { getFreshSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-config";

// Gives the browser a short-lived ACCESS token (+ basic user info).
// The refresh token is never returned.
export async function GET(request: NextRequest) {
    const sid = request.cookies.get(SESSION_COOKIE)?.value;
    const session = sid ? await getFreshSession(sid) : null;

    if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
        {
            access_token: session.access_token,
            expires_at: session.expires_at,
            user: session.user,
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}
