import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const posts = pgTable("posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    imageUrl: text("image_url").array(),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});