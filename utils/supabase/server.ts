import { cache } from "react";
import { cookies } from "next/headers";
import { readSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-config";
import { createStatelessClient } from "@/lib/supabase-stateless";

/**
 * Current session from Redis (null if logged out / expired).
 * Memoised per request. The proxy has already refreshed the token and
 * extended the idle timer, so we don't touch the TTL again here.
 */
export const getSession = cache(async () => {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sid) return null;
    return readSession(sid, { touch: false });
});

/** Logged-in auth user ({ id, email, user_metadata }) - no network call. */
export async function getAuthUser() {
    return (await getSession())?.user ?? null;
}

/** Supabase client that acts as the logged-in user (RLS applies). */
export async function createClient() {
    const session = await getSession();
    return createStatelessClient(session?.access_token);
}
