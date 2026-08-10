"use client"
import Image from 'next/image'
import { GoHeart, GoHeartFill, GoComment } from "react-icons/go";
import { RiShareForward2Line } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { toggleLikeState } from '@/actions/like';
import { submitComment } from '@/actions/comment';
import Video from './CustomVideoPlayer';
import { useUser } from '../context/UserContext';

type Props = {
    post: any
}

export default function Post({ post }: Props) {
    // const supabase = createClient();
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [limitError, setLimitError] = useState({
        comment: false,
        like: false
    })
    const user = useUser()

    useEffect(() => {
        setCurrentUser(user)
    }, [user])
    console.log(user)
    console.log(post)

    const images = post.image_url || [];
    const videoUrl = post.video_url || null;
    const imageCount = images.length;
    const createdAt = post.createdAt || post.created_at;
    const authorFirstName = post.author?.firstName || post.author?.first_name;
    const authorLastName = post.author?.lastName || post.author?.last_name;
    const authorProfileImage = post.author?.profileImage || post.author?.profile_image;

    // ==========================================
    // ENGAGEMENT & COMMENT STATE
    // ==========================================

    const [likes, setLikes] = useState<any[]>(post?.likes || []);
    const [comments, setComments] = useState<any[]>(post?.comments || []);

    const [feedComment, setFeedComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [visibleCount, setVisibleCount] = useState(1);

    const generalComments = comments.filter((c: any) => c.photoIndex === null || c.photo_index === null);

    const visibleComments = generalComments.slice(0, visibleCount);

    // const generalLikes = likes.filter((l: any) => l.photoIndex === null || l.photo_index === null);
    
    const isLiked = post.likes.some((l: any) => l.user_id === currentUser?.user?.id || l.user_id === currentUser?.user?.id);
    
    const totalLikes = likes.length;
    const totalComments = comments.length;
    const totalShares = post?.shares?.length || 0;

    const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [likeAnimation, setLikeAnimation] = useState(false);



    // =====================================================
    // FEED LIKE LOGIC (Optimistic UI + Debounce + Supabase)
    // =====================================================
    const handleLike = () => {

        if (!post?.id || !currentUser?.user || limitError.like) return; // Prevent clicking if locked

        const wasLiked = isLiked;

        // 1. Optimistic Update
        if (wasLiked) {
            setLikes(prev => prev.filter(l => !((l.user_id === currentUser?.user.id) && (l.photoIndex === null || l.photo_index === null))));
        } else {
            setLikes(prev => [...prev, { id: `temp-like-${Date.now()}`, user_id: currentUser?.user.id, photo_index: null }]);
            
            setLikeAnimation(true);
            setTimeout(() => setLikeAnimation(false), 800); // Hide it after the animation finishes
        }

        // 2. Debounce -> Call Server Action
        if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);

        likeTimeoutRef.current = setTimeout(async () => {
            const response = await toggleLikeState(currentUser?.user.id, post.id, null, wasLiked ? "unlike" : "like");
            
            if (!response.success) {
                // Trigger the rate limit lock for 10 seconds
                setLimitError(prev => ({ ...prev, like: true }));
                setTimeout(() => {
                    setLimitError(prev => ({ ...prev, like: false }));
                }, 10000);

                // Revert state because Redis blocked them
                if (wasLiked) {
                    setLikes(prev => [...prev, { id: `temp-like-${Date.now()}`, user_id: currentUser?.user.id, photo_index: null }]);
                } else {
                    setLikes(prev => prev.filter(l => !((l.userId === currentUser?.user.id || l.user_id === currentUser?.user.id) && (l.photoIndex === null || l.photo_index === null))));
                }
            }
        }, 800);
    };

    const handleFeedCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = feedComment.trim();
        if (!text || isSubmittingComment || !currentUser?.user || !post?.id) return;

        setIsSubmittingComment(true);

        // 1. Optimistic UI
        const tempComment = {
            id: `temp-comment-${Date.now()}`,
            content: text,
            photo_index: null, 
            created_at: new Date().toISOString(),
            author: {
                username: currentUser?.user.username,
                first_name: currentUser?.user.first_name,
                last_name: currentUser?.user.last_name,
                profile_image: currentUser?.user.profile_image,
            }
        };

        setComments(prev => [tempComment, ...prev]);
        setFeedComment("");

        // 2. Call Server Action
        const response = await submitComment(currentUser?.user.id, post.id, text, null);

        if (!response.success) {
            setLimitError({...limitError, comment: true})
            setTimeout(() => {
                setLimitError({...limitError, comment: false})
            }, 10000)
            setComments(prev => prev.filter(c => c.id !== tempComment.id));
        }
        
        setIsSubmittingComment(false);
    };

    useEffect(() => {
        return () => {
            if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
        };
    }, []);


   // ==========================================
    // SYNC LIKES FROM MODAL
    // ==========================================
    useEffect(() => {
        const handleSyncLike = (event: any) => {
            // 1. Check if the event is for THIS specific post
            if (event.detail.postId === post.id) {
                const { isLiked: newIsLiked } = event.detail; // Ignore photoIndex from modal
                
                // 2. Update the local likes array
                setLikes((prev: any[]) => {
                    if (newIsLiked) {
                        // Prevent duplicates just in case
                        const alreadyLiked = prev.some(l => 
                            (l.userId === currentUser?.user?.id || l.user_id === currentUser?.user?.id) && 
                            (l.photoIndex === null || l.photo_index === null)
                        );
                        if (alreadyLiked) return prev;

                        // Force photo_index to be NULL so Post.tsx recognizes it!
                        return [...prev, { 
                            id: `sync-like-${Date.now()}`, 
                            user_id: currentUser?.user?.id, 
                            photo_index: null 
                        }];
                    } else {
                        // Remove the null index like
                        return prev.filter(l => !(
                            (l.userId === currentUser?.user?.id || l.user_id === currentUser?.user?.id) && 
                            (l.photoIndex === null || l.photo_index === null)
                        ));
                    }
                });
            }
        };

        window.addEventListener('postLikeToggled', handleSyncLike);
        return () => window.removeEventListener('postLikeToggled', handleSyncLike);
    }, [post.id, currentUser]);
    // ==========================================

    const ImageTile = ({ src, alt, width = 600, height = 600, idx, cHeight }: any) => (
        <Link href={`/post/${post.id}?photo=${idx + 1}`} className={`z-0 ${imageCount == 4 && "xl:h-[272px]! usm:h-full h-[150px] overflow-hidden"} ${imageCount == 3 && "sm:h-[200px] h-[160px]"} ${imageCount == 2 && "usm:h-75 h-55"} w-full relative group`}>
            <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
            <Image
                src={src}
                alt={alt || "Post attachment"}
                className={`w-full h-full object-cover ${cHeight ? `h-[${cHeight}]` : ''}`}
                placeholder='blur'
                loading='lazy'
                fetchPriority='low'
                blurDataURL={src}
                width={width}
                height={height}
            />
        </Link>
    );

    return (
        <div className='bg-primary rounded-2xl w-full h-fit border border-main-border shadow-lg overflow-hidden'>
            <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-3'>
                    <Link href={`/@${post.author?.username}`} className="min-w-[45.5px] w-[45.5px] h-[45.5px] rounded-full overflow-hidden border border-main-border">
                        {authorProfileImage ? (
                            <Image src={authorProfileImage} alt="Profile" placeholder='blur' blurDataURL={authorProfileImage} width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold uppercase">
                                {authorFirstName?.charAt(0) || "U"}
                            </div>
                        )}
                    </Link>
                    <div className='text-foreground flex flex-col'>
                        <Link href={`/@${post.author?.username}`} className='font-medium text-[17px] hover:underline'>{authorFirstName} {authorLastName}</Link>
                        {createdAt && <span suppressHydrationWarning className='text-[12px] text-foreground/70'>{new Date(createdAt).toString().substring(4, 15)}</span>}
                    </div>
                </div>
                <HiOutlineDotsHorizontal className='text-[22px] p-1.5 cursor-pointer w-9 h-9 transition-all hover:bg-dark-clr rounded-full text-foreground' />
            </div>

            <div className='flex flex-col gap-3'>
                {post.content && (
                    <Link href={`/post/${post.id}`} className='text-white text-[15px] px-5 whitespace-pre-wrap hover:text-white/90'>
                        {post.content}
                    </Link>
                )}
                {
                    videoUrl && !post.is_reel &&
                    <Link href={`/post/${post.id}`} className="mt-3">
                        <Video 
                            src={post.video_url} 
                            poster={post.video_url.replace('.mp4', '.jpg').replace('.webm', '.jpg')} 
                            isReel={false}
                            isPost={true}
                        />
                    </Link>
                }
                {
                    videoUrl && post.is_reel &&
                    <Link href={`/reels/${post.id}`} className="mt-3">
                        <Video 
                            src={post.video_url} 
                            poster={post.video_url.replace('.mp4', '.jpg').replace('.webm', '.jpg')} 
                            isReel={false} // Keeps it contained inside the post box
                            isPost={true}
                        />
                    </Link>
                }
                {imageCount > 0 && (
                    <div className='w-full border-y border-main-border bg-[#0a0a0a] max-h-150 overflow-hidden'>
                        {imageCount === 1 && (
                            <div className='w-full max-h-125 flex items-center justify-center'>
                                <ImageTile placeholder="blur" blurDataURL={images[0]} loading="lazy" fetchPriority="low" src={images[0]} width={800} height={800} idx={0} />
                            </div>
                        )}
                        {imageCount === 2 && (
                            <div className='grid grid-cols-2 gap-1 usm:h-75 h-55'>
                                <ImageTile placeholder="blur" blurDataURL={images[0]} loading="lazy" fetchPriority="low" src={images[0]} idx={0} />
                                <ImageTile placeholder="blur" blurDataURL={images[1]} loading="lazy" fetchPriority="low" src={images[1]} idx={1} />
                            </div>
                        )}
                        {imageCount === 3 && (
                            <div className='flex gap-1 sm:h-100 h-80'>
                                <div className='usm:w-[65%] w-[60%] h-full'>
                                    <ImageTile placeholder="blur" blurDataURL={images[0]} loading="lazy" fetchPriority="low" src={images[0]} idx={0} />
                                </div>
                                <div className='flex usm:w-[35%] w-[40%] flex-col gap-1 h-full'>
                                    <ImageTile placeholder="blur" blurDataURL={images[1]} loading="lazy" fetchPriority="low" src={images[1]} idx={1} />
                                    <ImageTile placeholder="blur" blurDataURL={images[2]} loading="lazy" fetchPriority="low" src={images[2]} idx={2} />
                                </div>
                            </div>
                        )}
                        {imageCount >= 4 && (
                            <div className='grid grid-cols-2 gap-1 sm:h-[500px] usm:h-[350px] h-full xl:h-[550px]'>
                                <ImageTile placeholder="blur" blurDataURL={images[0]} loading="lazy" fetchPriority="low" src={images[0]} idx={0} width={400} height={100} cHeight={"100%"} />
                                <ImageTile placeholder="blur" blurDataURL={images[1]} loading="lazy" fetchPriority="low" src={images[1]} idx={1} width={400} height={100} cHeight={"100%"} />
                                <ImageTile placeholder="blur" blurDataURL={images[2]} loading="lazy" fetchPriority="low" src={images[2]} idx={2} width={400} height={100} cHeight={"100%"} />
                                <ImageTile placeholder="blur" blurDataURL={images[3]} loading="lazy" fetchPriority="low" src={images[3]} idx={3} width={400} height={100} cHeight={"100%"} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Engagement Buttons */}
            <div className='px-3 py-3 flex items-center gap-0.5 text-foreground'>
                <button
                    onClick={handleLike}
                    disabled={limitError.like}
                    title={limitError.like ? "Try again in a few seconds..." : "Like"}
                    className={`flex items-center gap-2 md:text-[19px] text-[16px] transition-all px-3 py-1.5 rounded-full
                        ${limitError.like 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-dark-clr/50 cursor-pointer'}
                        ${isLiked ? 'text-red-500' : 'hover:text-red-500'}
                    `}
                >
                    {/* Wrap the icons in a relative container */}
                    <div className="relative flex items-center justify-center">
                        {isLiked ? <GoHeartFill className="text-[22px]" /> : <GoHeart className="text-[22px]" />}
                        
                        {/* The Animated Floating Heart */}
                        {likeAnimation && (
                            <GoHeartFill className="absolute text-[22px] text-red-500 animate-float-up pointer-events-none" />
                        )}
                    </div>
                    
                    <span className='md:text-[17px] text-[15px] font-medium'>{totalLikes}</span>
                </button>
                <div className='md:text-[19px] text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 hover:text-main-blue md:px-4 px-3 py-1.5 rounded-full'>
                    <GoComment />
                    <span className='md:text-[17px] text-[15px]'>{totalComments}</span>
                </div>
                <button className='flex items-center gap-2 md:text-[19px] text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 hover:text-green-500 md:px-4 px-3 py-1.5 rounded-full'>
                    <RiShareForward2Line />
                    <span className='md:text-[17px] text-[15px]'>{totalShares}</span>
                </button>
            </div>

            {/* ========================================== */}
            {/* PROGRESSIVE COMMENT SECTION */}
            {/* ========================================== */}
            {generalComments.length > 0 && (
                <div className='px-5 pb-4 grid gap-3'>
                    {visibleComments.map((comment: any) => {
                        const commentFName = comment.author?.firstName || comment.author?.first_name;
                        const commentLName = comment.author?.lastName || comment.author?.last_name;
                        const commentDP = comment.author?.profileImage || comment.author?.profile_image;
                        const commentTime = comment.createdAt || comment.created_at;

                        return (
                            <div key={comment.id} className='flex items-start gap-2'>
                                <Link href={`/@${comment.author?.username}`} className='min-w-8 h-8 rounded-full overflow-hidden border border-main-border shrink-0 mt-0.5'>
                                    {commentDP ? (
                                        <Image src={commentDP} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold text-[12px] uppercase">
                                            {commentFName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </Link>

                                <div className='grid gap-0.5 text-foreground text-[14px] bg-dark-clr/40 rounded-2xl rounded-tl-none py-2 px-3 w-fit'>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/@${comment.author?.username}`} className='font-bold text-[13px] hover:underline'>
                                            {commentFName} {commentLName}
                                        </Link>
                                        <span suppressHydrationWarning className="text-[11px] text-gray-500">
                                            {commentTime ? formatDistanceToNowStrict(new Date(commentTime), { addSuffix: true }) : ""}
                                        </span>
                                    </div>
                                    <span className='text-foreground whitespace-pre-wrap leading-tight'>{comment.content}</span>
                                </div>
                            </div>
                        )
                    })}

                    {/* DYNAMIC COMMENT EXPANSION LOGIC */}
                    {visibleCount < generalComments.length && (
                        visibleCount === 1 ? (
                            <button
                                onClick={() => setVisibleCount(4)} // Expands up to 3 more comments inline
                                className="text-main-blue hover:text-main-blue/80 text-[14px] font-medium w-fit text-left mt-1 transition-colors cursor-pointer" 
                                title='Show more Comments'
                            >
                                Show {Math.min(3, generalComments.length - visibleCount)} more comment{Math.min(3, generalComments.length - visibleCount) !== 1 ? 's' : ''}
                            </button>
                        ) : (
                            <Link
                                href={`/post/${post.id}`}
                                className="text-main-blue hover:text-main-blue/80 text-[14px] font-medium w-fit text-left mt-1 transition-colors cursor-pointer block"
                                title='View all Comments'
                            >
                                View more comments
                            </Link>
                        )
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* QUICK FEED COMMENT INPUT */}
            {/* ========================================== */}
            <div className='px-5 pb-4 pt-1'>
                <form onSubmit={handleFeedCommentSubmit} className='flex items-center gap-3'>

                    <div className='min-w-8 h-8 rounded-full overflow-hidden border border-main-border shrink-0'>
                        {currentUser?.user?.profile_image ? (
                            <Image src={currentUser?.user.profile_image} placeholder='blur' blurDataURL={currentUser?.user.profile_image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold text-[12px] uppercase">
                                {currentUser?.user?.first_name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>

                    <div className='flex-1 bg-dark-clr/20 hover:bg-dark-clr/40 transition-colors rounded-full px-4 py-1.5 flex items-center border border-main-border focus-within:border-main-blue/50 focus-within:bg-dark-clr/40'>
                        <input
                            type="text"
                            placeholder={limitError.comment ? "Try Again in Few Seconds..." : "Add a comment..."}
                            value={feedComment}
                            onChange={(e) => setFeedComment(e.target.value)}
                            disabled={isSubmittingComment || !currentUser?.user || limitError.comment}
                            className='bg-transparent border-none outline-none w-full text-[14px] text-foreground placeholder:text-gray-500 disabled:opacity-50'
                        />

                        <button
                            type="submit"
                            disabled={!feedComment.trim() || isSubmittingComment || !currentUser?.user}
                            className={`font-semibold text-[14px] ml-2 transition-colors ${!feedComment.trim() || isSubmittingComment || !currentUser?.user
                                ? 'text-main-blue/50 cursor-default'
                                : 'text-main-blue hover:text-white cursor-pointer'
                                }`}
                        >
                            Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}