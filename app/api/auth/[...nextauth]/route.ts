// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/auth";

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };


import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";
import { users } from "@/schema/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log(credentials)
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Please enter all fields");
                }

                const [existingUser] = await db.select().from(users).where(eq(users.email, credentials.identifier)).limit(1);

                if (!existingUser) {
                    throw new Error("Invalid Email or Password");
                }

                const passwordMatch = await bcrypt.compare(credentials.password, existingUser.password);

                if (!passwordMatch) {
                    throw new Error("Invalid Email or Password");
                }

                return {
                    id: existingUser.id,
                    name: `${existingUser.firstName} ${existingUser.lastName || ""}`.trim(),
                    email: existingUser.email,
                    image: existingUser.profileImage,
                };
            }
        })
    ],
    callbacks: {
        async signIn({ account, user }) {
            if (account?.provider === "google") {
                const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email as string)).limit(1);

                if (!existingUser) {
                    return "/account/signup";
                }

                return true;
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/account',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };