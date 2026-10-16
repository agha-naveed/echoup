import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client. The session lives in Redis; the browser only holds an
 * HttpOnly session-id cookie it cannot read. For direct queries/realtime we
 * fetch the short-lived ACCESS token from /api/auth/session (never the
 * refresh token) and cache it briefly in memory.
 *
 * NOTE: because of the `accessToken` option, `supabase.auth.*` is unavailable
 * on this client. Use /api/auth/* (login, logout, signup, session) instead.
 */

const MAX_CACHE_MS = 5 * 60 * 1000; // re-check with the server at least every 5 min
let cached: { token: string; exp: number } | null = null;
let inflight: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
    if (cached && cached.exp > Date.now()) return cached.token;
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            const res = await fetch("/api/auth/session", {
                cache: "no-store",
                credentials: "same-origin",
            });
            if (!res.ok) {
                cached = null;
                return null;
            }
            const s = await res.json();
            cached = {
                token: s.access_token,
                exp: Math.min(s.expires_at * 1000 - 60_000, Date.now() + MAX_CACHE_MS),
            };
            return s.access_token as string;
        } catch {
            return null;
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

/** Call after login/logout so the next request fetches a fresh token. */
export function clearAccessTokenCache() {
    cached = null;
}

let browserClient: ReturnType<typeof build> | null = null;

function build() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { accessToken: getAccessToken }
    );
}

export function createClient() {
    // During SSR of client components don't share a module-level instance.
    if (typeof window === "undefined") return build();
    return (browserClient ??= build());
}
