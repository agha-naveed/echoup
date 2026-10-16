import { createBrowserClient } from "@supabase/ssr";

/**
 * Cookie-based client used ONLY to start the Google OAuth redirect
 * (it stores the short-lived PKCE code-verifier cookie).
 * The resulting session is moved into Redis in /auth/callback and these
 * cookies are deleted - never use this client for data access.
 */
export function createOAuthClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
