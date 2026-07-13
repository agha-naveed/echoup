"use client"
import { useRef, useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    isReel?: boolean; 
    isPost?: boolean;
    // NEW: Allow the parent to control the mute state
    globalMuted?: boolean; 
    onToggleMuted?: () => void; 
}

export default function Video({ src, poster, isReel = false, isPost = false, globalMuted, onToggleMuted }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // BACKUP LOCAL STATE: Only used if globalMuted isn't provided
    const [localMuted, setLocalMuted] = useState(true); 

    // Determine which mute state we are actually using
    const isCurrentlyMuted = globalMuted !== undefined ? globalMuted : localMuted;

    // 1. Play/Pause Logic (Remains unchanged)
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => console.log(e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    // 2. NEW: Mute/Unmute Logic
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (onToggleMuted) {
            // Tell the parent feed to toggle the global mute
            onToggleMuted();
        } else {
            // Fallback for standard posts
            setLocalMuted(!localMuted);
        }
    };

    // 3. NEW: Force the video HTML element to sync with our React state
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isCurrentlyMuted;
        }
    }, [isCurrentlyMuted]);

    // Update Progress Bar
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    // Auto-Play / Auto-Pause based on scroll visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().then(() => {
                                setIsPlaying(true);
                            }).catch((err) => console.log("Autoplay blocked by browser:", err));
                        }
                    } else {
                        if (videoRef.current && !videoRef.current.paused) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }
                    }
                });
            },
            { threshold: 0.6 } 
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative h-full flex justify-center overflow-hidden cursor-pointer group ${isReel ? "w-fit bg-transparent items-center" : "h-[85%] bg-black rounded-xl border border-main-border"} ${isPost && "max-h-125 items-center"}`}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                loop
                playsInline
                muted={isCurrentlyMuted} // Controlled by our synced state
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className={`max-w-full ${isReel ? "w-auto h-auto max-h-[calc(100vh-120px)] sm:max-w-[450px]" : "w-full h-fit object-contain"}`}
            />

            {!isPlaying && (
                <div className={`absolute inset-0 flex items-center justify-center ${isReel ? "bg-black/10" : "bg-black/20"} transition-opacity`}>
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 shadow-xl border border-white/20 pl-1">
                        <FaPlay className="text-2xl" />
                    </div>
                </div>
            )}

            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 hover:bg-black/70 transition-colors z-10"
            >
                {/* Check the synced state for the icon */}
                {isCurrentlyMuted ? <IoVolumeMute size={20} /> : <IoVolumeHigh size={20} />}
            </button>

            <div className={`absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10`}>
                <div
                    className="h-full bg-main-blue transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}