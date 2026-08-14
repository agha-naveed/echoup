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

    // 2. DEFINE FUNCTIONS
    const loadMoreReels = async () => {
        if (isFetching) return;
        setIsFetching(true);

        // Fetch raw next 10 reels from Supabase
        const { data: rawReels, error } = await supabase
            .from("posts") 
            .select("*")
            .range(page * 10, (page + 1) * 10 - 1)
            .order("created_at", { ascending: false }).eq("is_reel", true);

        if (error || !rawReels || rawReels.length === 0) {
            console.log("No more reels to fetch or database error.");
            setIsFetching(false);
            return;
        }

        const candidateIds = rawReels.map(r => r.id);
        
        // Fetch real history
        const recentHistory = await getRecentUserHistory(currentUser?.id); 

        // Fetch AI rankings
        const rankedResult = await fetchRankedFeed(recentHistory, candidateIds);

        const sortedReels = rankedResult.map((ranked: { reel_id: string, score: number }) => 
            rawReels.find(r => r.id === ranked.reel_id)
        ).filter(Boolean); 

        // Update UI and increment page
        setReels(prev => [...prev, ...sortedReels]);
        setPage(prev => prev + 1);
        setIsFetching(false);
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
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching reels:", error);
            }
            else if (data) {
                if (initialReelId) {
                    const targetReel = data.find(reel => reel.id === initialReelId);
                    const otherReels = data.filter(reel => reel.id !== initialReelId);
                    
                    if (targetReel) {
                        setReels([targetReel, ...otherReels]);
                    } else {
                        setReels(data); 
                    }
                } else {
                    setReels(data); 
                }
            }
            setIsLoading(false);
        };

        fetchReelsData();
    }, [initialReelId, supabase, user]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isFetching) {
                    loadMoreReels(); 
                }
            },
            { threshold: 0.1 } 
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [isFetching, page]); 

    // -------------------------------------------------------------
    // 4. CONDITIONAL RETURNS MUST BE PLACED AFTER ALL HOOKS
    // -------------------------------------------------------------

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-main-blue mb-4" />
                <p className="text-gray-400 font-medium">Loading Reels...</p>
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
        <div className="w-full h-full overflow-y-auto snap-y snap-mandatory relative custom-scroll-hidden">
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
            <div ref={loadMoreRef} className="w-full h-20 flex items-center justify-center snap-start shrink-0">
                {isFetching && (
                    <div className="w-8 h-8 border-4 border-main-blue border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>
        </div>
    );
}