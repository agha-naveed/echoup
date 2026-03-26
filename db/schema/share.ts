import { pgTable, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { posts } from "./post";

export const shares = pgTable("shares", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    photoIndex: integer("photo_index"), // Add this!
    createdAt: timestamp("created_at").defaultNow().notNull(),
});