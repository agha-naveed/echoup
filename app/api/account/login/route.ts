import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt"

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();
    console.log(email, password)

    const user = await db.select({ password: users.password }).from(users).where(eq(users.email, password)).limit(1)

    if (user.length === 0) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user[0]?.password)

    if (!isPasswordValid) {
        return NextResponse.json({ message: "Invalid password" }, { status: 401 })
    }
    return NextResponse.json({ message: "User found" }, { status: 200 })
}