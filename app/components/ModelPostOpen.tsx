"use client"
import Image from "next/image";
import { useEffect, useInsertionEffect, useRef, useState } from "react";
import { PostType } from "../types/post";
import { IoIosArrowDown, IoMdCloseCircle } from "react-icons/io";
import { useRouter } from "next/navigation";
import { BsEmojiSmile } from "react-icons/bs";
import { CiCamera } from "react-icons/ci";
import { PiGif } from "react-icons/pi";
import { RiSendPlaneFill } from "react-icons/ri";
import Link from "next/link";

export default function ModelPostOpen() {

    const [isEmpty, setIsEmpty] = useState(true);
    const [isFocus, setIsFocus] = useState(false)
    const [sortComment, setSortComment] = useState("new")
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const [post, setPost] = useState<PostType>()
    const navigate = useRouter();

    const [comments, setComments] = useState(["this is good!", "mashallah", "Lorem Ipsum"])

    const getData = async () => {
        const response = await fetch("/api/demo")
        const res = await response.json()
        setPost(res[1])
        console.log(res[1])
    }
    useInsertionEffect(() => {
        getData()
    }, [])

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate.back();
        } else {
            navigate.push("/");
        }
    };
    const sortAllComments = () => {
        setComments(prevComments => [...prevComments].reverse());
    }

    const handleInput = (e: any) => {
        const text = e.currentTarget.textContent.trim();
        setIsEmpty(!text);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex min-h-screen h-full">
            <div className="w-[70vw] h-full">
                <div className="absolute p-3 z-10 modelpostopen-bg w-full flex items-center gap-2">
                    <IoMdCloseCircle onClick={handleBack} title="Close" className="text-[32px] cursor-pointer text-foreground" />
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                        {
                            post?.author &&
                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                        }
                    </div>
                    <div className="grid ml-1.5 text-foreground">
                        <span className="text-[22px] font-medium">{post?.author?.name}</span>
                        <span className="text-[12px]">8h ago</span>
                    </div>
                </div>
                <div className="w-full h-full bg-black content-center">
                    {
                        post?.content?.image &&
                        <>
                            <Image src={post?.content?.image} className='w-full max-h-full cursor-pointer relative z-10' alt='' width={1000} height={1000} />
                            <Image src={post?.content?.image} className='w-full h-screen blur-lg opacity-30 cursor-pointer absolute top-0 z-0' alt='' width={1000} height={1000} />
                        </>
                    }
                </div>
            </div>
            <div className="w-[30vw] h-full bg-primary z-20">
                <div className="px-5 py-4">
                    <div className="flex gap-1">
                        <Link href={""} className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                            {
                                post?.author &&
                                <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            }
                        </Link>
                        <div className="grid ml-1.5 text-foreground">
                            <Link href={""} className="text-[18px] font-medium">{post?.author?.name}</Link>
                            <span className="text-[12px]">8h ago</span>
                        </div>
                    </div>
                    {
                        post?.content?.text && <span className="text-xl text-foreground">{post?.content?.text}</span>
                    }
                </div>
                <div className="px-5">
                    <div className="w-full h-px bg-light-clr px-5"></div>
                </div>

                <div className='px-5 py-4 grid gap-3 relative'>
                    <div className='w-fit h-7.5' ref={dropdownRef}>
                        <ul className={`${isOpen ? "bg-zinc-900 rounded-lg" : "bg-zinc-900/20 rounded-full"} w-fit group absolute top-2 overflow-hidden`}>
                            <li onClick={() => setIsOpen(true)} className='flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-zinc-900/30 w-full px-3.5 py-1.5 text-[15px]'>
                                <span>{sortComment == "old" ? "Oldest Comments" : "New Comments"}</span>
                                <IoIosArrowDown />
                            </li>
                            {
                                isOpen &&
                                <li onClick={() => { setSortComment(sortComment == "new" ? "old" : "new"); setIsOpen(false); sortAllComments() }} className={`flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-white/2 px-3.5 py-1.5 text-[15px] w-full`}>
                                    <span>{sortComment == "new" ? "Oldest Comments" : "New Comments"}</span>
                                </li>
                            }
                        </ul>
                    </div>
                    {
                        comments.map((item, idx) => (
                            <div key={`-comment-${idx}`} className='flex items-start gap-1.5'>
                                <Link href={""} className='min-w-10 h-10 rounded-full overflow-hidden'>
                                    {
                                        post?.author ?
                                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                                            : null
                                    }
                                </Link>
                                <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5'>
                                    <Link href={""} title='Syed Nveed Abbas Profile' className='font-medium w-fit'>Syed Naveed Abbas</Link>
                                    <span className='text-foreground'>{item}</span>
                                </div>
                            </div>
                        ))
                    }

                    <div className='flex items-start gap-1.5'>
                        <Link href={""} className='min-w-10 h-10 rounded-full overflow-hidden'>
                            {
                                post?.author ?
                                    <Image src={post?.author?.avatar} alt="DP" width={100} height={100} className="w-full h-full object-cover" />
                                    : null
                            }
                        </Link>
                        <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5 w-full'
                            onFocus={(e) => {
                                if (e.currentTarget.contains(e.target)) {
                                    setIsFocus(true);
                                }
                            }}
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setIsFocus(false);
                                }
                            }}>
                            <div className="select-none overflow-hidden min-w-0 flex-1 group">
                                <div className="flex items-end relative overflow-hidden">
                                    <div
                                        contentEditable
                                        role="textbox"
                                        aria-multiline="true"
                                        aria-label='Commenting as Syed Naveed Abbas'
                                        data-placeholder="Commenting as Syed Naveed Abbas"
                                        onInput={handleInput}
                                        className={`editable-div ${isEmpty ? "is-empty" : ""} w-full lg:max-h-125 max-h-75 ${isFocus ? "min-h-10" : "min-h-7.25"} overflow-hidden resize-none p-1 pr-9 outline-none
                                    whitespace-pre-wrap wrap-break-words break-all select-text`} />
                                    <button className='hover:bg-main-dark-blue transition-all cursor-pointer absolute right-0 p-1 rounded-full' title='Send Message'>
                                        <RiSendPlaneFill className='text-xl relative left-[-1.5px] top-px' />
                                    </button>
                                </div>
                                <div className={`items-center gap-2 ${isFocus ? "flex" : "hidden"}`}>
                                    <button type='button'>
                                        <BsEmojiSmile className='text-[16px] cursor-pointer' title='Insert an Emoji' />
                                    </button>
                                    <button type='button'>
                                        <CiCamera className='text-xl cursor-pointer' title='Add an Image' />
                                    </button>
                                    <button type='button'>
                                        <PiGif className="text-[22px] cursor-pointer" title='Insert a GIF Image' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}