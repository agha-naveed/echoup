import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    return Response.json({
        message: "You are logged in",
        user: session.user,
    });
}