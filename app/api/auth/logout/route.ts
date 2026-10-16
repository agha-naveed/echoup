import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-config";

export async function POST(request: NextRequest) {
    const sid = request.cookies.get(SESSION_COOKIE)?.value;

    if (sid) {
        // Delete from Redis (atomic get+delete) ...
        const session = await destroySession(sid);

        // ... and revoke this login at Supabase too, so the refresh token
        // can't be reused even if it leaked.
        if (session) {
            await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout?scope=local`,
                {
                    method: "POST",
                    headers: {
                        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            ).catch(() => {});
        }
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
}
