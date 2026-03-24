import { isReserved } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt"
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
    const body = await req.json();

    // else {
    // const user = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
    // if (user.length != 0) {
    //     return NextResponse.json(
    //         { error: "Username already exists" },
    //         { status: 400 }
    //     );
    // }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(body.password, salt, async (err, hash) => {
            console.log("password: " + JSON.stringify(body))
            if (!err) {
                const addData = await db.insert(users).values({
                    id: randomUUID(),
                    firstName: body.firstName,
                    lastName: body.lastName,
                    gender: body.gender,
                    dateOfBirth: body.dateOfBirth,
                    email: body.email,
                    password: hash,
                    username: body.username,
                    profileImage: body.profileImage,
                })
                console.log(addData)
            }
        })
    })
    // await db.insert(users).values({
    //     firstName: body.firstName,
    //     lastName: body.lastName,
    //     gender: body.gender,
    //     dateOfBirth: body.dateOfBirth,
    //     email: body.email,
    //     password: hashedPassword,
    //     username: body.username,
    //     profileImage: body.profileImage,
    // })

    return NextResponse.json({
        success: true,
    }, { status: 200 })
    // }

}


export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const qParam = searchParams.get("username");
    const username = qParam?.toLowerCase();

    if (isReserved(username || "")) {
        return NextResponse.json(
            { error: "Username not allowed" },
            { status: 400 }
        );
    }

    else {
        const user = await db.select({ id: users.id })
            .from(users).where(eq(users.username, `${username}`)).limit(1)

        if (user.length != 0) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
        }, { status: 200 })
    }

}