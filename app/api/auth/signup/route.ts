import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-config";
import { createStatelessClient, toSessionData } from "@/lib/supabase-stateless";

export async function POST(request: NextRequest) {
    const b = await request.json().catch(() => null);
    if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const { email, password, firstName, lastName, username, profileImage, gender, dateOfBirth } = b;

    // Server-side validation (the client-side Zod password rule doesn't enforce min length).
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    if (typeof password !== "string" || password.length < 6)
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (typeof username !== "string" || !/^[a-zA-Z0-9_]{3,}$/.test(username))
        return NextResponse.json({ error: "Invalid username." }, { status: 400 });
    if (typeof firstName !== "string" || !firstName.trim())
        return NextResponse.json({ error: "First name is required." }, { status: 400 });

    const { data, error } = await createStatelessClient().auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: `${firstName} ${lastName || ""}`.trim(),
                avatar_url: profileImage,
            },
        },
    });

    if (error || !data.user) {
        return NextResponse.json({ error: error?.message ?? "Signup failed." }, { status: 400 });
    }

    // Email confirmation enabled -> no session yet; user must confirm, then log in.
    if (!data.session) {
        return NextResponse.json({ ok: true, needsConfirmation: true });
    }

    // Finish the profile row as the new user (RLS applies).
    const authed = createStatelessClient(data.session.access_token);
    const { error: updateError } = await authed
        .from("users")
        .update({
            username,
            profile_image: profileImage,
            ...(gender && { gender }),
            ...(dateOfBirth && { date_of_birth: dateOfBirth }),
        })
        .eq("id", data.user.id);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const sid = await createSession(toSessionData(data.session));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sid, sessionCookieOptions);
    return res;
}
