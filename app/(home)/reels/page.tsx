import ReelsFeed from "@/components/ReelsFeed";

export const metadata = {
    title: "Reels | EchoUp",
    description: "Watch short-form videos from your favorite creators.",
};

export default function ReelsPage() {
    return (
        <main className="w-full h-[calc(100dvh_-_90px)] overflow-hidden">
            <ReelsFeed />
        </main>
    );
}