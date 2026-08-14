// src/lib/api/reel-engine.ts

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
 * MOCK GENERATOR: Creates a temporary array of 10 interaction logs.
 * The 1D-CNN requires exactly 10 sequence steps to run inference.
 * (This will be replaced by real Supabase tracking data later).
 */
export const getRecentUserHistory = (): ReelInteraction[] => {
    return Array(10).fill({
        watch_pct: 0.85,
        loop_count: 2,
        liked: 1,
        commented: 0,
        dwell_time: 14.2
    });
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
    candidateReels: string[]
): Promise<{ reel_id: string, score: number }[]> => {
    
    // 1. If there are no candidate reels to rank, exit early
    if (candidateReels.length === 0) {
        return [];
    }

    try {
        const response = await fetch("http://localhost:8000/api/reels/rank", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_history: userHistory,
                candidate_reels: candidateReels
            }),
        });

        // 2. Handle FastAPI errors (e.g., passing 9 items instead of 10)
        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`FastAPI Error ${response.status}: ${errorDetails}`);
        }

        // 3. Parse and return the sorted data
        const data = await response.json();
        return data.ranked_feed;

    } catch (error) {
        console.error("AI Engine offline or failed. Falling back to chronological order.", error);
        
        // 4. Graceful Fallback: If Python is offline, return the reels 
        // in their original order with a dummy score of 0, so the UI doesn't crash.
        return candidateReels.map(id => ({ reel_id: id, score: 0 }));
    }
};