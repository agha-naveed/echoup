"use client"
import Image from "next/image";
import { GoHeart, GoComment, GoShare } from "react-icons/go";
import Video from "./CustomVideoPlayer"; // Make sure this path is correct!
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ReelItem from "./ReelItem";
import { useUser } from "../context/UserContext";


interface ReelsFeedProps {
    initialReelId?: string;
}

export default function ReelsFeed({ initialReelId }: ReelsFeedProps) {

    const [isGlobalMuted, setIsGlobalMuted] = useState(true);
    const [globalVolume, setGlobalVolume] = useState(1);

    const [reels, setReels] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const supabase = createClient()
    const user = useUser();

    useEffect(() => {
        const fetchReelsData = async () => {
            // 1. Get the current user (so we know who is liking the videos)

            setCurrentUser(user?.user);

            // 2. Fetch all posts where is_reel is true
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
                        setReels(data); // Fallback just in case the ID is invalid
                    }
                } else {
                    setReels(data); // Normal chronological feed
                }
            }
            setIsLoading(false);
        };

        fetchReelsData();
    }, [initialReelId, supabase, user]);

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
        </div>
    );
}