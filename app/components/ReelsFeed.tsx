"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import ReelItem from "./ReelItem";
import { useUser } from "../context/UserContext";
import { fetchRankedFeed, getRecentUserHistory } from "@/lib/api/reel-engine";

interface ReelsFeedProps {
    initialReelId?: string;
}

const PAGE_SIZE = 5;

export default function ReelsFeed({ initialReelId }: ReelsFeedProps) {
    const supabase = useMemo(() => createClient(), []);
    const { user: currentUser } = useUser();

    const [isGlobalMuted, setIsGlobalMuted] = useState(true);
    const [globalVolume, setGlobalVolume] = useState(1);
    const [reels, setReels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Rank candidate videos through the AI engine or engagement fallback
    const rankCandidates = async (candidates: any[]) => {
        if (!candidates || candidates.length === 0) return [];

        try {
            const candidateIds = candidates.map((r) => r.id);
            const recentHistory = await getRecentUserHistory(currentUser?.id);
            const targetReelId = reels.length > 0 ? reels[reels.length - 1].id : null;

            const rankedResult = await fetchRankedFeed(recentHistory, candidateIds, targetReelId);

            if (rankedResult && rankedResult.length > 0) {
                const sorted = rankedResult
                    .map((ranked: { reel_id: string; score: number }) =>
                        candidates.find((r) => r.id === ranked.reel_id)
                    )
                    .filter(Boolean);
                return sorted;
            }
        } catch (err) {
            console.warn("AI ranking request failed, applying engagement fallback:", err);
        }

        // Fallback: Sort by like count if AI is unavailable or telemetry is empty
        return [...candidates].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    };

    // 1. Initial Load: Load first page and prioritize initialReelId
    useEffect(() => {
        const fetchInitialReels = async () => {
            setIsLoading(true);

            try {
                const { data: rawReels, error } = await supabase
                    .from("posts")
                    .select(`
                        id,
                        content,
                        video_url,
                        subtitles_vtt,
                        created_at,
                        author:users ( id, username, first_name, last_name, profile_image ),
                        likes ( user_id ),
                        like_count,
                        comment_count
                    `)
                    .eq("is_reel", true)
                    .order("created_at", { ascending: false })
                    .range(0, PAGE_SIZE - 1);

                if (error || !rawReels || rawReels.length === 0) {
                    setHasMore(false);
                    setIsLoading(false);
                    return;
                }

                const sortedReels = await rankCandidates(rawReels);

                if (initialReelId) {
                    const targetIndex = sortedReels.findIndex((r:any) => r.id === initialReelId);
                    if (targetIndex > -1) {
                        const [target] = sortedReels.splice(targetIndex, 1);
                        sortedReels.unshift(target);
                    } else {
                        // If initialReelId wasn't in the first page, fetch it directly
                        const { data: specificReel } = await supabase
                            .from("posts")
                            .select(`
                                id,
                                content,
                                video_url,
                                subtitles_vtt,
                                created_at,
                                author:users ( id, username, first_name, last_name, profile_image ),
                                likes ( user_id ),
                                like_count,
                                comment_count
                            `)
                            .eq("id", initialReelId)
                            .single();

                        if (specificReel) sortedReels.unshift(specificReel);
                    }
                }

                setReels(sortedReels);
                setPage(1);
            } catch (err) {
                console.error("Initial reel load failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialReels();
    }, [initialReelId, currentUser?.id]);

    // 2. Pagination: Load more reels using sequential range slices
    const loadMoreReels = useCallback(async () => {
        if (isFetching || !hasMore || isLoading) return;
        setIsFetching(true);

        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            const { data: rawReels, error } = await supabase
                .from("posts")
                .select(`
                    id,
                    content,
                    video_url,
                    subtitles_vtt,
                    created_at,
                    author:users ( id, username, first_name, last_name, profile_image ),
                    likes ( user_id ),
                    like_count,
                    comment_count
                `)
                .eq("is_reel", true)
                .order("like_count", { ascending: false })
                .range(from, to);

            if (error || !rawReels || rawReels.length === 0) {
                setHasMore(false);
                setIsFetching(false);
                return;
            }

            const sortedNewReels = await rankCandidates(rawReels);

            setReels((prev) => {
                const existingIds = new Set(prev.map((r) => r.id));
                const uniqueNewReels = sortedNewReels.filter((r:any) => !existingIds.has(r.id));

                if (uniqueNewReels.length === 0) {
                    setHasMore(false);
                }
                return [...prev, ...uniqueNewReels];
            });

            setPage((prev) => prev + 1);
        } catch (err) {
            console.error("Pagination error:", err);
        } finally {
            setIsFetching(false);
        }
    }, [page, isFetching, hasMore, isLoading, currentUser?.id]);

    // 3. Infinite Scroll Intersection Observer
    useEffect(() => {
        if (isLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetching) {
                    loadMoreReels();
                }
            },
            { threshold: 0.1 }
        );

        const target = loadMoreRef.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [loadMoreReels, isLoading, hasMore, isFetching]);

    if (isLoading) {
        return (
            <div className="w-75 h-full justify-self-center overflow-hidden bg-black">
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 animate-pulse">
                    <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                    <div className="w-32 h-4 bg-gray-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black text-white">
                <p className="text-gray-400 font-medium text-lg">No reels found. Be the first to upload one!</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full place-items-center overflow-y-auto snap-y snap-mandatory relative custom-scroll-hidden">
            {reels.map((reel) => (
                <ReelItem
                    key={reel.id}
                    reel={reel}
                    currentUser={currentUser}
                    globalMuted={isGlobalMuted}
                    onToggleMuted={() => setIsGlobalMuted(!isGlobalMuted)}
                    globalVolume={globalVolume}
                    onVolumeChange={setGlobalVolume}
                />
            ))}

            {hasMore && (
                <div
                    ref={loadMoreRef}
                    className={`w-75 shrink-0 bg-black ${isFetching ? "h-full snap-start" : "h-[1px]"}`}
                >
                    {isFetching && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 animate-pulse">
                            <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                            <div className="w-32 h-4 bg-gray-800 rounded"></div>
                        </div>
                    )}
                </div>
            )}

            {!hasMore && reels.length > 0 && (
                <div className="w-full h-full snap-start flex items-center justify-center bg-black text-gray-500 pb-10">
                    You've seen all the reels!
                </div>
            )}
        </div>
    );
}