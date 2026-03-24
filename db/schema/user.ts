import { pgTable, text, varchar, timestamp, date, uuid, customType } from "drizzle-orm/pg-core";
import { z } from "zod";


const citext = customType<{ data: string }>({
    dataType() {
        return "citext";
    },
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }),
    gender: varchar("gender", { length: 10 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    email: citext("email").notNull().unique(),
    password: text("password").notNull(),
    username: citext("username").notNull().unique(),
    profileImage: text("profile_image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const signUpFormSchema = z.object({
    firstName: z.string().min(1, "* First name is required"),
    lastName: z.string().optional().nullable(),
    email: z.string().min(1, "* Email is required").email("* Invalid email address"),
    password: z.string().optional().nullable().or(z.string().min(6, "* Password must be at least 6 chars")),
    gender: z.enum(["male", "female"], {
        message: "* Gender is required"
    }),
    date: z.string().min(1),
    month: z.string().min(1),
    year: z.string().min(1),
    username: z.string()
        .min(3, "* Username must be at least 3 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "* Only letters, numbers, and underscores"),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;