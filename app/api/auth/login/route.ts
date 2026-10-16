import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { createSession, destroySession } from "@/lib/session";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-config";
import { createStatelessClient, toSessionData } from "@/lib/supabase-stateless";

// 5 attempts / minute per IP + email (brute-force protection)
const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:login",
});

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await limiter.limit(`${ip}:${email.toLowerCase()}`);
    if (!success) {
        return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
    }

    const { data, error } = await createStatelessClient().auth.signInWithPassword({ email, password });
    if (error || !data.session) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // New session id on every login (prevents session fixation).
    const oldSid = request.cookies.get(SESSION_COOKIE)?.value;
    if (oldSid) await destroySession(oldSid);

    const sid = await createSession(toSessionData(data.session));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sid, sessionCookieOptions);
    return res;
}
