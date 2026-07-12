"use server"
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@/utils/supabase/server";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"), 
    analytics: true,
});

export async function toggleLikeState(userId: string, postId: string, photoIndex: number | null, action: "like" | "unlike") {
    const { success } = await ratelimit.limit(`ratelimit_like_${userId}`);
    
    if (!success) {
        return { success: false, error: "You are liking too fast! Please slow down." };
    }

    const supabase = await createClient();

    try {
        if (action === "like") {
            const { error } = await supabase.from("likes").insert({
                user_id: userId,
                post_id: postId,
                photo_index: photoIndex
            });
            if (error && error.code !== '23505') throw error; // Ignore duplicate clicks
        } else {
            // Safely handle deleting with or without a photo index
            let query = supabase.from("likes").delete().match({ user_id: userId, post_id: postId });
            
            if (photoIndex === null) {
                query = query.is("photo_index", null);
            } else {
                query = query.eq("photo_index", photoIndex);
            }
            
            const { error } = await query;
            if (error) throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error("Like Action Error:", error);
        return { success: false, error: "Database error occurred." };
    }
}