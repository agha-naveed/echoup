import axios from "axios";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function getRecentUserHistory(userId: string | undefined) {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from("reel_interactions")
        // <-- Make sure it asks for reel_id here
        .select("reel_id, watch_pct, loop_count, liked, commented, dwell_time") 
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
    
    if (error || !data) {
        console.error("Failed to fetch user history:", error);
        return [];
    }
    
    const chronologicalData = data.reverse();

    return chronologicalData.map(item => [
        item.watch_pct || 0,
        item.loop_count || 0,
        item.liked || 0,
        item.commented || 0,
        item.dwell_time || 0
    ]);
}
// 2. Send candidates and history to FastAPI for 1D-CNN + MobileNetV2 scoring
export async function fetchRankedFeed(history: number[][], candidateIds: string[], targetReelId: string | null) {
    if (!candidateIds || candidateIds.length === 0) return [];

    try {
        const res = await axios.post("http://127.0.0.1:8000/api/reels/rank", {
            history: history,
            candidate_ids: candidateIds,
            target_reel_id: targetReelId
        });
        
        return res.data; // Expected: [{ reel_id: "...", score: 0.95 }, ...]
    } catch (error) {
        console.warn("FastAPI ranking failed, using neutral fallback:", error);
        return candidateIds.map(id => ({ reel_id: id, score: 0.5 }));
    }
}