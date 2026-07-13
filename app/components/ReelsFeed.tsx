"use client"
import Image from "next/image";
import { GoHeart, GoComment, GoShare } from "react-icons/go";
import Video from "./CustomVideoPlayer"; // Make sure this path is correct!
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";


export default function ReelsFeed() {
    const [isGlobalMuted, setIsGlobalMuted] = useState(true);

    const [reels, setReels] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const supabase = createClient()

    useEffect(() => {
        const fetchReelsData = async () => {
            // 1. Get the current user (so we know who is liking the videos)
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

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
                    likes_count:likes ( count ),
                    comments_count:comments ( count )
                `)
                .eq("is_reel", true)
                .order("created_at", { ascending: false });


            if (error) {
                console.error("Error fetching reels:", error);
            } else {
                setReels(data || []);
            }
            setIsLoading(false);
        };

        fetchReelsData();
    }, [supabase]);
    
    return (
        <div className="w-full h-full overflow-y-auto snap-y snap-mandatory relative custom-scroll-hidden">
            {reels.map((reel) => (
                // Parent wrapper for scrolling snap (always full screen)
                <div key={reel.id} className="relative w-full h-full snap-start flex justify-center items-center sm:py-1">
                    
                    <div className="relative w-fit h-full flex flex-col justify-center overflow-hidden sm:rounded-xl bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        
                        <Video src={reel.video_url} isReel={true} globalMuted={isGlobalMuted}
                            onToggleMuted={() => setIsGlobalMuted(!isGlobalMuted)} />

                        <div className="absolute bottom-0 left-0 w-full pointer-events-none flex flex-col justify-end pb-4 px-3 sm:px-4 z-20">
                            
                            <div className="absolute bottom-0 left-0 w-full h-[80%] bg-linear-to-t from-black/80 via-black/30 to-transparent -z-10 pointer-events-none" />

                            <div className="flex justify-between items-end w-full">
                                <div className="flex flex-col text-white w-[75%] pointer-events-auto">
                                    <h3 className="font-bold text-[15px] sm:text-[16px] mb-1 drop-shadow-lg">
                                        @{reel.author.username}
                                    </h3>
                                    <p className="text-[13px] sm:text-[14px] font-medium drop-shadow-md leading-tight line-clamp-2">
                                        {reel.content}
                                    </p>
                                </div>

                                {/* Right Side: Action Buttons */}
                                <div className="flex flex-col gap-3 sm:gap-4 items-center pointer-events-auto pb-1 sm:pb-2">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-dark-clr rounded-full border border-white overflow-hidden shadow-lg mb-1 sm:mb-2 cursor-pointer transition-transform hover:scale-105">
                                        <Image 
                                            src="https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480" 
                                            alt="Creator" 
                                            width={40} 
                                            height={40} 
                                            className="object-cover w-full h-full" 
                                        />
                                    </div>

                                    <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                        <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoHeart className="text-white text-[22px] sm:text-[26px]" />
                                        </div>
                                        <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">{reel?.likes.length}</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                        <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoComment className="text-white text-[20px] sm:text-[24px]" />
                                        </div>
                                        <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">{2}</span>
                                    </button>

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
            ))}
        </div>
    );
}