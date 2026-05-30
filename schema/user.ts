import { z } from "zod";

export const signUpFormSchema = z.object({
    firstName: z.string().min(1, "* First name is required"),
    lastName: z.string().optional().nullable(),
    email: z.string().min(1, "* Email is required").email("* Invalid email address"),
    password: z.string().optional().nullable().or(z.string().min(6, "* Password must be at least 6 chars")),
    
    // Note: I made these optional so the form doesn't crash 
    // when Google users skip Step 1!
    gender: z.enum(["male", "female"], {
        message: "* Gender is required"
    }).optional(),
    date: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
    
    username: z.string()
        .min(3, "* Username must be at least 3 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "* Only letters, numbers, and underscores"),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;