import { NextResponse, type NextRequest } from "next/server";
import { getFreshSession } from "./lib/session";
import { SESSION_COOKIE, sessionCookieOptions } from "./lib/session-config";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Session lives in Redis. Look it up (this also resets the 30 min idle
    // timer and refreshes the Supabase access token if it's about to expire).
    const sid = request.cookies.get(SESSION_COOKIE)?.value;
    const session = sid ? await getFreshSession(sid) : null;

    const publicPaths = [
        "/account",
        "/account/signup",
        "/auth/callback",
        "/api/auth", // login / signup / logout / session handle auth themselves
        "/favicon.ico",
    ];
    const isPublicPath =
        publicPaths.some((path) => pathname.startsWith(path)) ||
        pathname.startsWith("/@");

    let response: NextResponse;
    if (!session && !isPublicPath) {
        response = NextResponse.redirect(new URL("/account", request.url));
    } else if (session && pathname === "/account") {
        response = NextResponse.redirect(new URL("/", request.url));
    } else {
        response = NextResponse.next();
    }

    // Routes that set/clear the cookie themselves must not be overridden here.
    const managesOwnCookie =
        pathname.startsWith("/api/auth/") && pathname !== "/api/auth/session";

    if (!managesOwnCookie) {
        if (session && sid) {
            response.cookies.set(SESSION_COOKIE, sid, sessionCookieOptions); // slide cookie expiry
        } else if (sid) {
            response.cookies.delete(SESSION_COOKIE); // stale/expired id
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
