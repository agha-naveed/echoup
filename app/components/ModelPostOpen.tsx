"use client"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowForward, IoMdCloseCircle } from "react-icons/io";
import { useRouter, usePathname } from "next/navigation";
import { BsEmojiSmile } from "react-icons/bs";
import { CiCamera } from "react-icons/ci";
import { PiGif } from "react-icons/pi";
import { RiSendPlaneFill, RiShareForward2Line } from "react-icons/ri";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { GoComment, GoHeart, GoHeartFill } from "react-icons/go";
import { createClient } from "@/utils/supabase/client";

export default function ModelPostOpen({ initialPost, query }: { initialPost: any, query: any }) {

    const supabase = createClient();
    const [currentUser, setCurrentUser] = useState<any>(null);

    // 1. Fetch the active Supabase user on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setCurrentUser(profile);
            }
        };
        fetchUser();
    }, [supabase]);

    const photoQuery = query.photo;
    const initialIndex = photoQuery ? +photoQuery - 1 : 0;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const post = initialPost;
    const postAuthorFName = post?.author?.firstName || post?.author?.first_name;
    const postAuthorLName = post?.author?.lastName || post?.author?.last_name;
    const postAuthorDP = post?.author?.profileImage || post?.author?.profile_image;
    const postCreatedAt = post?.createdAt || post?.created_at;

    // 2. Engagement State
    const [likes, setLikes] = useState<any[]>(initialPost?.likes || []);
    const [shares, setShares] = useState<any[]>(initialPost?.shares || []);
    const [realComments, setRealComments] = useState<any[]>(post?.comments || []);

    const currentPhotoLikes = likes.filter((l: any) => (l.photoIndex ?? l.photo_index) === currentIndex);
    const currentPhotoShares = shares.filter((s: any) => (s.photoIndex ?? s.photo_index) === currentIndex);
    const currentPhotoComments = realComments.filter((c: any) => (c.photoIndex ?? c.photo_index) === currentIndex);

    const isLiked = currentPhotoLikes.some((l: any) => (l.userId ?? l.user_id) === currentUser?.id);

    const likeCount = currentPhotoLikes.length;
    const shareCount = currentPhotoShares.length;
    const commentCount = currentPhotoComments.length;

    const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [isFocus, setIsFocus] = useState(false);
    const [sortComment, setSortComment] = useState("new");
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useRouter();
    const pathname = usePathname();

    // ================ Handlers ================

    const handleLike = () => {
        if (!post?.id || !currentUser) return;
        
        const wasLiked = isLiked;

        if (wasLiked) {
            setLikes((prev: any[]) => prev.filter(l => !((l.userId ?? l.user_id) === currentUser.id && (l.photoIndex ?? l.photo_index) === currentIndex)));
        } else {
            setLikes((prev: any[]) => [
                ...prev,
                { id: `temp-like-${Date.now()}`, user_id: currentUser.id, photo_index: currentIndex }
            ]);
        }

        if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);

        likeTimeoutRef.current = setTimeout(async () => {
            try {
                if (wasLiked) {
                    await supabase.from("likes").delete()
                        .match({ post_id: post.id, user_id: currentUser.id, photo_index: currentIndex });
                } else {
                    await supabase.from("likes").insert({
                        post_id: post.id,
                        user_id: currentUser.id,
                        photo_index: currentIndex
                    });
                }
            } catch (error) {
                console.error("Failed to sync like with server");
                if (wasLiked) {
                    setLikes((prev: any[]) => [...prev, { id: `temp-like-${Date.now()}`, user_id: currentUser.id, photo_index: currentIndex }]);
                } else {
                    setLikes((prev: any[]) => prev.filter(l => !((l.userId ?? l.user_id) === currentUser.id && (l.photoIndex ?? l.photo_index) === currentIndex)));
                }
            }
        }, 800);
    };

    const handleShare = async () => {
        if (!post?.id || isSharing || !currentUser) return;

        setIsSharing(true);

        const tempShare = { id: `temp-share-${Date.now()}`, user_id: currentUser.id, photo_index: currentIndex };
        setShares((prev: any[]) => [...prev, tempShare]);

        try {
            await supabase.from("shares").insert({
                post_id: post.id,
                user_id: currentUser.id,
                photo_index: currentIndex
            });

            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}?photo=${currentIndex + 1}`);
        } catch (error) {
            console.error("Failed to share");
            setShares((prev: any[]) => prev.filter(s => s.id !== tempShare.id));
        } finally {
            setIsSharing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
        };
    }, []);

    // ================ Slider ================

    const images = initialPost?.imageUrl || initialPost?.image_url || [];
    const hasImages = images.length > 0;
    const hasMultipleImages = images.length > 1;

    const nextImage = () => {
        if (currentIndex < images.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            window.history.replaceState(null, '', `${pathname}?photo=${newIndex + 1}`);
        }
    };

    const prevImage = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            window.history.replaceState(null, '', `${pathname}?photo=${newIndex + 1}`);
        }
    };

    // ================ Comments ================

    const commentRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCommentSubmit = async () => {
        const text = commentRef.current?.innerText.trim();
        if (!text || isSubmitting || !post?.id || !currentUser) return;

        setIsSubmitting(true);

        const temporaryComment = {
            id: `temp-${Date.now()}`,
            content: text,
            photo_index: currentIndex,
            created_at: new Date().toISOString(),
            author: {
                username: currentUser.username,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                profile_image: currentUser.profile_image,
            }
        };

        setRealComments((prevComments: any) => [temporaryComment, ...(prevComments || [])]);
        if (commentRef.current) commentRef.current.innerText = "";
        setIsEmpty(true);

        try {
            const { error } = await supabase.from("comments").insert({
                post_id: post.id,
                content: text,
                photo_index: currentIndex,
                author_id: currentUser.id
            });

            if (error) throw error;
        } catch (error) {
            console.error("Failed to add comment");
            setRealComments((prevComments: any) => prevComments.filter((c: any) => c.id !== temporaryComment.id));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate.back();
        } else {
            navigate.push(`/@${post?.author?.username || ""}`);
        }
    };

    const sortAllComments = () => {
        setRealComments((prevComments: any) => [...prevComments].reverse());
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent?.trim();
        setIsEmpty(!text);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!post) return null;

    // ==========================================
    // REUSABLE POST CONTENT (Comments, Author, Input)
    // ==========================================
    const renderPostContent = () => (
        <>
            {/* Author & Content Area */}
            <div className="px-5 py-4">
                <div className="flex gap-2">
                    <Link href={`/@${post?.author?.username}`} className="min-w-[45.5px] w-[45.5px] h-[45.5px] rounded-full overflow-hidden border border-main-border">
                        {postAuthorDP ? (
                            <Image src={postAuthorDP} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                {postAuthorFName?.charAt(0) || "U"}
                            </div>
                        )}
                    </Link>
                    <div className="grid ml-1.5 text-foreground">
                        <Link href={`/@${post?.author?.username}`} className="text-[18px] font-medium hover:underline">{postAuthorFName} {postAuthorLName}</Link>
                        <span suppressHydrationWarning className="text-[12px] text-gray-400">
                            {postCreatedAt ? formatDistanceToNowStrict(new Date(postCreatedAt), { addSuffix: true }) : ""}
                        </span>
                    </div>
                </div>
                {post?.content && <div className="text-[15px] text-foreground mt-3 whitespace-pre-wrap">{post.content}</div>}
            </div>

            <div className="px-5">
                <div className="w-full h-px bg-light-clr px-5 border-b border-main-border"></div>
            </div>

            {/* Engagement Buttons */}
            <div className='px-5 py-3 flex items-center gap-4 text-foreground border-t border-main-border'>
                <button onClick={handleLike} className={`flex items-center gap-2 text-[16px] transition-all hover:bg-dark-clr/50 px-3 py-1.5 rounded-full ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                    {isLiked ? <GoHeartFill className="text-[22px]" /> : <GoHeart className="text-[22px]" />}
                    <span className='font-medium'>{likeCount}</span>
                </button>
                <button onClick={() => setIsFocus(true)} className='text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 hover:text-main-blue px-3 py-1.5 rounded-full'>
                    <GoComment className="text-[20px]" />
                    <span className='font-medium'>{commentCount}</span>
                </button>
                <button onClick={handleShare} className='flex items-center gap-2 text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 hover:text-green-500 px-3 py-1.5 rounded-full'>
                    <RiShareForward2Line className="text-[22px]" />
                    <span className='font-medium'>{shareCount}</span>
                </button>
            </div>

            {/* Comments Area */}
            <div className='flex-1 overflow-y-auto custom-scroll px-5 py-4 grid gap-4 content-start relative'>
                <div className='w-fit h-7.5 relative z-30' ref={dropdownRef}>
                    <ul className={`${isOpen ? "bg-zinc-900 rounded-lg shadow-xl" : "bg-dark-clr rounded-full"} w-max group absolute top-0 overflow-hidden`}>
                        <li onClick={() => setIsOpen(true)} className='flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-zinc-900/30 w-full px-3 py-1.5 text-[14px] font-medium'>
                            <span>{sortComment === "old" ? "Oldest First" : "Newest First"}</span>
                            <IoIosArrowDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </li>
                        {isOpen && (
                            <li onClick={() => { setSortComment(sortComment === "new" ? "old" : "new"); setIsOpen(false); sortAllComments(); navigate.refresh() }} className={`flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-white/10 px-4 py-2 text-[14px] w-full border-t border-main-border`}>
                                <span>{sortComment === "new" ? "Sort by Oldest" : "Sort by Newest"}</span>
                            </li>
                        )}
                    </ul>
                </div>

                {realComments.length === 0 ? (
                    <div className="text-center text-gray-500 text-[14px] mt-10">
                        No comments yet. Be the first to reply!
                    </div>
                ) : (
                    realComments.map((comment: any) => {
                        const cPhotoIndex = comment.photoIndex ?? comment.photo_index;
                        if (cPhotoIndex !== currentIndex && hasImages) return null; // Only filter by index if images exist

                        const cFName = comment.author?.firstName || comment.author?.first_name;
                        const cLName = comment.author?.lastName || comment.author?.last_name;
                        const cDP = comment.author?.profileImage || comment.author?.profile_image;
                        const cTime = comment.createdAt || comment.created_at;

                        return (
                            <div key={comment.id} className='flex items-start gap-2'>
                                <Link href={`/@${comment.author.username}`} className='min-w-10 h-10 rounded-full overflow-hidden border border-main-border shrink-0'>
                                    {cDP ? (
                                        <Image src={cDP} alt="DP" width={100} height={100} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold uppercase">
                                            {cFName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </Link>

                                <div className='grid gap-1 text-foreground text-[14px] bg-dark-clr/40 rounded-[12px] rounded-tl-none py-2 px-3'>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/@${comment.author.username}`} className='font-bold w-fit text-[13px] hover:underline'>
                                            {cFName} {cLName}
                                        </Link>
                                        <span suppressHydrationWarning className="text-[11px] text-gray-500">
                                            {cTime ? formatDistanceToNowStrict(new Date(cTime), { addSuffix: true }) : ""}
                                        </span>
                                    </div>
                                    <span className='text-foreground whitespace-pre-wrap'>{comment.content}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Comment Input */}
            <div className='p-4 border-t border-main-border mt-auto shrink-0'>
                <div className='flex items-start gap-2'>
                    <div className='min-w-10 h-10 rounded-full overflow-hidden border border-main-border shrink-0'>
                        {currentUser?.profile_image ? (
                            <Image src={currentUser.profile_image} alt="DP" width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                {currentUser?.first_name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>

                    <div className={`grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-xl py-1.5 px-2.5 w-full border transition-all ${isFocus ? "border-main-blue/50" : "border-main-border"}`}
                        onFocus={(e) => { if (e.currentTarget.contains(e.target)) setIsFocus(true); }}
                        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsFocus(false); }}>
                        <div className="flex items-end relative overflow-hidden">
                            <div
                                ref={commentRef}
                                role="textbox"
                                contentEditable
                                aria-multiline="true"
                                data-placeholder={`Commenting as ${currentUser?.first_name || "User"}...`}
                                onInput={handleInput}
                                className={`editable-div ${isEmpty ? "is-empty" : ""} w-full max-h-[150px] ${isFocus ? "min-h-[100px]" : "min-h-[30px]"} overflow-y-auto resize-none p-1 pr-9 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                            />
                            <button disabled={isSubmitting || !currentUser} onClick={handleCommentSubmit} className={`${(isEmpty || isSubmitting || !currentUser) && "opacity-50 cursor-auto!"}  text-main-blue hover:bg-main-blue/10 transition-all cursor-pointer absolute right-0 bottom-0 p-1.5 rounded-full mb-0.5`} title='Send Message'>
                                <RiSendPlaneFill className='text-[20px] relative -left-px' />
                            </button>
                        </div>

                        <div className={`items-center gap-3 pt-2 pb-1 ${isFocus ? "flex" : "hidden"}`} onMouseDown={(e) => e.preventDefault()}>
                            <BsEmojiSmile className='text-[18px] cursor-pointer text-gray-400 hover:text-white transition' title='Emoji' />
                            <CiCamera className='text-[22px] cursor-pointer text-gray-400 hover:text-white transition' title='Image' />
                            <PiGif className="text-[22px] cursor-pointer text-gray-400 hover:text-white transition" title='GIF' />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen h-full justify-center w-full">
            {hasImages ? (
                // ==========================================
                // IMAGE LAYOUT (70 / 30 Split)
                // ==========================================
                <>
                    <div className="w-[70vw] h-full relative bg-black">
                        <div className="absolute p-3 z-20 modelpostopen-bg w-full flex items-center gap-2">
                            <IoMdCloseCircle onClick={handleBack} title="Close" className="text-[32px] cursor-pointer text-white hover:text-gray-300 transition" />
                            <Link href={`/@${post?.author?.username}`} className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden border border-white/20">
                                {postAuthorDP ? (
                                    <Image src={postAuthorDP} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                        {postAuthorFName?.charAt(0) || "U"}
                                    </div>
                                )}
                            </Link>
                            <div className="grid ml-1.5 text-white">
                                <Link href={`/@${post?.author?.username}`} className="text-[22px] font-medium leading-tight hover:underline">{postAuthorFName} {postAuthorLName}</Link>
                                <span suppressHydrationWarning className="text-[12px] text-gray-300">
                                    {postCreatedAt ? formatDistanceToNowStrict(new Date(postCreatedAt), { addSuffix: true }) : "Just now"}
                                </span>
                            </div>
                        </div>

                        <div className="w-full lg:w-[70vw] h-full relative bg-black flex items-center justify-center group/slider">
                            <div className="w-full h-full relative flex items-center justify-center">
                                <Image
                                    src={images[currentIndex]}
                                    className='w-full h-full object-cover blur-3xl opacity-40 absolute top-0 z-0'
                                    alt='Background Blur'
                                    width={100}
                                    height={100}
                                />
                                <Image
                                    src={images[currentIndex]}
                                    className='w-full max-h-full object-contain relative z-10 transition-opacity duration-300'
                                    alt={`Post Image ${currentIndex + 1}`}
                                    blurDataURL={images[currentIndex]}
                                    width={1200}
                                    height={1200}
                                />

                                {hasMultipleImages && (
                                    <>
                                        {currentIndex > 0 && (
                                            <button onClick={prevImage} className="absolute left-4 z-30 p-2.5 bg-black/40 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover/slider:opacity-100">
                                                <IoIosArrowBack size={24} className="relative right-0.5" />
                                            </button>
                                        )}
                                        {currentIndex < images.length - 1 && (
                                            <button onClick={nextImage} className="absolute right-4 z-30 p-2.5 bg-black/40 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover/slider:opacity-100">
                                                <IoIosArrowForward size={24} className="relative left-0.5" />
                                            </button>
                                        )}
                                        <div className="absolute bottom-6 z-30 flex gap-2">
                                            {images.map((_: any, idx: number) => (
                                                <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-[30vw] h-full bg-primary z-20 flex flex-col border-l border-main-border">
                        {renderPostContent()}
                    </div>
                </>
            ) : (
                // ==========================================
                // TEXT-ONLY LAYOUT (Centered Column)
                // ==========================================
                <div className="flex items-center h-full">
                    <div className="w-[540px] h-[90%] max-w-[700px] rounded-xl overflow-hidden bg-primary z-20 flex flex-col relative shadow-2xl border-x border-main-border">
                        {/* Header with Close Button for Text-Only */}
                        <div className="px-5 py-3 border-b border-main-border flex items-center gap-4 sticky top-0 bg-primary z-40">
                            <IoMdCloseCircle onClick={handleBack} title="Close" className="text-[32px] cursor-pointer text-foreground hover:text-gray-400 transition" />
                            <h2 className="text-xl font-bold text-foreground">Post</h2>
                        </div>
                        {renderPostContent()}
                    </div>
                </div>
            )}
        </div>
    )
}