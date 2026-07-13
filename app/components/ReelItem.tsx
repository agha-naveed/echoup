"use client"
import Image from "next/image";
import { useState } from "react";
import { GoHeart, GoComment, GoShare } from "react-icons/go";
import { FaHeart } from "react-icons/fa"; // Using FontAwesome for the solid red heart
import Video from "./CustomVideoPlayer";
import { createClient } from "@/utils/supabase/client";

interface ReelItemProps {
    reel: any;
    currentUser: any;
    globalMuted: boolean;
    onToggleMuted: () => void;
}

export default function ReelItem({ reel, currentUser, globalMuted, onToggleMuted }: ReelItemProps) {
    const supabase = createClient();
    
    // Check if the current user's ID exists in the likes array we fetched
    const hasLikedInitially = reel.likes?.some((like: any) => like.user_id === currentUser?.id);
    
    const [isLiked, setIsLiked] = useState(hasLikedInitially);
    const [likeCount, setLikeCount] = useState(reel.likes?.[0]?.count || 0);

    const handleLikeToggle = async () => {
        if (!currentUser) return; // Must be logged in to like

        // 1. Optimistic UI Update (Instant visual feedback)
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);

        // 2. Database Action in the background
        if (newIsLiked) {
            // Insert like
            const { error } = await supabase
                .from("likes")
                .insert({ 
                    post_id: reel.id, 
                    user_id: currentUser.id 
                });
            
            if (error) console.error("Error liking:", error);
        } else {
            // Remove like
            const { error } = await supabase
                .from("likes")
                .delete()
                .match({ post_id: reel.id, user_id: currentUser.id });
                
            if (error) console.error("Error unliking:", error);
        }
    };

    return (
        <div className="relative w-full h-full snap-start flex justify-center items-center sm:py-1">
            <div className="relative w-fit h-full flex flex-col justify-center overflow-hidden sm:rounded-xl bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                
                <Video 
                    src={reel.video_url} 
                    isReel={true} 
                    globalMuted={globalMuted}
                    onToggleMuted={onToggleMuted}
                />

                <div className="absolute bottom-0 left-0 w-full pointer-events-none flex flex-col justify-end pb-4 px-3 sm:px-4 z-20">
                    <div className="absolute bottom-0 left-0 w-full h-[80%] bg-linear-to-t from-black/80 via-black/30 to-transparent -z-10 pointer-events-none" />

                    <div className="flex justify-between items-end w-full">
                        {/* Caption & User Info */}
                        <div className="flex flex-col text-white w-[75%] pointer-events-auto">
                            <h3 className="font-bold text-[15px] sm:text-[16px] mb-1 drop-shadow-lg">
                                @{reel.author?.username || reel.author?.first_name?.toLowerCase()}
                            </h3>
                            <p className="text-[13px] sm:text-[14px] font-medium drop-shadow-md leading-tight line-clamp-2">
                                {reel.content}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:gap-4 items-center pointer-events-auto pb-1 sm:pb-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-dark-clr rounded-full border border-white overflow-hidden shadow-lg mb-1 sm:mb-2 cursor-pointer transition-transform hover:scale-105">
                                {reel.author?.profile_image ? (
                                    <Image src={reel.author.profile_image} alt="Creator" width={40} height={40} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full bg-main-blue flex justify-center items-center text-white font-bold">
                                        {reel.author?.first_name?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>

                            {/* THE LIKE BUTTON */}
                            <button 
                                onClick={handleLikeToggle}
                                className="flex flex-col items-center gap-1 group transition-transform hover:scale-110 active:scale-95"
                            >
                                <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 transition-colors">
                                    {isLiked ? (
                                        <FaHeart className="text-red-500 text-[22px] sm:text-[26px] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    ) : (
                                        <GoHeart className="text-white text-[22px] sm:text-[26px]" />
                                    )}
                                </div>
                                <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">
                                    {likeCount}
                                </span>
                            </button>

                            {/* Comment Button (Placeholder for later) */}
                            <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                    <GoComment className="text-white text-[20px] sm:text-[24px]" />
                                </div>
                                <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">
                                    {reel.comments?.[0]?.count || 0}
                                </span>
                            </button>

                            {/* Share Button (Placeholder for later) */}
                            <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                    <GoShare className="text-white text-[20px] sm:text-[24px]" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}