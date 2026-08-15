import { createClient } from "@/utils/supabase/client"

/**
 * Defines the exact shape of behavioral data expected by the 
 * Python 1D-CNN FastAPI backend.
 */
export interface ReelInteraction {
    watch_pct: number;
    loop_count: number;
    liked: number;       // 0 or 1
    commented: number;   // 0 or 1
    dwell_time: number;  // in seconds
}

/**
 * Generates neutral baseline data for new users who haven't watched 10 reels yet.
 */
const getNeutralPadding = (count: number): ReelInteraction[] => {
    return Array(count).fill({
        watch_pct: 0.5,     // Watched half the video
        loop_count: 1,      // Didn't loop
        liked: 0,           // No interaction
        commented: 0,       // No interaction
        dwell_time: 5.0     // Scrolled past at average speed
    });
};

/**
 * MOCK GENERATOR: Creates a temporary array of 10 interaction logs.
 * The 1D-CNN requires exactly 10 sequence steps to run inference.
 * (This will be replaced by real Supabase tracking data later).
 */
export const getRecentUserHistory = async (userId: string | undefined): Promise<ReelInteraction[]> => {
    if(!userId) return getNeutralPadding(10);
    
    const supabase = createClient()
    
    try {
        const { data, error } = await supabase
            .from("reel_interactions")
            .select("watch_pct, loop_count, liked, commented, dwell_time")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Database error fetching history:", error);
            return getNeutralPadding(10);
        }

        let history = data || [];

        // COLD START FIX: If they have less than 10 logs, pad the rest of the array
        if (history.length < 10) {
            const paddingNeeded = 10 - history.length;
            history = [...history, ...getNeutralPadding(paddingNeeded)];
        }

        return history;

    } catch (err) {
        console.error("Failed to process history:", err);
        return getNeutralPadding(10);
    }
};

/**
 * Sends the user's interaction history and a batch of raw candidate
 * reel IDs to the FastAPI microservice for AI sorting.
 * 
 * @param userHistory - Array of 10 ReelInteraction objects
 * @param candidateReels - Array of raw Supabase Reel UUIDs
 * @returns An array of objects containing the reel_id and its AI score, sorted highest to lowest.
 */
export const fetchRankedFeed = async (
    userHistory: ReelInteraction[], 
    candidateReels: string[],
    targetReelId?: string | null
): Promise<{ reel_id: string, score: number }[]> => {
    
    // 1. If there are no candidate reels to rank, exit early
    if (candidateReels.length === 0) {
        return [];
    }

    const formattedHistory = userHistory.map(interaction => [
        interaction.watch_pct,
        interaction.loop_count,
        interaction.liked,
        interaction.commented,
        interaction.dwell_time
    ]);

    try {
        const response = await fetch("http://localhost:8000/api/reels/rank", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                history: formattedHistory,
                candidate_ids: candidateReels,
                target_reel_id: targetReelId || null
            }),
        });

        // 2. Handle FastAPI errors (e.g., passing 9 items instead of 10)
        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`FastAPI Error ${response.status}: ${errorDetails}`);
        }

        // 3. Parse and return the sorted data
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("AI Engine offline or failed. Falling back to chronological order.", error);
        
        // 4. Graceful Fallback: If Python is offline, return the reels 
        // in their original order with a dummy score of 0, so the UI doesn't crash.
        return candidateReels.map(id => ({ reel_id: id, score: 0 }));
    }
};