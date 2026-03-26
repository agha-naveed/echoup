"use client"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PostType } from "../types/post"; // Adjust path if needed
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowForward, IoMdCloseCircle } from "react-icons/io";
import { useRouter } from "next/navigation";
import { BsEmojiSmile } from "react-icons/bs";
import { CiCamera } from "react-icons/ci";
import { PiGif } from "react-icons/pi";
import { RiSendPlaneFill } from "react-icons/ri";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNowStrict } from "date-fns";

// Tell TypeScript to expect the initialPost prop!
export default function ModelPostOpen({ initialPost, query }: { initialPost: any, query: any }) {

    const { data: session } = useSession();
    const currentUser = session?.user;

    const [isEmpty, setIsEmpty] = useState(true);
    const [isFocus, setIsFocus] = useState(false);
    const [sortComment, setSortComment] = useState("new");
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useRouter();


    const [post, setPost] = useState<PostType | any>(initialPost);


    // ================ Slider ================

    const images = initialPost?.imageUrl || [];

    const hasMultipleImages = images.length > 1;

    const photoQuery = query.photo;

    const initialIndex = photoQuery ? parseInt(photoQuery) - 1 : 0;


    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const nextImage = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevImage = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // ==========================================


    const [comments, setComments] = useState(["this is good!", "mashallah", "Lorem Ipsum"]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate.back();
        } else {
            navigate.push("/");
        }
    };

    const sortAllComments = () => {
        setComments(prevComments => [...prevComments].reverse());
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

                <div className='flex-1 overflow-y-auto px-5 py-4 grid gap-4 content-start relative'>
                    <div className='w-fit h-7.5 relative z-30' ref={dropdownRef}>
                        <ul className={`${isOpen ? "bg-zinc-900 rounded-lg shadow-xl" : "bg-dark-clr rounded-full"} w-max group absolute top-0 overflow-hidden`}>
                            <li onClick={() => setIsOpen(true)} className='flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-zinc-900/30 w-full px-3 py-1.5 text-[14px] font-medium'>
                                <span>{sortComment === "old" ? "Oldest First" : "Newest First"}</span>
                                <IoIosArrowDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </li>
                            {isOpen && (
                                <li onClick={() => { setSortComment(sortComment === "new" ? "old" : "new"); setIsOpen(false); sortAllComments() }} className={`flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-white/10 px-4 py-2 text-[14px] w-full border-t border-main-border`}>
                                    <span>{sortComment === "new" ? "Sort by Oldest" : "Sort by Newest"}</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {comments.map((item, idx) => (
                        <div key={`post-model-comment-${idx}`} className='flex items-start gap-2'>
                            <div className='min-w-10 h-10 rounded-full overflow-hidden bg-main-blue flex items-center justify-center text-white font-bold shrink-0'>U</div>
                            <div className='grid gap-1 text-foreground text-[14px] bg-dark-clr/40 rounded-[12px] rounded-tl-none py-2 px-3'>
                                <span className='font-bold w-fit text-[13px]'>Random User</span>
                                <span className='text-foreground'>{item}</span>
                            </div>
                        </div>
                    ))}
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
                                    contentEditable
                                    role="textbox"
                                    aria-multiline="true"
                                    data-placeholder={`Commenting as ${currentUser?.name || "User"}...`}
                                    onInput={handleInput}
                                    className={`editable-div ${isEmpty ? "is-empty" : ""} w-full max-h-[150px] min-h-[30px] overflow-y-auto resize-none p-1 pr-9 outline-none whitespace-pre-wrap wrap-break-words break-all select-text`}
                                />
                                <button disabled={isEmpty} className='disabled:opacity-50 disabled:cursor-not-allowed text-main-blue hover:bg-main-blue/10 transition-all cursor-pointer absolute right-0 bottom-0 p-1.5 rounded-full mb-0.5' title='Send Message'>
                                    <RiSendPlaneFill className='text-[20px] relative -left-px' />
                                </button>
                            </div>

                            <div className={`items-center gap-3 pt-2 pb-1 ${isFocus ? "flex" : "hidden"}`}>
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