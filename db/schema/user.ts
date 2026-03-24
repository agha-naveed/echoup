import { pgTable, serial, text, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }),
    gender: varchar("gender", { length: 10 }),
    dateOfBirth: date("date_of_birth"),

    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"), // Nullable for Google Auth users
    username: varchar("username", { length: 50 }).notNull().unique(),

    profileImage: text("profile_image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});


const baseInsertSchema = createInsertSchema(users);

export const signUpFormSchema = baseInsertSchema.omit({ dateOfBirth: true }).extend({
    firstName: z.string().min(1, "* First name is required"),
    email: z.string().min(1, "* Email is required").email("* Invalid email address"),
    username: z.string()
        .min(3, "* Username must be at least 3 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "* Only letters, numbers, and underscores"),

    password: z.union([
        z.string().min(6, "* Password must be at least 6 characters"),
        z.literal("").optional()
    ]).optional(),

    date: z.string(),
    month: z.string(),
    year: z.string(),
    profileImageOption: z.string().optional(),
    file: z.any().optional(),
});

export type SignUpFormValues = {
    firstName: string;
    lastName?: string | null;
    gender?: string | null;
    email: string;
    password?: string | null;
    username: string;
    date: string;
    month: string;
    year: string;
    profileImageOption?: string;
    file?: any;
};