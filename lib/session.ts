import { redis } from "./redis";
import {
    SESSION_TTL_SECONDS,
    TOKEN_REFRESH_WINDOW_SECONDS,
    type SessionData,
} from "./session-config";
import { createStatelessClient, toSessionData } from "./supabase-stateless";

// NOTE: no next/headers import here so the proxy can use this file too.

const key = (sid: string) => `sess:${sid}`;
const SID_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

function newSessionId() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString("base64url");
}

export async function createSession(data: SessionData): Promise<string> {
    const sid = newSessionId();
    await redis.set(key(sid), data, { ex: SESSION_TTL_SECONDS });
    return sid;
}

/** Overwrite session data and reset the 30 minute TTL. */
export async function saveSession(sid: string, data: SessionData) {
    await redis.set(key(sid), data, { ex: SESSION_TTL_SECONDS });
}

/**
 * Read a session. With `touch` (default) the 30 minute idle timer is reset
 * atomically (GETEX).
 */
export async function readSession(
    sid: string,
    { touch = true }: { touch?: boolean } = {}
): Promise<SessionData | null> {
    if (!SID_PATTERN.test(sid)) return null;
    const value = touch
        ? await redis.getex<SessionData>(key(sid), { ex: SESSION_TTL_SECONDS })
        : await redis.get<SessionData>(key(sid));
    return value ?? null;
}

/** Delete the session (logout). Returns what was stored so tokens can be revoked. */
export async function destroySession(sid: string): Promise<SessionData | null> {
    if (!SID_PATTERN.test(sid)) return null;
    return (await redis.getdel<SessionData>(key(sid))) ?? null;
}

/**
 * Read the session and transparently refresh the Supabase access token if it
 * is about to expire. The refresh token never leaves the server.
 */
export async function getFreshSession(sid: string): Promise<SessionData | null> {
    const session = await readSession(sid);
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at - now > TOKEN_REFRESH_WINDOW_SECONDS) return session;

    // Lock so parallel requests don't all spend the same refresh token.
    const lockKey = `lock:${sid}`;
    const gotLock = await redis.set(lockKey, "1", { nx: true, ex: 10 });
    if (!gotLock) {
        await new Promise((r) => setTimeout(r, 400));
        return (await readSession(sid)) ?? null;
    }

    try {
        const { data, error } = await createStatelessClient().auth.refreshSession({
            refresh_token: session.refresh_token,
        });

        if (error || !data.session) {
            // Refresh token rejected (revoked/expired) -> session is dead.
            // Network/5xx errors keep the session so we can retry next request.
            const status = (error as any)?.status;
            if (status && status >= 400 && status < 500) {
                await destroySession(sid);
                return null;
            }
            return session;
        }

        const next = toSessionData(data.session);
        await saveSession(sid, next);
        return next;
    } finally {
        await redis.del(lockKey);
    }
}
