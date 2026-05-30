import CreatePost from "@/components/CreatePost";
import FeedPage from "@/components/Feed";
import { posts } from "@/types/database";

export default async function page() {
  const initialPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    limit: 20,

    columns: {
      id: true,
      content: true,
      createdAt: true,
      imageUrl: true
    },

    with: {
      author: {
        columns: {
          username: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        }
      },
      likes: true,
      comments: {
        with: {
          author: {
            columns: {
              username: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: (comments, { desc }) => [desc(comments.createdAt)]
      },
      shares: true
    },
  });

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen">
      <CreatePost />
      <FeedPage initialPosts={initialPosts} />
    </div>
  )
}