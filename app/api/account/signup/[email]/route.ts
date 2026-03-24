import { NextResponse } from "next/server";
import db from "@/lib/db"
import { users } from "@/schema/user"
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ email: string }> }) {
    const { email } = await params;

    try {
        const user = await db.select({ id: users.id })
            .from(users).where(eq(users.email, email)).limit(1);

        if (user.length != 0) {
            return NextResponse.json({ exists: true })
        }
        return NextResponse.json({ exists: false })
    } catch (err) {
        console.log(err)
    }

    return NextResponse.json({ message: "ok" })

}