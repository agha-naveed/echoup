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
    limiter: Ratelimit.slidingWindow(5, "30 s"), 
    analytics: true,
});

export async function submitComment(userId: string, postId: string, content: string, photoIndex: number | null) {
    const { success } = await ratelimit.limit(`ratelimit_comment_${userId}`);
    
    if (!success) {
        return { success: false, error: "You are commenting too fast! Please wait a moment." };
    }

    const supabase = await createClient();

    try {
        const { error } = await supabase.from("comments").insert({
            author_id: userId,
            post_id: postId,
            content: content,
            photo_index: photoIndex
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Comment Action Error:", error);
        return { success: false, error: "Database error occurred." };
    }
}