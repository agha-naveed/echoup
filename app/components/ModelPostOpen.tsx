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
import { useSession } from "next-auth/react";
import { formatDistanceToNowStrict } from "date-fns";
import axios from "axios";
import { GoComment, GoHeart, GoHeartFill } from "react-icons/go";


export default function ModelPostOpen({ initialPost, query }: { initialPost: any, query: any }) {


    const { data: session } = useSession();
    const currentUser = session?.user;


    const photoQuery = query.photo;

    const initialIndex = photoQuery ? +photoQuery - 1 : 0;


    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const [likes, setLikes] = useState<any[]>(initialPost?.likes || []);
    const [shares, setShares] = useState<any[]>(initialPost?.shares || []);
    const [comments, setComments] = useState<any[]>(initialPost?.comments || []);

    const currentPhotoLikes = likes.filter((l: any) => l.photoIndex === currentIndex);
    const currentPhotoShares = shares.filter((s: any) => s.photoIndex === currentIndex);
    const currentPhotoComments = comments.filter((c: any) => c.photoIndex === currentIndex);

    const isLiked = currentPhotoLikes.some((l: any) => l.userId === currentUser?.id);

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

    const post = initialPost


    const handleLike = () => {
        if (!post?.id || !currentUser) return;

        if (isLiked) {
            setLikes((prev: any[]) => prev.filter(l => !(l.userId === currentUser.id && l.photoIndex === currentIndex)));
        } else {
            setLikes((prev: any[]) => [
                ...prev,
                { id: `temp-like-${Date.now()}`, userId: currentUser.id, photoIndex: currentIndex }
            ]);
        }

        if (likeTimeoutRef.current) {
            clearTimeout(likeTimeoutRef.current);
        }

        likeTimeoutRef.current = setTimeout(async () => {
            try {
                await axios.post("/api/likes", {
                    postId: post.id,
                    photoIndex: currentIndex
                });
            } catch (error) {
                console.error("Failed to sync like with server");

                if (isLiked) {
                    setLikes((prev: any[]) => [...prev, { id: `temp-like-${Date.now()}`, userId: currentUser.id, photoIndex: currentIndex }]);
                } else {
                    setLikes((prev: any[]) => prev.filter(l => !(l.userId === currentUser.id && l.photoIndex === currentIndex)));
                }
            }
        }, 800);
    };

    const handleShare = async () => {
        if (!post?.id || isSharing || !currentUser) return;

        setIsSharing(true);

        const tempShare = { id: `temp-share-${Date.now()}`, userId: currentUser.id, photoIndex: currentIndex };
        setShares((prev: any[]) => [...prev, tempShare]);

        try {
            await axios.post("/api/shares", {
                postId: post.id,
                photoIndex: currentIndex
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
            if (likeTimeoutRef.current) {
                clearTimeout(likeTimeoutRef.current);
            }
        };
    }, []);


    // ================ Slider ================

    const images = initialPost?.imageUrl || [];

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

    // ================ Slider Ended ================


    console.log(post)
    const [realComments, setRealComments] = useState(post?.comments || []);

    const commentRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCommentSubmit = async () => {
        const text = commentRef.current?.innerText.trim();
        if (!text || isSubmitting || !post?.id) return;

        setIsSubmitting(true);

        const temporaryComment = {
            id: `temp-${Date.now()}`,
            content: text,
            createdAt: new Date().toISOString(),
            author: {
                username: currentUser?.name?.replace(/\s+/g, '').toLowerCase() || "user",
                firstName: currentUser?.name?.split(" ")[0] || "User",
                lastName: currentUser?.name?.split(" ")[1] || "",
                profileImage: currentUser?.image || null,
            }
        };

        try {
            const addComment = await axios.post("/api/comments", {
                postId: post.id,
                content: text,
                photoIndex: currentIndex
            });

            if (addComment.status == 200) {
                setRealComments((prevComments: any) => [temporaryComment, ...(prevComments || [])]);
                if (commentRef.current) commentRef.current.innerText = "";
                setIsEmpty(true);
            }

        } catch (error) {
            alert("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        const isInsideApp = window.history.length > 1 && document.referrer.includes(window.location.host);

        if (isInsideApp) {
            navigate.back();
        } else {
            navigate.push(`/${post?.author?.username || ""}`);
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

    return (
        <div className="flex min-h-screen h-full">
            <div className="w-[70vw] h-full relative bg-black">
                <div className="absolute p-3 z-20 modelpostopen-bg w-full flex items-center gap-2">
                    <IoMdCloseCircle onClick={handleBack} title="Close" className="text-[32px] cursor-pointer text-white hover:text-gray-300 transition" />
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden border border-white/20">
                        {post?.author?.profileImage ? (
                            <Image src={post.author.profileImage} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                {post?.author?.firstName?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>
                    <div className="grid ml-1.5 text-white">
                        <span className="text-[22px] font-medium leading-tight">{post?.author?.firstName} {post?.author?.lastName}</span>
                        <span className="text-[12px] text-gray-300">
                            {post?.createdAt ? formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true }) : "Just now"}
                        </span>
                    </div>
                </div>

                <div className="w-full lg:w-[70vw] h-full relative bg-black flex items-center justify-center group/slider">

                    {images.length > 0 && (
                        <>
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
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 z-30 p-2.5 bg-black/40 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover/slider:opacity-100"
                                            >
                                                <IoIosArrowBack size={24} className="relative right-0.5" />
                                            </button>
                                        )}

                                        {currentIndex < images.length - 1 && (
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 z-30 p-2.5 bg-black/40 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover/slider:opacity-100"
                                            >
                                                <IoIosArrowForward size={24} className="relative left-0.5" />
                                            </button>
                                        )}

                                        <div className="absolute bottom-6 z-30 flex gap-2">
                                            {images.map((_: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                                        ? 'w-4 bg-white'
                                                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>)}
                </div>

            </div>

            <div className="w-[30vw] h-full bg-primary z-20 flex flex-col border-l border-main-border">

                <div className="px-5 py-4">
                    <div className="flex gap-2">
                        <Link href={`/${post?.author?.username}`} className="min-w-[45.5px] w-[45.5px] h-[45.5px] rounded-full overflow-hidden border border-main-border">
                            {post?.author?.profileImage ? (
                                <Image src={post.author.profileImage} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                    {post?.author?.firstName?.charAt(0) || "U"}
                                </div>
                            )}
                        </Link>
                        <div className="grid ml-1.5 text-foreground">
                            <Link href={`/${post?.author?.username}`} className="text-[18px] font-medium hover:underline">{post?.author?.firstName} {post?.author?.lastName}</Link>
                            <span className="text-[12px] text-gray-400">
                                {post?.createdAt ? formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true }) : ""}
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

                    {/* LIKE BUTTON */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 text-[16px] transition-all hover:bg-dark-clr/50 px-3 py-1.5 rounded-full ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                        {/* If isLiked is true, show the filled red heart immediately! */}
                        {isLiked ? <GoHeartFill className="text-[22px]" /> : <GoHeart className="text-[22px]" />}
                        <span className='font-medium'>{likeCount}</span>
                    </button>

                    {/* COMMENT BUTTON */}
                    <button
                        onClick={() => setIsFocus(true)}
                        className='text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 hover:text-main-blue px-3 py-1.5 rounded-full'
                    >
                        <GoComment className="text-[20px]" />
                        {/* Shows the exact comment count for THIS photo */}
                        <span className='font-medium'>{commentCount}</span>
                    </button>

                    {/* SHARE BUTTON */}
                    <button
                        onClick={handleShare}
                        className='flex items-center gap-2 text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 hover:text-green-500 px-3 py-1.5 rounded-full'
                    >
                        <RiShareForward2Line className="text-[22px]" />
                        {/* Shows the exact share count for THIS photo */}
                        <span className='font-medium'>{shareCount}</span>
                    </button>
                </div>

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

                    {/* Comments List */}
                    {realComments.length === 0 ? (
                        <div className="text-center text-gray-500 text-[14px] mt-10">
                            No comments yet. Be the first to reply!
                        </div>
                    ) : (
                        realComments.map((comment: any) => (
                            currentIndex == comment.photoIndex &&
                            <div key={comment.id} className='flex items-start gap-2'>

                                <Link href={`/${comment.author.username}`} className='min-w-10 h-10 rounded-full overflow-hidden border border-main-border shrink-0'>
                                    {comment.author.profileImage ? (
                                        <Image src={comment?.author.profileImage} alt={`${comment?.author.firstName} ${comment?.author.lastName} Profile Picture`} width={100} height={100} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-main-blue flex items-center justify-center text-white font-bold uppercase">
                                            {comment.author.firstName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </Link>

                                <div className='grid gap-1 text-foreground text-[14px] bg-dark-clr/40 rounded-[12px] rounded-tl-none py-2 px-3'>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/${comment.author.username}`} className='font-bold w-fit text-[13px] hover:underline'>
                                            {comment.author.firstName} {comment.author.lastName}
                                        </Link>
                                        <span className="text-[11px] text-gray-500">
                                            {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <span className='text-foreground whitespace-pre-wrap'>{comment.content}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className='p-4 border-t border-main-border mt-auto'>
                    <div className='flex items-start gap-2'>
                        <div className='min-w-10 h-10 rounded-full overflow-hidden border border-main-border shrink-0'>
                            {currentUser?.image ? (
                                <Image src={currentUser.image} alt="DP" width={100} height={100} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-main-blue flex items-center justify-center font-bold text-white uppercase">
                                    {currentUser?.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>

                        <div className={`grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-xl py-1.5 px-2.5 w-full border transition-all ${isFocus ? "border-main-blue/50" : "border-main-border"}`}
                            onFocus={(e) => {
                                if (e.currentTarget.contains(e.target)) setIsFocus(true);
                            }}
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) setIsFocus(false);
                            }}>
                            <div className="flex items-end relative overflow-hidden">
                                <div
                                    ref={commentRef}
                                    role="textbox"
                                    contentEditable
                                    aria-multiline="true"
                                    data-placeholder={`Commenting as ${currentUser?.name || "User"}...`}
                                    onInput={handleInput}
                                    className={`editable-div ${isEmpty ? "is-empty" : ""} w-full max-h-[150px] ${isFocus ? "min-h-[100px]" : "min-h-[30px]"} overflow-y-auto resize-none p-1 pr-9 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                                />
                                <button onClick={handleCommentSubmit} className={`${isEmpty && "opacity-50 cursor-auto!"}  text-main-blue hover:bg-main-blue/10 transition-all cursor-pointer absolute right-0 bottom-0 p-1.5 rounded-full mb-0.5`} title='Send Message'>
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
            </div>
        </div >
    )
}