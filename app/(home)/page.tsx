import CreatePost from "@/components/CreatePost";
import FeedPage from "@/components/Feed";
import db from "@/lib/db";
import { desc } from "drizzle-orm";
import { posts } from "@/db/schema/post";

export default async function page() {
  const initialPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    limit: 20,

    columns: {
      id: true,
      content: true,
      createdAt: true,
    },

    with: {
      author: {
        columns: {
          username: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        }
      }
    }
  });

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen">
      <CreatePost />
      <FeedPage initialPosts={initialPosts} />
    </div>
  )
}