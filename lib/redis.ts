import { Redis } from "@upstash/redis";

// Single shared Redis connection (sessions + rate limiting).
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
