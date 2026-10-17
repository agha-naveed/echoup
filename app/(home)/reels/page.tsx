// app/reels/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server"; // <-- MUST be /server for Server Components
import axios from "axios";

export const dynamic = "force-dynamic";

export default async function ReelsIndexPage() {
    const supabase = await createClient();
    
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    let targetReelId = null;

    if (user) {
        // 2A. If logged in, ask FastAPI for the personalized AI feed
        try {
            const res = await axios.post(process.env.BACKEND_URL+"/reels/feed", {
                user_id: user.id,
                limit: 10
            });
            
            if (res.data?.reels && res.data.reels.length > 0) {
                targetReelId = res.data.reels[0].id;
            }
        } catch (err) {
            console.error("FastAPI unreachable, falling back to database...", err);
        }
    }

    // 2B. Fallback if user is logged out or FastAPI fails
    if (!targetReelId) {
        const { data: reelsPool, error } = await supabase
            .from("posts")
            .select("id")
            .eq("is_reel", true)
            .limit(1);

        if (error || !reelsPool || reelsPool.length === 0) {
            return (
                <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
                    <p>No reels available right now.</p>
                </div>
            );
        }
        
        // Pick a random reel for unauthenticated users
        const randomIndex = Math.floor(Math.random() * reelsPool.length);
        targetReelId = reelsPool[randomIndex].id;
    }

    // 3. Instantly redirect to the highest-ranked (or random) reel
    redirect(`/reels/${targetReelId}`);
}