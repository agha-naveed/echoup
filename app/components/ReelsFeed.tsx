"use client"
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ReelItem from "./ReelItem";
import { useUser } from "../context/UserContext";
import { fetchRankedFeed, getRecentUserHistory } from "@/lib/api/reel-engine";


interface ReelsFeedProps {
    initialReelId?: string;
}

export default function ReelsFeed({ initialReelId }: ReelsFeedProps) {

    const supabase = createClient()
    const user = useUser();

    // 1. ALL HOOKS MUST GO HERE AT THE TOP
    const [isGlobalMuted, setIsGlobalMuted] = useState(true);
    const [globalVolume, setGlobalVolume] = useState(1);
    const [reels, setReels] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const [hasMore, setHasMore] = useState(true);

    // 2. DEFINE FUNCTIONS
    const loadMoreReels = async () => {
        console.log("🔥 TRIGGERED: loadMoreReels function is running!");
        if (isFetching) return;
        setIsFetching(true);

        const startRange = 5 + ((page - 1) * 3);
        const endRange = startRange + 2;

        console.log("before fetching from posts")
        // Fetch raw next 10 reels from Supabase
        try {
            const { data: rawReels, error } = await supabase
                .from("posts") 
                .select(`
                        id,
                        content,
                        video_url,
                        created_at,
                        author:users ( id, username, first_name, last_name, profile_image ),
                        likes ( user_id ),
                        like_count,
                        comment_count
                    `)
                .range(startRange, endRange)
                .order("created_at", { ascending: false }).eq("is_reel", true);

                console.log("fetched from posts")

            if (error || !rawReels || rawReels.length === 0) {
                console.log("No more reels to fetch or database error.");
                setHasMore(false);
                setIsFetching(false);
                return;
            }
        

        const candidateIds = rawReels.map(r => r.id);
        
        // Fetch real history
        const recentHistory = await getRecentUserHistory(currentUser?.id); 

        // --- NEW: Get the last watched video's ID ---
        const targetReelId = reels.length > 0 ? reels[reels.length - 1].id : null;

        console.log("before fetchRanedFeed")
        // Fetch AI rankings
        const rankedResult = await fetchRankedFeed(recentHistory, candidateIds, targetReelId);
        console.log("After fetchRanedFeed")
        console.log(rankedResult)
        

        const sortedReels = rankedResult.map((ranked: { reel_id: string, score: number }) => 
            rawReels.find(r => r.id === ranked.reel_id)
        ).filter(Boolean); 

        let addedCount = 0;
        // Update UI and increment page
        // setReels(prev => [...prev, ...sortedReels]);
        setReels(prev => {
            // Only keep reels that don't already exist in the current feed
            const uniqueReels = sortedReels.filter((newReel:any) => 
                !prev.some(existingReel => existingReel.id === newReel.id)
            );
            addedCount = uniqueReels.length;
            console.log(`📍 CHECKPOINT 6: Added ${addedCount} new unique videos to the screen!`);
            return [...prev, ...uniqueReels];
        });
        setPage(prev => prev + 1);
        setIsFetching(false);

        if (addedCount === 0 && rawReels.length > 0) {
            console.log("⚠️ ALL DUPLICATES FOUND. Instantly fetching the next page...");
            
            // We wrap it in a tiny timeout to let the React state (page + 1) settle first
            setTimeout(() => {
                const scrollContainer = document.querySelector('.custom-scroll-hidden');
                // Nudge the scroll slightly to re-trigger the observer
                if (scrollContainer) scrollContainer.scrollTop += 1; 
            }, 100);
        }
        } catch(err) {
            console.log(err)
        }
    };

    // 3. ALL USE-EFFECTS GO HERE
    useEffect(() => {
        const fetchReelsData = async () => {
            setCurrentUser(user?.user);

            const { data, error } = await supabase
                .from("posts")
                .select(`
                    id,
                    content,
                    video_url,
                    created_at,
                    author:users ( id, username, first_name, last_name, profile_image ),
                    likes ( user_id ),
                    like_count,
                    comment_count
                `)
                .eq("is_reel", true)
                .order("created_at", { ascending: false }).limit(5);

            if (error) {
                console.error("Error fetching reels:", error);
            }
            else if (data) {
                if (initialReelId) {
                    const targetReel = data.find(reel => reel.id === initialReelId);
                    const otherReels = data.filter(reel => reel.id !== initialReelId);
                    
                    if (targetReel) {
                        const shuffledOthers = otherReels.sort(() => Math.random() - 0.5);
                        setReels([targetReel, ...shuffledOthers]);
                    } else {
                        setReels(data.sort(() => Math.random() - 0.5)); 
                    }
                } else {
                    const shuffledData = [...data].sort(() => Math.random() - 0.5);
                    setReels(shuffledData);
                }
            }

            const feedContainer = document.querySelector('.custom-scroll-hidden');
            if (feedContainer) {
                feedContainer.scrollTo(0, 0);
            }

            setIsLoading(false);
        };

        fetchReelsData();
    }, [initialReelId, supabase, user]);

    useEffect(() => {
        // 1. Prevent the observer from running while the initial spinner is active
        if (isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                console.log("hahhaa")
                const [entry] = entries;
                // 2. Fire the AI ranking request when the user hits the bottom
                if (entry.isIntersecting && !isFetching) {
                    loadMoreReels(); 
                }
            },
            { threshold: 0.1 } 
        );

        // 3. Attach the observer to the div
        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        // Cleanup
        return () => observer.disconnect();
        
    // 4. CRITICAL FIX: Add `isLoading`, `reels`, and `page` to the dependencies.
    // This ensures the observer attaches AFTER the spinner disappears, 
    // and guarantees loadMoreReels never uses stale data.
    }, [isLoading, isFetching, page, reels, hasMore]);

    // -------------------------------------------------------------
    // 4. CONDITIONAL RETURNS MUST BE PLACED AFTER ALL HOOKS
    // -------------------------------------------------------------

    if (isLoading) {
        return (
            <div className="w-75 h-full justify-self-center overflow-hidden bg-black">
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 animate-pulse">
                    <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                    <div className="w-32 h-4 bg-gray-800 rounded"></div>
                    
                    {/* Fake Sidebar Skeleton */}
                    <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                        <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                        <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                        <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                    </div>
                    {/* Fake Bottom Text Skeleton */}
                    <div className="absolute left-4 bottom-4 flex flex-col gap-3">
                        <div className="w-32 h-4 bg-gray-800 rounded"></div>
                        <div className="w-48 h-3 bg-gray-800 rounded"></div>
                    </div>
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

    // 5. FINAL COMPONENT RETURN
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
                    // When fetching, it becomes a full-screen snap point. When not, it's a tiny invisible tripwire.
                    className={`w-75 shrink-0 bg-black ${isFetching ? 'h-full snap-start' : 'h-[1px]'}`}
                >
                    {isFetching && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 animate-pulse">
                            <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                            <div className="w-32 h-4 bg-gray-800 rounded"></div>
                            
                            {/* Fake Sidebar Skeleton */}
                            <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                            </div>
                            {/* Fake Bottom Text Skeleton */}
                            <div className="absolute left-4 bottom-4 flex flex-col gap-3">
                                <div className="w-32 h-4 bg-gray-800 rounded"></div>
                                <div className="w-48 h-3 bg-gray-800 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* End of feed message */}
            {!hasMore && reels.length > 0 && (
                <div className="w-full h-full snap-start flex items-center justify-center bg-black text-gray-500 pb-10">
                    You've seen all the reels!
                </div>
            )}
        </div>
    );
}