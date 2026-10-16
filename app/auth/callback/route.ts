import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOAuthServerClient } from "@/utils/supabase/oauth-server";
import { createStatelessClient, toSessionData } from "@/lib/supabase-stateless";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Cookie-based client is needed only to read the PKCE verifier for the exchange.
    const oauth = await createOAuthServerClient();
    const { data, error } = await oauth.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Move the session into Redis and drop every Supabase auth cookie,
      // so no JWT / refresh token is left in the browser.
      const sid = await createSession(toSessionData(data.session));
      const store = await cookies();
      store
        .getAll()
        .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
        .forEach((c) => store.delete(c.name));
      store.set(SESSION_COOKIE, sid, sessionCookieOptions);

      const { data: profile } = await createStatelessClient(data.session.access_token)
        .from("users")
        .select("username")
        .eq("id", data.session.user.id)
        .single();

      return NextResponse.redirect(
        profile?.username ? `${origin}/` : `${origin}/account/signup?step=2`
      );
    }
  }

  return NextResponse.redirect(`${origin}/account`);
}
