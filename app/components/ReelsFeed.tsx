"use client"
import Image from "next/image";
import { GoHeart, GoComment, GoShare } from "react-icons/go";
import Video from "./CustomVideoPlayer"; // Make sure this path is correct!

// Temporary dummy data to test the UI
const dummyReels = [
    { 
        id: 1, 
        url: "https://res.cloudinary.com/dpc7k1bpc/video/upload/v1783877591/xxggqatpdcztxt5u678o.mp4", 
        author: "Agha Naveed", 
        caption: "Testing the new EchoUp Reels feature! 🚀 #coding",
        likes: "1.2k",
        comments: "340"
    },
    { 
        id: 2, 
        url: "https://www.w3schools.com/html/mov_bbb.mp4", 
        author: "Tech Guru", 
        caption: "Next.js 15 is insane. Look at this.",
        likes: "8.9k",
        comments: "1.1k"
    },
];

export default function ReelsFeed() {
    return (
        <div className="w-full h-full overflow-y-auto snap-y snap-mandatory relative custom-scroll-hidden">
            {dummyReels.map((reel) => (
                <div key={reel.id} className="relative w-full h-full snap-start flex justify-center items-center">
                    
                    {/* UNIFIED WRAPPER: Acts as the "phone screen". 
                        Fills mobile screens completely, but locks to a perfect portrait ratio on desktop. */}
                    <div className="relative w-full h-full sm:w-[450px] sm:max-h-[100dvh] flex flex-col justify-center overflow-hidden bg-black border-x border-white/5">
                        
                        {/* The Custom Video Player */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Video 
                                src={reel.url} 
                                isReel={true} 
                            />
                        </div>

                        {/* The Interactive Overlay */}
                        <div className="absolute bottom-0 left-0 w-full pointer-events-none flex flex-col justify-end pb-20 sm:pb-6 px-4 z-20">
                            
                            {/* Protection Gradient: Ensures white text is readable even if the video is bright white */}
                            <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10 pointer-events-none" />

                            <div className="flex justify-between items-end w-full">
                                
                                {/* Left Side: Caption & User Info */}
                                <div className="flex flex-col text-white w-[75%] pointer-events-auto">
                                    <h3 className="font-bold text-[16px] mb-1 drop-shadow-lg">
                                        @{reel.author.replace(/\s+/g, '').toLowerCase()}
                                    </h3>
                                    <p className="text-[14px] font-medium drop-shadow-md leading-tight">
                                        {reel.caption}
                                    </p>
                                </div>

                                {/* Right Side: Action Buttons */}
                                <div className="flex flex-col gap-4 items-center pointer-events-auto pb-2">
                                    <div className="w-10 h-10 bg-dark-clr rounded-full border border-white overflow-hidden shadow-lg mb-2 cursor-pointer transition-transform hover:scale-105">
                                        <Image 
                                            src="https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480" 
                                            alt="Creator" 
                                            width={40} 
                                            height={40} 
                                            className="object-cover w-full h-full" 
                                        />
                                    </div>

                                    <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                        <div className="p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoHeart className="text-white text-[26px]" />
                                        </div>
                                        <span className="text-white text-[11px] font-semibold drop-shadow-md">{reel.likes}</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                        <div className="p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoComment className="text-white text-[24px]" />
                                        </div>
                                        <span className="text-white text-[11px] font-semibold drop-shadow-md">{reel.comments}</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1 group transition-transform hover:scale-110">
                                        <div className="p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoShare className="text-white text-[24px]" />
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