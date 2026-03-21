"use client";

import { useEffect, useState } from "react";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import PostSkeleton from "../components/skeleton/PostSkeleton";

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPosts, setNewPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial posts
  
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const res = await fetch("/api/demo", { cache: "no-store" });
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  // Poll for new posts in the background
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (posts.length === 0) return;

  //     const lastId = posts[0].id;
  //     const res = await fetch(`/api/posts?after=${lastId}`, { cache: "no-store" });
  //     const data = await res.json();

  //     if (data.length > 0) {
  //       setNewPosts(data);
  //     }
  //   }, 5000); // poll every 5s

  //   return () => clearInterval(interval);
  // }, [posts]);


  const handleShowNewPosts = () => {
    setPosts((prev) => [...newPosts, ...prev]);
    setNewPosts([]);
  };

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen">
        
      {/* New Posts Banner */}
      {newPosts.length > 0 && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer shadow-lg z-50"
          onClick={handleShowNewPosts}
        >
          {newPosts.length} new post{newPosts.length > 1 ? "s" : ""}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <>
          <PostSkeleton variant="text" />
          <PostSkeleton variant="text-image" />
        </>
      ) : (
        posts.map((post) => <Post key={post.id} post={post} />)
      )}
    </div>
  );
}
