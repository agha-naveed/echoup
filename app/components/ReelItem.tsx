"use client"
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { GoHeart, GoComment, GoShare } from "react-icons/go";
import { FaHeart } from "react-icons/fa"; 
import { IoMdClose, IoMdSend } from "react-icons/io"; 
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Video from "./CustomVideoPlayer";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface ReelItemProps {
    reel: any;
    currentUser: any;
    globalMuted: boolean;
    onToggleMuted: () => void;
    globalVolume: number;
    onVolumeChange: (newVolume: number) => void;
}


export default function ReelItem({ reel, currentUser, globalMuted, onToggleMuted, globalVolume, onVolumeChange }: ReelItemProps) {
    const supabase = createClient();


    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const maxTimeWatched = useRef(0);
    const loopCount = useRef(0);
    const viewStartTime = useRef<number | null>(null);
    const totalDwellTime = useRef(0);

    
    // 2. Create a ref for this specific reel container
    const itemRef = useRef<HTMLDivElement>(null);
    // --- LIKES STATE ---
    const hasLikedInitially = reel.likes?.some((like: any) => like.user_id === currentUser?.id);
    const [isLiked, setIsLiked] = useState(hasLikedInitially);
    const [likeCount, setLikeCount] = useState(reel.like_count);
    // --- COMMENTS STATE ---
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isFetchingComments, setIsFetchingComments] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [commentCount, setCommentCount] = useState(reel.comment_count || 0);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState("");
    
    // --- SHARE STATE ---
    const [copied, setCopied] = useState(false);
    
    // --- RATE LIMITING STATE ---
    const [lastCommentTime, setLastCommentTime] = useState(0);
    const [rateLimitError, setRateLimitError] = useState("");

    const COMMENTS_PER_PAGE = 30;
    const [page, setPage] = useState(0);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);

    // console.log(reel)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // When this specific reel takes up 60% or more of the screen
                    if (entry.isIntersecting) {
                        // Silently update the URL in the browser address bar!
                        window.history.replaceState(null, '', `/reels/${reel.id}`);
                    }
                });
            },
            { threshold: 0.6 } // 0.6 means 60% visibility
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => observer.disconnect();
    }, [reel.id]);

    // --- LIKE LOGIC ---
    const handleLikeToggle = async () => {
        if (!currentUser) return;

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

        if (newIsLiked) {
            await supabase.from("likes").insert({ post_id: reel.id, user_id: currentUser.id });
        } else {
            await supabase.from("likes").delete().match({ post_id: reel.id, user_id: currentUser.id });
        }
    };

    // --- FETCH COMMENTS LOGIC ---
    useEffect(() => {
        if (showComments && comments.length === 0) {
            setPage(0);
            setHasMoreComments(true);
            fetchComments(0);
        }
    }, [showComments]);

    const fetchComments = async (pageNumber: number = 0) => {
        if (isFetchingComments) return;
        setIsFetchingComments(true);

        // Calculate the exact database rows to fetch (e.g., 0 to 29, 30 to 59)
        const from = pageNumber * COMMENTS_PER_PAGE;
        const to = from + COMMENTS_PER_PAGE - 1;

        const { data, error } = await supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                author:users ( id, username, first_name, last_name, profile_image )
            `) // Add your comment_likes queries here if you implemented them!
            .eq("post_id", reel.id)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (!error && data) {
            // If we received fewer than 30 comments, we've reached the end of the database
            if (data.length < COMMENTS_PER_PAGE) {
                setHasMoreComments(false);
            } else {
                setHasMoreComments(true);
            }

            if (pageNumber === 0) {
                // Initial load
                setComments(data);
            } else {
                // Infinite scroll load: Append new comments, filtering out potential duplicates 
                // that might have snuck in via the realtime listener
                setComments((prev) => {
                    const newComments = data.filter((d) => !prev.some((p) => p.id === d.id));
                    return [...prev, ...newComments];
                });
            }
        } else if (error) {
            console.error("Failed to fetch comments:", error);
        }
        
        setIsFetchingComments(false);
    };

    // --- POST COMMENT LOGIC (WITH RATE LIMITING) ---
    const handlePostComment = async () => {
        if (!currentUser) return;
        if (!commentText.trim() || isPosting) return;

        // 1. Rate Limiting Check (5 seconds cooldown)
        const COOLDOWN_MS = 5000;
        const timeSinceLastComment = Date.now() - lastCommentTime;
        
        if (timeSinceLastComment < COOLDOWN_MS) {
            setRateLimitError(`Please wait ${Math.ceil((COOLDOWN_MS - timeSinceLastComment) / 1000)}s before posting again.`);
            setTimeout(() => setRateLimitError(""), 3000); // Clear error after 3s
            return;
        }

        setIsPosting(true);
        setRateLimitError("");

        // 2. Database Insert
        const { data:newComment, error:insertError } = await supabase
            .from("comments")
            .insert({
                post_id: reel.id,
                author_id: currentUser.id,
                content: commentText.trim()
            })
            .select(`
                id,
                content,
                created_at,
                author:users ( id, username, first_name, last_name, profile_image )
            `)
            .single();

        if (!insertError && newComment) {

            const { data, error:rpcError } = await supabase.rpc("increment_comment_count", {
                p_post_id: reel.id,
            });

            
            if (rpcError) {
                console.error("Failed to increment:", rpcError);
            } else {
                console.log("New comment count:", newComment);
            }

            // 3. Optimistic UI Update for comments
            setComments(prev => [newComment, ...prev]);
            setCommentText(""); // Clear input
            setCommentCount((prev: number) => prev + 1); // Update floating count
            setLastCommentTime(Date.now()); // Reset rate limit timer
        } else {
            console.error("Failed to post comment:", insertError);
        }

        setIsPosting(false);
    };

    // --- UPDATE COMMENT LOGIC ---
    const handleUpdateComment = async (commentId: string) => {
        if (!editCommentText.trim()) return;

        // 1. Optimistic UI: Instantly update the comment on the screen
        setComments((prev) => 
            prev.map((c) => c.id === commentId ? { ...c, content: editCommentText.trim() } : c)
    );
    setEditingCommentId(null);
        
        // 2. Database Update
        const { error } = await supabase
        .from("comments")
        .update({ content: editCommentText.trim() })
        .eq("id", commentId);

        if (error) console.error("Failed to update comment:", error);
    };

    // --- DELETE COMMENT LOGIC ---
    const handleDeleteComment = async (commentId: string) => {
        // 1. Optimistic UI: Instantly remove it and drop the count on screen
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCount((prev: number) => Math.max(0, prev - 1));

        // 2. Database Delete (This automatically fires the SQL Trigger to fix the count!)
        const { error: deleteError } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (deleteError) {
            console.error("Failed to delete comment:", deleteError);
        }
        
        // Notice: No RPC call here anymore! The trigger does the heavy lifting.
    };


    // --- LIKE COMMENT LOGIC ---
    const handleToggleCommentLike = async (commentId: string, isCurrentlyLiked: boolean) => {
        if (!currentUser) return;

        // 1. Optimistic UI: Instantly toggle the heart and update the count
        setComments((prev) => prev.map((c) => {
            if (c.id === commentId) {
                const currentCount = c.like_count || 0;
                return {
                    ...c,
                    user_has_liked: !isCurrentlyLiked,
                    like_count: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
                };
            }
            return c;
        }));

        // 2. Database Update
        if (!isCurrentlyLiked) {
            const { error } = await supabase
                .from("comment_likes")
                .insert({ comment_id: commentId, user_id: currentUser.id });
            if (error) console.error("Failed to like comment:", error);
        } else {
            const { error } = await supabase
                .from("comment_likes")
                .delete()
                .match({ comment_id: commentId, user_id: currentUser.id });
            if (error) console.error("Failed to unlike comment:", error);
        }
    };


    // --- INFINITE SCROLL OBSERVER ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // If the invisible target is on screen, and we aren't currently loading, and there's more to load
                if (entries[0].isIntersecting && hasMoreComments && !isFetchingComments && showComments && comments.length > 0) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchComments(nextPage);
                }
            },
            { threshold: 0.1 } // Trigger as soon as 10% of the target is visible
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMoreComments, isFetchingComments, page, showComments, comments.length]);


    // --- SHARE LOGIC ---
    const handleShare = async () => {
        // Construct the URL to this specific post (adjust the route if your single post route is different)
        const postUrl = `${window.location.origin}/post/${reel.id}`;

        if (navigator.share) {
            // Mobile: Opens the native OS Share Sheet
            try {
                await navigator.share({
                    title: `Reel by @${reel.author?.username || reel.author?.first_name}`,
                    text: reel.content,
                    url: postUrl,
                });
            } catch (error) {
                console.log("Error sharing:", error);
            }
        } else {
            // Desktop Fallback: Copy to Clipboard
            try {
                await navigator.clipboard.writeText(postUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500); // Hide the "Copied!" message after 2.5s
            } catch (err) {
                console.error("Failed to copy link:", err);
            }
        }
    };

    return (
        <div ref={itemRef} className="relative w-full h-full snap-start flex justify-center items-center sm:py-1 overflow-hidden">
            <div className="flex flex-row items-center justify-center w-full sm:w-auto h-full sm:h-auto max-h-full">

                {/* THE VIDEO PLAYER */}
                <div className="relative w-fit h-full flex flex-col justify-center overflow-hidden sm:rounded-xl bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10">
                    <Video src={reel.video_url} isReel={true} globalMuted={globalMuted} onToggleMuted={onToggleMuted} 
                    globalVolume={globalVolume}
                    onVolumeChange={onVolumeChange}
                    />

                    <div className="absolute bottom-0 left-0 w-full pointer-events-none flex flex-col justify-end pb-4 px-3 sm:px-4 z-20">
                        <div className="absolute bottom-0 left-0 w-full h-[80%] bg-gradient-to-t from-black/80 via-black/30 to-transparent -z-10 pointer-events-none" />

                        <div className="flex justify-between items-end w-full">
                            <div className="flex flex-col text-white w-[75%] pointer-events-auto">
                                <h3 className="font-bold text-[15px] sm:text-[16px] mb-1 drop-shadow-lg">
                                    @{reel.author?.username || reel.author?.first_name?.toLowerCase()}
                                </h3>
                                <p className="text-[13px] sm:text-[14px] font-medium drop-shadow-md leading-tight line-clamp-2">
                                    {reel.content}
                                </p>
                            </div>

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

                                <button onClick={handleLikeToggle} className="flex flex-col items-center gap-1 group transition-transform hover:scale-110 active:scale-95">
                                    <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 transition-colors">
                                        {isLiked ? <FaHeart className="text-red-500 text-[22px] sm:text-[26px] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> : <GoHeart className="text-white text-[22px] sm:text-[26px]" />}
                                    </div>
                                    <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">{likeCount}</span>
                                </button>

                                <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1 group transition-transform hover:scale-110 active:scale-95">
                                    <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                        <GoComment className="text-white text-[20px] sm:text-[24px]" />
                                    </div>
                                    <span className="text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-md">{commentCount}</span>
                                </button>

                                <div className="relative flex flex-col items-center">
                                    <button 
                                        onClick={handleShare}
                                        className="flex flex-col items-center gap-1 group transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <div className="p-2 sm:p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                                            <GoShare className="text-white text-[20px] sm:text-[24px]" />
                                        </div>
                                    </button>

                                    {/* Desktop Fallback Tooltip */}
                                    {copied && (
                                        <div className="absolute -top-8 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap animate-pulse">
                                            Link Copied!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* THE RESPONSIVE COMMENT SECTION */}
                {showComments && (
                    <>
                        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowComments(false)} />

                        <div className="fixed bottom-0 left-0 w-full h-[70vh] bg-primary z-40 rounded-t-2xl flex flex-col shadow-2xl border-t border-main-border animate-slide-up lg:relative lg:h-[calc(100vh-120px)] lg:max-h-[800px] lg:w-[380px] lg:rounded-xl lg:border lg:border-main-border lg:ml-4 lg:animate-none lg:shadow-none transition-all">
                            
                            <div className="flex items-center justify-between px-4 py-3 border-b border-main-border">
                                <h3 className="font-bold text-foreground text-lg">Comments ({commentCount})</h3>
                                <button onClick={() => setShowComments(false)} className="p-1 hover:bg-dark-clr rounded-full transition-colors text-foreground">
                                    <IoMdClose size={24} />
                                </button>
                            </div>

                            {/* COMMENT LIST */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scroll-hidden flex flex-col gap-4">
                                {isFetchingComments ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-main-blue" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <GoComment size={40} className="mb-2 opacity-50" />
                                        <p>No comments yet.</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                ) : (
                                    <>
                                        {comments.map((comment) => {
                                            // 1. Permission Checks
                                            const isOwner = currentUser?.id === comment.author?.id;
                                            const isReelAuthor = currentUser?.id === reel.author?.id;
                                            const canDelete = isOwner || isReelAuthor;
                                            
                                            const isEditing = editingCommentId === comment.id;
                                            const isLiked = comment.user_has_liked;
                                            const commentLikes = comment.like_count || 0;

                                            return (
                                                <div key={comment.id} className="flex gap-3 group/comment items-start">
                                                    {/* AVATAR */}
                                                    <div className="w-8 h-8 rounded-full bg-dark-clr overflow-hidden shrink-0 border border-main-border">
                                                        {comment.author?.profile_image ? (
                                                            <Image src={comment.author.profile_image} alt="User" width={32} height={32} className="object-cover w-full h-full" />
                                                        ) : (
                                                            <div className="w-full h-full bg-main-blue flex justify-center items-center text-white text-sm font-bold">
                                                                {comment.author?.first_name?.charAt(0) || "U"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* COMMENT BODY */}
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Link href={`/@${comment.author?.username || ''}`} className="text-sm font-semibold text-foreground">
                                                                {comment.author?.first_name || 'User'} {comment.author?.last_name || ''}
                                                            </Link>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(comment.created_at).toLocaleDateString()}
                                                            </span>
                                                            {comment.author?.id === reel.author?.id && (
                                                                <span className="text-white text-[12px] flex items-center gap-1 bg-dark-clr py-0.5 px-2 rounded-lg border border-main-border/50">
                                                                    <span className="text-[10px]">Author</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {isEditing ? (
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editCommentText}
                                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateComment(comment.id)}
                                                                    className="w-full bg-dark-clr border border-main-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-main-blue"
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={() => setEditingCommentId(null)} 
                                                                        className="text-[12px] text-gray-400 hover:text-white transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUpdateComment(comment.id)} 
                                                                        className="text-[12px] bg-main-blue text-white px-3 py-1 rounded-full font-medium hover:bg-main-blue/80 transition-colors"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-foreground/90 mt-0.5 pr-4">{comment.content}</p>
                                                        )}

                                                        {/* ACTION BUTTONS (Hover Reveal) */}
                                                        {!isEditing && (
                                                            <div className="flex gap-4 mt-1.5 opacity-0 group-hover/comment:opacity-100 transition-opacity items-center">
                                                                {isOwner && (
                                                                    <button 
                                                                        onClick={() => { 
                                                                            setEditingCommentId(comment.id); 
                                                                            setEditCommentText(comment.content); 
                                                                        }} 
                                                                        className="text-[11px] font-semibold text-gray-500 hover:text-main-blue transition-colors"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                {canDelete && (
                                                                    <button 
                                                                        onClick={() => handleDeleteComment(comment.id)} 
                                                                        className="text-[11px] font-semibold text-gray-500 hover:text-red-500 transition-colors"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* RIGHT SIDE: LIKE BUTTON */}
                                                    {!isEditing && (
                                                        <div className="flex flex-col items-center justify-start pt-2 pl-2 shrink-0">
                                                            <button 
                                                                onClick={() => handleToggleCommentLike(comment.id, !!isLiked)}
                                                                className="p-1 transition-transform hover:scale-110 active:scale-95"
                                                            >
                                                                {isLiked ? (
                                                                    <FaHeart className="text-red-500 text-[14px]" />
                                                                ) : (
                                                                    <GoHeart className="text-gray-400 hover:text-white text-[14px] transition-colors" />
                                                                )}
                                                            </button>
                                                            {commentLikes > 0 && (
                                                                <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                                    {commentLikes}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <div ref={observerTarget} className="w-full h-10 flex items-center justify-center shrink-0">
                                            {isFetchingComments && page > 0 && (
                                                <AiOutlineLoading3Quarters className="animate-spin text-xl text-main-blue/70" />
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* INPUT AREA */}
                            <div className="p-3 border-t border-main-border bg-primary sm:rounded-b-xl">
                                {rateLimitError && (
                                    <p className="text-red-500 text-xs mb-2 px-2 animate-pulse">{rateLimitError}</p>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-main-blue flex items-center justify-center text-white shrink-0 overflow-hidden">
                                        {currentUser?.profile_image ? (
                                            <Image src={currentUser.profile_image} alt="You" width={32} height={32} className="object-cover w-full h-full" />
                                        ) : (
                                            currentUser?.first_name?.charAt(0) || "U"
                                        )}
                                    </div>
                                    <div className="flex-1 flex items-center bg-dark-clr border border-main-border rounded-full pr-2">
                                        <input 
                                            type="text" 
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                            placeholder="Add a comment..." 
                                            className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground focus:outline-none"
                                        />
                                        <button 
                                            onClick={handlePostComment}
                                            disabled={!commentText.trim() || isPosting}
                                            className="p-1.5 text-main-blue hover:bg-main-blue/10 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                                        >
                                            {isPosting ? <AiOutlineLoading3Quarters className="animate-spin text-lg" /> : <IoMdSend className="text-lg" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
}