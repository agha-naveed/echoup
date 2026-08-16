"use client"
import React, { useRef, useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    isReel?: boolean; 
    isPost?: boolean;
    globalMuted?: boolean; 
    maxTimeWatched?: React.MutableRefObject<number>;
    loopCount?: React.MutableRefObject<number>;
    onToggleMuted?: () => void; 
    globalVolume?: number;
    onVolumeChange?: (newVolume: number) => void;
    style?: string;
    setIsVideoLoaded?: any;
}

export default function Video({ src, poster, isReel = false, isPost = false, globalMuted, onToggleMuted, globalVolume, onVolumeChange, style, maxTimeWatched, loopCount, setIsVideoLoaded }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // BACKUP LOCAL STATES
    const [localMuted, setLocalMuted] = useState(true); 
    const [localVolume, setLocalVolume] = useState(1);

    // Determine which states we are actually using (Global vs Local)
    const isCurrentlyMuted = globalMuted !== undefined ? globalMuted : localMuted;
    const currentVolume = globalVolume !== undefined ? globalVolume : localVolume;

    // Play/Pause Logic
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

    // Mute/Unmute Logic
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        
        // UX Fix: If they click unmute but volume is 0, give them 100% volume
        if (isCurrentlyMuted && currentVolume === 0) {
            if (onVolumeChange) onVolumeChange(1);
            else setLocalVolume(1);
        }

        if (onToggleMuted) {
            onToggleMuted();
        } else {
            setLocalMuted(!localMuted);
        }
    };

    // Handle Volume Slider Changes
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        
        // Update the volume state (Global or Local)
        if (onVolumeChange) {
            onVolumeChange(newVolume);
        } else {
            setLocalVolume(newVolume);
        }
        
        // Auto-mute if dragged to 0
        if (newVolume === 0 && !isCurrentlyMuted) {
            if (onToggleMuted) onToggleMuted();
            else setLocalMuted(true);
        } 
        // Auto-unmute if dragged above 0 while currently muted
        else if (newVolume > 0 && isCurrentlyMuted) {
            if (onToggleMuted) onToggleMuted();
            else setLocalMuted(false);
        }
    };

    // Force the video HTML element to sync with our React states
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isCurrentlyMuted;
            videoRef.current.volume = currentVolume; // Sync HTML volume with React state
        }
    }, [isCurrentlyMuted, currentVolume]);

    // Update Progress Bar
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);

            if(maxTimeWatched) {
                maxTimeWatched.current = Math.max(
                    maxTimeWatched.current, 
                    videoRef.current.currentTime
                );
            }
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

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    
    return (
        <div
            ref={containerRef}
            className={`relative h-full flex justify-center ${style} overflow-hidden cursor-pointer group ${isReel ? "w-fit bg-transparent items-center" : "h-[85%] bg-black rounded-xl border border-main-border"} ${isPost && "max-h-125 items-center"}`}
            onClick={togglePlay}
        >
            {
                !isReel ?
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    // loop
                    playsInline
                    muted={isCurrentlyMuted} 
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className={`max-w-full ${isReel ? "w-auto h-auto max-h-[calc(100vh-120px)] sm:max-w-[450px]" : "w-full h-fit object-contain"}`}
                />
                :
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    playsInline
                    muted={isCurrentlyMuted} 
                    // loop
                    onLoadedData={() => setIsVideoLoaded(true)}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className={`max-w-full w-auto h-auto max-h-[calc(100vh-120px)] sm:max-w-[450px]`}

                    // 2. TRACK LOOPS
                    onEnded={() => {
                        if(loopCount)
                            loopCount.current += 1;
                        
                        if (videoRef.current) {
                            videoRef.current.currentTime = 0; // Reset to start
                            videoRef.current.play();          // Play again
                        }
                    }}
                />
            }

            {!isPlaying && (
                <div className={`absolute inset-0 flex items-center justify-center ${isReel ? "bg-black/10" : "bg-black/20"} transition-opacity`}>
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 shadow-xl border border-white/20 pl-1">
                        <FaPlay className="text-2xl" />
                    </div>
                </div>
            )}

            <div 
                className={`absolute flex items-center gap-2 z-20 group/volume ${isReel ? "top-4 right-4" : "bottom-6 right-4"}`}
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="overflow-hidden transition-all duration-300 w-0 opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100 bg-black/50 backdrop-blur-md rounded-full flex items-center px-2 h-10" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isCurrentlyMuted ? 0 : currentVolume} // Bind to synced volume
                        onChange={(e) => {handleVolumeChange(e); e.stopPropagation()}}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-main-blue bg-white/30"
                    />
                </div>
                
                <button
                    onClick={(e) => { toggleMute(e); e.stopPropagation(); }}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 hover:bg-black/70 transition-colors shrink-0"
                >
                    {isCurrentlyMuted || currentVolume === 0 ? <IoVolumeMute size={20} /> : <IoVolumeHigh size={20} />}
                </button>
            </div>

            <div className={`absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10`}>
                <div className="h-full bg-main-blue transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}