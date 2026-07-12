"use server"
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@/utils/supabase/server";

// 1. Initialize Redis Connection
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "10 s"), 
    analytics: true,
});

export async function toggleFollowState(followerId: string, followingId: string, action: "follow" | "unfollow") {
    // 3. Check Redis Rate Limit using the user's ID
    const { success } = await ratelimit.limit(`ratelimit_follow_${followerId}`);
    
    if (!success) {
        return { success: false, error: "Rate limit exceeded. Please wait a moment." };
    }

    const supabase = await createClient();

    try {
        if (action === "follow") {
            const { error } = await supabase.from("follows").insert({
                follower_id: followerId,
                following_id: followingId
            });
            // Ignore duplicate key errors if they double-clicked somehow
            if (error && error.code !== '23505') throw error; 
        } else {
            const { error } = await supabase.from("follows").delete()
                .match({ follower_id: followerId, following_id: followingId });
            
            if (error) throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error("Follow Action Error:", error);
        return { success: false, error: "Database error occurred." };
    }
}