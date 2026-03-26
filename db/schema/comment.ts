import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { posts } from "./post";

export const comments = pgTable("comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    photoIndex: integer("photo_index"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});