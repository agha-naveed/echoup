import { pgTable, timestamp, uuid, primaryKey, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { posts } from "./post";

export const likes = pgTable("likes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    photoIndex: integer("photo_index")
});