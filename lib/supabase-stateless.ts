import { createClient, type Session } from "@supabase/supabase-js";
import type { SessionData } from "./session-config";

/**
 * Supabase client that stores NOTHING (no cookies, no localStorage).
 * Pass an access token to make requests as that user (RLS applies).
 */
export function createStatelessClient(accessToken?: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
            global: accessToken
                ? { headers: { Authorization: `Bearer ${accessToken}` } }
                : undefined,
        }
    );
}

export function toSessionData(session: Session): SessionData {
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at:
            session.expires_at ??
            Math.floor(Date.now() / 1000) + session.expires_in,
        user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
        },
    };
}
