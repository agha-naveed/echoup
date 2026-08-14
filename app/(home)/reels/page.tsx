// app/reels/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Adjust to your path

// Force Next.js to run this fresh every single time someone visits
export const dynamic = "force-dynamic";

export default async function ReelsIndexPage() {
    const supabase = createClient()
    // 1. Fetch a pool of reels (e.g., the 50 most recent ones to keep it fresh)
    const { data: reelsPool, error } = await supabase
        .from("posts") // (or "posts", depending on your schema)
        .select("id")
        .limit(50).eq("is_reel", true);

        console.log(error, reelsPool)

    // 2. Fallback if the database is empty
    if (error || !reelsPool || reelsPool.length === 0) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
                <p>No reels available right now.</p>
            </div>
        );
    }

    // 3. Pick a completely random reel from the pool
    const randomIndex = Math.floor(Math.random() * reelsPool.length);
    const randomReel = reelsPool[randomIndex];
    console.log(randomReel)

    // 4. Instantly redirect to that specific random reel's URL!
    redirect(`/reels/${randomReel.id}`);
}