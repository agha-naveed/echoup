import CreatePost from "@/components/CreatePost";
import FeedPage from "@/components/Feed";

export default function page() {
  return (
    <div className="md:w-fit max-w-[600px] w-full flex flex-col gap-5 min-h-screen">
      <CreatePost />
      <FeedPage />
    </div>
  )
}