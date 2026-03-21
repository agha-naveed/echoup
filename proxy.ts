import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    const publicPaths = ["/account", "/account/signup", "/post", "/favicon.ico"];
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        return NextResponse.redirect(new URL("/account", req.url));
    }

    return NextResponse.next();
}


export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};