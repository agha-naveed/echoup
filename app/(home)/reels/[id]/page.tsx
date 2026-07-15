import ReelsFeed from "@/components/ReelsFeed";

export const metadata = {
    title: "Reels | EchoUp",
    description: "Watch short-form videos from your favorite creators.",
};

export default async function ReelsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <main className="w-full md:h-[calc(100dvh_-_90px)] h-[calc(100dvh_-_150px)] overflow-hidden">
            <ReelsFeed initialReelId={id} />
        </main>
    );
}