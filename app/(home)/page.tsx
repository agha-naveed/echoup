import CreatePost from "@/components/CreatePost";
import FeedPage from "@/components/Feed";
import db from "@/lib/db";
import { desc } from "drizzle-orm";
import { posts } from "@/db/schema/post";

export default async function page() {
  const initialPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    limit: 20,
    with: {
      author: true
    }
  });

  return (
    <div className="md:w-fit max-w-[600px] w-full flex flex-col gap-5 min-h-screen">
      <CreatePost />
      <FeedPage initialPosts={initialPosts} />
    </div>
  )
}