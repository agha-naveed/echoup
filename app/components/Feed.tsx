"use client";

import { useState } from "react";
import Post from "./post/Post";

export default function FeedPage({ initialPosts }: { initialPosts: any[] }) {

  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [newPosts, setNewPosts] = useState<any[]>([]);

  const handleShowNewPosts = () => {
    setPosts((prev) => [...newPosts, ...prev]);
    setNewPosts([]);
  };

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen relative">

      {newPosts.length > 0 && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-main-blue text-white px-4 py-2 rounded-full cursor-pointer shadow-[0_0_15px_rgba(91,171,247,0.4)] z-50 text-sm font-medium transition-all hover:-translate-y-1"
          onClick={handleShowNewPosts}
        >
          {newPosts.length} new post{newPosts.length > 1 ? "s" : ""}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No posts yet!</div>
      ) : (
        posts.map((post) => <Post key={post.id} post={post} />)
      )}

    </div>
  );
}