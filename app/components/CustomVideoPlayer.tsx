"use client"
import { useRef, useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    isReel?: boolean; // If true, it fills the screen. If false, it fits a standard post.
    isPost?: boolean;
}

export default function Video({ src, poster, isReel = false, isPost = false }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Autoplay requires video to be muted initially
    const [progress, setProgress] = useState(0);

    // 1. Play/Pause Logic
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // 2. Mute/Unmute Logic
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents the video from pausing when clicking mute
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // 3. Update Progress Bar
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    // 4. Auto-Pause when scrolled out of view (Intersection Observer)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.4 } // Triggers when less than 40% of the video is visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={containerRef}
            className={`relative flex justify-center overflow-hidden cursor-pointer group ${
                isReel ? "w-fit h-full bg-transparent items-center" : "h-[85%] w-full bg-black rounded-xl border border-main-border"
            }
            ${isPost && "max-h-125 items-center"}`}
            onClick={togglePlay}
        >
            {/* THE ACTUAL VIDEO (Controls Hidden) */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                loop
                playsInline
                muted={isMuted} // Controlled by our React state
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className={`w-full h-fit ${isReel ? "object-cover sm:max-w-112.5" : "object-contain"}`}
            />

            {/* BIG PLAY BUTTON OVERLAY (Shows only when paused) */}
            {!isPlaying && (
                <div className={`absolute inset-0 flex items-center justify-center ${isReel ? "bg-transparent" : "bg-black/20"} transition-opacity`}>
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 shadow-xl border border-white/20 pl-1">
                        <FaPlay className="text-2xl" />
                    </div>
                </div>
            )}

            {/* MUTE / UNMUTE BUTTON (Top Right) */}
            <button 
                onClick={toggleMute}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 hover:bg-black/70 transition-colors z-10"
            >
                {isMuted ? <IoVolumeMute size={20} /> : <IoVolumeHigh size={20} />}
            </button>

            {/* BOTTOM PROGRESS BAR */}
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10 ${isReel ? "sm:max-w-[450px] mx-auto right-0" : ""}`}>
                <div 
                    className="h-full bg-main-blue transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}