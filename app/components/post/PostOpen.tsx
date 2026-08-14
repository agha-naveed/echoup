"use client"
import Image from 'next/image'
import { GoHeart, GoHeartFill, GoComment } from "react-icons/go";
import { RiSendPlaneFill, RiShareForward2Line } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BsEmojiSmile } from "react-icons/bs";
import { CiCamera } from 'react-icons/ci';
import { PiGif } from 'react-icons/pi';
import { IoIosArrowDown } from 'react-icons/io';
import { formatDistanceToNowStrict } from 'date-fns';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Video from '@/components/CustomVideoPlayer';
import { createClient } from "@/utils/supabase/client";
import { useUser } from '@/context/UserContext';

// --- SKELETON COMPONENT ---
const CommentSkeleton = () => (
    <div className='flex items-start gap-1.5 mt-2 animate-pulse w-full'>
        <div className='min-w-10 h-10 rounded-full shrink-0 bg-dark-clr/60 border border-main-border'></div>
        <div className='grid gap-2 bg-dark-clr/40 rounded-[10px] py-2.5 px-3 w-[60%]'>
            <div className='h-3 bg-dark-clr rounded-md w-1/2'></div>
            <div className='h-3 bg-dark-clr rounded-md w-3/4'></div>
        </div>
    </div>
);

const INITIAL_COMMENTS_LOAD = 5;
const COMMENTS_PER_CLICK = 7;

export default function PostOpen({ initialPost: post, query }: { initialPost: any, query: any }) {
    const supabase = createClient();

    // --- BASE UI STATES ---
    const [isEmpty, setIsEmpty] = useState(true);
    const [isFocus, setIsFocus] = useState(false);
    const [sortComment, setSortComment] = useState("new");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const commentInputRef = useRef<HTMLDivElement>(null);

    const user = useUser();

    // --- DB STATES ---
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // --- PAGINATION & COMMENTS STATE ---
    const [comments, setComments] = useState<any[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [isPosting, setIsPosting] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    
    const [lastCommentTime, setLastCommentTime] = useState(0);
    const [rateLimitError, setRateLimitError] = useState("");

    
    useEffect(() => {
        const initLikes = async () => {
            if (user?.user?.id && post?.likes.length > 0) {
                setIsLiked(post.likes.some((l: any) => l.user_id === user?.user?.id));
            }
            setLikeCount(post?.like_count);
            setCommentCount(post?.comment_count);

            console.log(post)
        };
        if(user?.user) {
            initLikes();
        }
    }, [post, supabase, user]);

    // --- FETCH COMMENTS (Initial & on Sort Change) ---
    useEffect(() => {
        const initComments = async () => {
            if (!post?.id) return;
            setIsInitialLoading(true);
            const ascending = sortComment === "old";

            const { data, error } = await supabase
                .from("comments")
                .select(`id, content, created_at, author:users (id, username, first_name, last_name, profile_image)`)
                .eq("post_id", post.id)
                .order("created_at", { ascending })
                .range(0, INITIAL_COMMENTS_LOAD - 1); // 0 to 14 gets 15 items

            if (data && !error) {
                setComments(data);
                setHasMoreComments(data.length === INITIAL_COMMENTS_LOAD);
            }
            setIsInitialLoading(false);
        };
        initComments();
    }, [post?.id, sortComment, supabase]);

    // --- LOAD MORE MANUAL CLICK ---
    const loadMoreComments = async () => {
        if (!post?.id || !hasMoreComments || isLoadingMore) return;
        setIsLoadingMore(true);

        const ascending = sortComment === "old";
        // Start fetching exactly where our current array ends
        const currentOffset = comments.length; 

        const { data, error } = await supabase
            .from("comments")
            .select(`id, content, created_at, author:users (id, username, first_name, last_name, profile_image)`)
            .eq("post_id", post.id)
            .order("created_at", { ascending })
            .range(currentOffset, currentOffset + COMMENTS_PER_CLICK - 1); // e.g., 15 to 21 gets 7 items

        if (data && !error) {
            setComments(prev => [...prev, ...data]);
            // If it brings back less than 7, there are no more left in the database
            if (data.length < COMMENTS_PER_CLICK) {
                setHasMoreComments(false);
            }
        }
        setIsLoadingMore(false);
    };

    // --- UI EVENT LISTENERS ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInput = (e: any) => {
        const text = e.currentTarget.textContent.trim();
        setIsEmpty(!text);
    };

    // --- LIKES & SHARE ---
    const handleLikeToggle = async () => {
        if (!user.user) return;

        const newIsLiked = !isLiked;
        
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        if (newIsLiked) {
            await supabase.from("likes").insert({ post_id: post.id, user_id: user?.user?.id });
        } else {
            await supabase.from("likes").delete().match({ post_id: post.id, user_id: user?.user?.id });
        }
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            try { await navigator.share({ url: postUrl }); } catch (err) { console.log(err); }
        } else {
            try { await navigator.clipboard.writeText(postUrl); alert("Link copied!"); } catch (err) { console.error(err); }
        }
    };

    // --- POST COMMENT ---
    const handlePostComment = async () => {
        if (!user || isPosting) return;
        const text = commentInputRef.current?.innerText.trim();
        if (!text) return;

        const COOLDOWN_MS = 5000;
        const timeSinceLastComment = Date.now() - lastCommentTime;
        if (timeSinceLastComment < COOLDOWN_MS) {
            setRateLimitError(`Wait ${Math.ceil((COOLDOWN_MS - timeSinceLastComment) / 1000)}s`);
            setTimeout(() => setRateLimitError(""), 3000);
            return;
        }

        setIsPosting(true);
        setRateLimitError("");

        const { data, error } = await supabase
            .from("comments")
            .insert({
                post_id: post.id,
                author_id: user?.user?.id,
                content: text
            })
            // Fetching the joined user data right back so we can render their name/avatar
            .select(`id, content, created_at, author:users (id, username, first_name, last_name, profile_image)`)
            .single();

        if (data && !error) {
            // Optimistic update respecting current sort order
            if (sortComment === "new") {
                setComments(prev => [data, ...prev]);
            } else {
                setComments(prev => [...prev, data]);
            }
            
            setCommentCount(prev => prev + 1);
            setLastCommentTime(Date.now());
            
            if (commentInputRef.current) {
                commentInputRef.current.innerText = "";
                setIsEmpty(true);
            }
        } else {
            console.error("Failed to post comment:", error);
        }
        setIsPosting(false);
    };

    return (
        <div className='bg-primary rounded-2xl w-full h-fit border border-main-border shadow-lg overflow-auto'>
            {/* Header */}
            <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-3'>
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                        {post?.author?.profile_image ? (
                            <Image src={post.author.profile_image} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex justify-center items-center text-white font-bold">
                                {post?.author?.first_name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>
                    <div className='text-foreground flex flex-col'>
                        <h4 className='font-medium text-[17px]'>{post?.author?.first_name} {post?.author?.last_name}</h4>
                        <span className='text-[11px] text-foreground/70'>{post?.created_at ? formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true }) : ""}</span>
                    </div>
                </div>
                <HiOutlineDotsHorizontal className='text-[22px] p-1.5 cursor-pointer w-8.75 h-8.75 transition-all hover:bg-dark-clr rounded-full text-foreground' />
            </div>

            {/* Content */}
            <div className='grid gap-3 overflow-hidden w-auto max-h-max'>
                {post?.content && <h4 className='text-white text-[17px] px-5'>{post?.content}</h4>}
                {query?.photo && post?.imageUrl?.[query.photo - 1] && (
                    <div>
                        <Image src={post.imageUrl[query.photo - 1]} className='w-full max-h-full cursor-pointer' alt='' width={1000} height={1000} />
                    </div>
                )}
                <div className='w-full flex justify-center'>
                    {post?.video_url && <Video src={post.video_url} isPost={true} />}
                </div>
            </div>

            {/* Action Buttons */}
            <div className='px-3 mt-4 flex items-center gap-0.5 text-foreground'>
                <button onClick={handleLikeToggle} className='flex items-center gap-2 md:text-[19px] text-[16px] group cursor-pointer transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full'>
                    {isLiked ? <GoHeartFill className="text-red-500" /> : <GoHeart />}
                    <span className='md:text-[17px] text-[15px]'>{likeCount}</span>
                </button>

                <button className='md:text-[19px] text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full'>
                    <GoComment />
                    <span className='md:text-[17px] text-[15px]'>{commentCount}</span>
                </button>

                <button onClick={handleShare} className='flex items-center gap-2 md:text-[19px] text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full'>
                    <RiShareForward2Line />
                    <span className='md:text-[17px] text-[15px]'>{post?.shares || 0}</span>
                </button>
            </div>

            {/* Comments Section */}
            <div className='px-5 py-4 grid gap-3 relative'>
                {/* Sort Dropdown */}
                <div className='w-fit h-7.5' ref={dropdownRef}>
                    <ul className={`${isOpen ? "bg-zinc-900 rounded-lg z-10" : "bg-zinc-900/20 rounded-full"} w-fit group absolute top-2 overflow-hidden`}>
                        <li onClick={() => setIsOpen(true)} className='flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-zinc-900/30 w-full px-3.5 py-1.5 text-[15px]'>
                            <span>{sortComment === "old" ? "Oldest Comment" : "Newest Comment"}</span>
                            <IoIosArrowDown />
                        </li>
                        {isOpen && (
                            <li onClick={() => { setSortComment(sortComment === "new" ? "old" : "new"); setIsOpen(false) }} className={`flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-white/2 px-3.5 py-1.5 text-[15px] w-full`}>
                                <span>{sortComment === "new" ? "Oldest Comment" : "Newest Comment"}</span>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Render Comments or Initial Skeleton */}
                {isInitialLoading ? (
                    Array(3).fill(0).map((_, i) => <CommentSkeleton key={i} />)
                ) : (
                    <>
                        {comments.map(comment => (
                            <div key={comment.id} className='flex items-start gap-1.5 mt-2'>
                                <div className='min-w-10 h-10 rounded-full overflow-hidden shrink-0 bg-dark-clr border border-main-border'>
                                    {comment.author?.profile_image ? (
                                        <Image src={comment.author.profile_image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-main-blue flex justify-center items-center text-white font-bold">
                                            {comment.author?.first_name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5 max-w-[85%]'>
                                    <Link href={""} className='font-medium w-fit text-white'>
                                        {comment.author?.first_name} {comment.author?.last_name}
                                    </Link>
                                    <span className='text-foreground/90'>{comment.content}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* MANUAL LOAD MORE BUTTON */}
                        {hasMoreComments && (
                            <div className="flex justify-start pl-12 mt-2">
                                <button 
                                    onClick={loadMoreComments}
                                    disabled={isLoadingMore}
                                    className="text-[14px] text-foreground/60 hover:text-foreground hover:underline transition-colors disabled:opacity-50 font-medium"
                                >
                                    {isLoadingMore ? "Loading..." : "View more comments"}
                                </button>
                            </div>
                        )}
                        
                        {/* Load More Skeleton */}
                        {isLoadingMore && <CommentSkeleton />}
                    </>
                )}

                {/* Input New Comment */}
                <div className='flex items-start gap-1.5 mt-2'>
                    <div className='min-w-10 h-10 rounded-full overflow-hidden shrink-0'>
                        {user?.user?.profile_image ? (
                            <Image src={user.user?.profile_image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex justify-center items-center text-white font-bold">
                                {user?.user?.first_name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>
                    
                    <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5 w-full relative'
                        onFocus={(e) => e.currentTarget.contains(e.target) && setIsFocus(true)}
                        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setIsFocus(false)}
                    >
                        {rateLimitError && <span className="absolute -top-5 right-2 text-red-500 text-xs animate-pulse">{rateLimitError}</span>}
                        
                        <div className="select-none overflow-hidden min-w-0 flex-1 group">
                            <div className="flex items-end relative overflow-hidden">
                                <div
                                    ref={commentInputRef}
                                    contentEditable
                                    role="textbox"
                                    aria-multiline="true"
                                    data-placeholder={`Commenting as ${user?.user?.first_name &&  (user?.user?.first_name + 
                                        " " + user?.user?.last_name) || "..."}`}
                                    onInput={handleInput}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePostComment();
                                        }
                                    }}
                                    className={`editable-div ${isEmpty ? "is-empty" : ""} w-full lg:max-h-125 max-h-75 ${isFocus ? "min-h-10" : "min-h-7.25"} overflow-hidden resize-none p-1 pr-9 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`} 
                                />
                                <button 
                                    onClick={handlePostComment}
                                    disabled={isEmpty || isPosting}
                                    className='hover:bg-main-dark-blue transition-all cursor-pointer absolute right-0 p-1 rounded-full disabled:opacity-50' 
                                    title='Send Message'
                                >
                                    {isPosting ? (
                                        <AiOutlineLoading3Quarters className="animate-spin text-xl relative left-[-1.5px] top-px text-main-blue" />
                                    ) : (
                                        <RiSendPlaneFill className='text-xl relative left-[-1.5px] top-px' />
                                    )}
                                </button>
                            </div>
                            
                            <div className={`items-center gap-2 ${isFocus ? "flex mt-2" : "hidden"}`}>
                                <button type='button'><BsEmojiSmile className='text-[16px] cursor-pointer' title='Insert an Emoji' /></button>
                                <button type='button'><CiCamera className='text-xl cursor-pointer' title='Add an Image' /></button>
                                <button type='button'><PiGif className="text-[22px] cursor-pointer" title='Insert a GIF Image' /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}