import { pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./user";
import { posts } from "./post";

export const shares = pgTable("shares", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.postId] }),
    };
});