import { isReserved } from "@/lib/username";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const username = body.username.toLowerCase();

    if (isReserved(username)) {
        return Response.json(
            { error: "Username not allowed" },
            { status: 400 }
        );
    }

}