// import { NextRequest, NextResponse } from "next/server";
// import db from "@/lib/db"
// import { users } from "@/db/schema/user";
// import { eq } from "drizzle-orm";
// import bcrypt from "bcrypt"

// export async function POST(req: NextRequest) {
//     const { email, password } = await req.json();
//     console.log(email, password)

//     const user = await db.select({ password: users.password }).from(users).where(eq(users.email, password)).limit(1)

//     if (user.length === 0) {
//         return NextResponse.json({ message: "User not found" }, { status: 404 })
//     }

//     const isPasswordValid = await bcrypt.compare(password, user[0]?.password)

//     if (!isPasswordValid) {
//         return NextResponse.json({ message: "Invalid password" }, { status: 401 })
//     }
//     return NextResponse.json({ message: "User found" }, { status: 200 })
// }



import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";
import { users } from "@/schema/user";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    providers: [
        // 1. Your existing Google setup
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // 2. The Custom Login we just built
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Please enter all fields");
                }

                // A. Search Drizzle for either the Email OR the Username
                const [existingUser] = await db
                    .select()
                    .from(users)
                    .where(or(
                        eq(users.email, credentials.identifier),
                        eq(users.username, credentials.identifier)
                    ))
                    .limit(1);

                // B. Make sure the user exists and actually has a password set
                if (!existingUser || !existingUser.password) {
                    throw new Error("No account found with those credentials.");
                }

                // C. Compare the typed password against the hashed password in the DB
                const passwordMatch = await bcrypt.compare(credentials.password, existingUser.password);

                if (!passwordMatch) {
                    throw new Error("Incorrect password.");
                }

                // D. Return this object to NextAuth to pack into the browser cookie
                return {
                    id: existingUser.id,
                    name: `${existingUser.firstName} ${existingUser.lastName || ""}`.trim(),
                    email: existingUser.email,
                    image: existingUser.profileImage,
                };
            }
        })
    ],
    // 3. Inject the User ID into the session (Crucial for later!)
    callbacks: {
        async jwt({ token, user }) {
            // When the user logs in, attach their DB ID and Image to the token
            if (user) {
                token.id = user.id;
                token.picture = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            // Send the ID and Image from the token down to the frontend session
            if (session.user) {
                session.user.id = token.id as string;
                session.user.image = token.picture as string | null;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/account', // Tell NextAuth where your custom login page is
    },
    // Optional: Secret is required in production
    secret: process.env.NEXTAUTH_SECRET,
};

// Export the handler for Next.js App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };