// Safe to import from anywhere (proxy, route handlers, server components).

export const SESSION_COOKIE = "echoup_sid";

// Idle timeout: every request that reaches the server pushes expiry out by
// another 30 minutes. See `readSession` in lib/session.ts.
// For an ABSOLUTE 30 minute session instead, stop re-extending the TTL there.
export const SESSION_TTL_SECONDS = 30 * 60;

// Refresh the Supabase access token when it has less than this left.
export const TOKEN_REFRESH_WINDOW_SECONDS = 60;

export const sessionCookieOptions = {
    httpOnly: true, // JS can never read the session id
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
};

export type SessionUser = {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
};

export type SessionData = {
    access_token: string;
    refresh_token: string;
    expires_at: number; // unix seconds, access token expiry
    user: SessionUser;
};
