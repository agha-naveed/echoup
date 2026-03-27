"use client"
import Image from 'next/image'
import { GoHeart, GoHeartFill, GoComment } from "react-icons/go";
import { RiShareForward2Line } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { PostType } from '../types/post';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNowStrict } from 'date-fns';
import axios from 'axios';

type Props = {
    post: PostType
}

export default function Post({ post }: Props) {
    const { data: session } = useSession();
    const currentUser = session?.user;

    const images = post.imageUrl || [];
    const imageCount = images.length;

    // ==========================================
    // ENGAGEMENT & COMMENT STATE
    // ==========================================

    // FIX: Removed the extra brackets so it correctly initializes the array
    const [likes, setLikes] = useState<any[]>([post?.likes]);
    const [comments, setComments] = useState<any[]>(post?.comments || []);

    // Pagination state for comments (Start with 1)
    const [visibleCount, setVisibleCount] = useState(1);

    // 1. Get ONLY the general collage comments (photoIndex is null)
    const generalComments = comments.filter((c: any) => c.photoIndex === null);

    // 2. Slice the array to only show the allowed amount
    const visibleComments = generalComments.slice(0, visibleCount);

    // 3. Derived state for the buttons
    const generalLikes = likes.filter((l: any) => l.photoIndex === null);
    const isLiked = generalLikes.some((l: any) => l.userId === currentUser?.id);

    // Feed usually shows TOTAL counts across all photos
    const totalLikes = likes.length;
    const totalComments = comments.length;
    const totalShares = 0;

    const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleShowMore = () => {
        setVisibleCount((prev) => prev + 5);
    };

    // ==========================================
    // FEED LIKE LOGIC (Optimistic UI + Debounce)
    // ==========================================
    const handleLike = () => {
        if (!post?.id || !currentUser) return;

        // 1. Optimistic Update for the general feed (photoIndex: null)
        if (isLiked) {
            setLikes(prev => prev.filter(l => !(l.userId === currentUser.id && l.photoIndex === null)));
        } else {
            setLikes(prev => [
                ...prev,
                { id: `temp-like-${Date.now()}`, userId: currentUser.id, photoIndex: null }
            ]);
        }

        // 2. Debounce
        if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);

        likeTimeoutRef.current = setTimeout(async () => {
            try {
                // Save it as a general post like (null)
                await axios.post("/api/likes", {
                    postId: post.id,
                    photoIndex: null
                });
            } catch (error) {
                console.error("Failed to sync like with server");
                // Revert state on failure
                if (isLiked) {
                    setLikes(prev => [...prev, { id: `temp-like-${Date.now()}`, userId: currentUser.id, photoIndex: null }]);
                } else {
                    setLikes(prev => prev.filter(l => !(l.userId === currentUser.id && l.photoIndex === null)));
                }
            }
        }, 800);
    };

    const handleFeedCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = feedComment.trim();
        if (!text || isSubmittingComment || !currentUser || !post?.id) return;

        setIsSubmittingComment(true);

        // 1. OPTIMISTIC UI: Instantly create a fake comment for the feed
        const tempComment = {
            id: `temp-comment-${Date.now()}`,
            content: text,
            photoIndex: null, // Tagged as null so it shows up on the general feed!
            createdAt: new Date().toISOString(),
            author: {
                username: currentUser?.name?.replace(/\s+/g, '').toLowerCase() || "user",
                firstName: currentUser?.name?.split(" ")[0] || "User",
                lastName: currentUser?.name?.split(" ")[1] || "",
                profileImage: currentUser?.image || null,
            }
        };

        // 2. Instantly push it to the top of the comments array
        setComments(prev => [tempComment, ...prev]);
        setFeedComment(""); // Clear the input box instantly

        try {
            // 3. Save it to PostgreSQL in the background
            await axios.post("/api/comments", {
                postId: post.id,
                content: text,
                photoIndex: null // Make sure the database knows it's a general comment
            });
        } catch (error) {
            console.error("Failed to post comment");
            // Fallback: remove the temporary comment if the server fails
            setComments(prev => prev.filter(c => c.id !== tempComment.id));
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const [feedComment, setFeedComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
        };
    }, []);

    // ==========================================

    const ImageTile = ({ src, alt, width = 600, height = 600, idx, cHeight }: any) => (
        <Link href={`/post/${post.id}?photo=${idx + 1}`} className={`${imageCount == 4 && "xl:h-[272px]! usm:h-full h-[150px] overflow-hidden"} ${imageCount == 3 && "sm:h-[200px] h-[160px]"} ${imageCount == 2 && "usm:h-75 h-55"} w-full relative group`}>
            <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
            <Image
                src={src}
                alt={alt || "Post attachment"}
                className={`w-full h-full object-cover ${cHeight ? `h-[${cHeight}]` : ''}`}
                width={width}
                height={height}
            />
        </Link>
    );

    return (
        <div className='bg-primary rounded-2xl w-full h-fit border border-main-border shadow-lg overflow-hidden'>
            <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-3'>
                    <Link href={`/${post.author?.username}`} className="min-w-[45.5px] w-[45.5px] h-[45.5px] rounded-full overflow-hidden border border-main-border">
                        {post.author?.profileImage ? (
                            <Image src={post.author.profileImage} alt="Profile" width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold uppercase">
                                {post.author?.firstName?.charAt(0) || "U"}
                            </div>
                        )}
                    </Link>
                    <div className='text-foreground flex flex-col'>
                        <Link href={`/${post.author?.username}`} className='font-medium text-[17px] hover:underline'>{post.author?.firstName} {post.author?.lastName}</Link>
                        <span className='text-[12px] text-foreground/70'>{post.createdAt.toString().substring(4, 15)}</span>
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

                {imageCount > 0 && (
                    <div className='w-full border-y border-main-border bg-[#0a0a0a] max-h-150 overflow-hidden'>
                        {imageCount === 1 && (
                            <div className='w-full max-h-125 flex items-center justify-center'>
                                <ImageTile src={images[0]} width={800} height={800} idx={0} />
                            </div>
                        )}
                        {imageCount === 2 && (
                            <div className='grid grid-cols-2 gap-1 usm:h-75 h-55'>
                                <ImageTile src={images[0]} idx={0} />
                                <ImageTile src={images[1]} idx={1} />
                            </div>
                        )}
                        {imageCount === 3 && (
                            <div className='flex gap-1 sm:h-100 h-80'>
                                <div className='usm:w-[65%] w-[60%] h-full'>
                                    <ImageTile src={images[0]} idx={0} />
                                </div>
                                <div className='flex usm:w-[35%] w-[40%] flex-col gap-1 h-full'>
                                    <ImageTile src={images[1]} idx={1} />
                                    <ImageTile src={images[2]} idx={2} />
                                </div>
                            </div>
                        )}
                        {imageCount >= 4 && (
                            <div className='grid grid-cols-2 gap-1 sm:h-[500px] usm:h-[350px] h-full xl:h-[550px]'>
                                <ImageTile src={images[0]} idx={0} width={400} height={100} cHeight={"100%"} />
                                <ImageTile src={images[1]} idx={1} width={400} height={100} cHeight={"100%"} />
                                <ImageTile src={images[2]} idx={2} width={400} height={100} cHeight={"100%"} />
                                <ImageTile src={images[3]} idx={3} width={400} height={100} cHeight={"100%"} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Engagement Buttons */}
            <div className='px-3 py-3 flex items-center gap-0.5 text-foreground'>
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 md:text-[19px] text-[16px] transition-all hover:bg-dark-clr/50 md:px-4 px-3 py-1.5 rounded-full ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                    {isLiked ? <GoHeartFill /> : <GoHeart />}
                    <span className='md:text-[17px] text-[15px]'>{totalLikes}</span>
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
            {/* NEW: PROGRESSIVE COMMENT SECTION */}
            {/* ========================================== */}
            {generalComments.length > 0 && (
                <div className='px-5 pb-4 grid gap-3'>
                    {visibleComments.map((comment: any) => (
                        <div key={comment.id} className='flex items-start gap-2'>
                            <Link href={`/${comment.author.username}`} className='min-w-8 h-8 rounded-full overflow-hidden border border-main-border shrink-0 mt-0.5'>
                                {comment.author.profileImage ? (
                                    <Image src={comment.author.profileImage} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold text-[12px] uppercase">
                                        {comment.author.firstName?.charAt(0) || "U"}
                                    </div>
                                )}
                            </Link>

                            <div className='grid gap-0.5 text-foreground text-[14px] bg-dark-clr/40 rounded-2xl rounded-tl-none py-2 px-3 w-fit'>
                                <div className="flex items-center gap-2">
                                    <Link href={`/${comment.author.username}`} className='font-bold text-[13px] hover:underline'>
                                        {comment.author.firstName} {comment.author.lastName}
                                    </Link>
                                    <span className="text-[11px] text-gray-500">
                                        {comment.createdAt ? formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true }) : ""}
                                    </span>
                                </div>
                                <span className='text-foreground whitespace-pre-wrap leading-tight'>{comment.content}</span>
                            </div>
                        </div>
                    ))}

                    {visibleCount < generalComments.length && (
                        <button
                            onClick={handleShowMore}
                            className="text-main-blue hover:text-main-blue/80 text-[14px] font-medium w-fit text-left mt-1 transition-colors"
                        >
                            Show {Math.min(5, generalComments.length - visibleCount)} more comments
                        </button>
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* NEW: QUICK FEED COMMENT INPUT */}
            {/* ========================================== */}
            <div className='px-5 pb-4 pt-1'>
                <form onSubmit={handleFeedCommentSubmit} className='flex items-center gap-3'>

                    {/* Logged in User's Avatar */}
                    <div className='min-w-8 h-8 rounded-full overflow-hidden border border-main-border shrink-0'>
                        {currentUser?.image ? (
                            <Image src={currentUser.image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold text-[12px] uppercase">
                                {currentUser?.name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>

                    {/* The Input Field */}
                    <div className='flex-1 bg-dark-clr/20 hover:bg-dark-clr/40 transition-colors rounded-full px-4 py-1.5 flex items-center border border-main-border focus-within:border-main-blue/50 focus-within:bg-dark-clr/40'>
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={feedComment}
                            onChange={(e) => setFeedComment(e.target.value)}
                            disabled={isSubmittingComment}
                            className='bg-transparent border-none outline-none w-full text-[14px] text-foreground placeholder:text-gray-500 disabled:opacity-50'
                        />

                        {/* Post Button (Only lights up when there is text!) */}
                        <button
                            type="submit"
                            disabled={!feedComment.trim() || isSubmittingComment}
                            className={`font-semibold text-[14px] ml-2 transition-colors ${!feedComment.trim() || isSubmittingComment
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