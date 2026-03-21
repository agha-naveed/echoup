"use client"
import Image from 'next/image'
import { GoHeart, GoHeartFill, GoComment } from "react-icons/go";
import { RiSendPlaneFill, RiShareForward2Line } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { PostType } from '../types/post';
import Link from 'next/link';
import { useEffect, useInsertionEffect, useRef, useState } from 'react';
import { BsEmojiSmile } from "react-icons/bs";
import { CiCamera } from 'react-icons/ci';
import { PiGif } from 'react-icons/pi';
import { IoIosArrowDown } from 'react-icons/io';

export default function PostOpen() {
    const [post, setPost] = useState<PostType>()
    const [isEmpty, setIsEmpty] = useState(true);
    const [isFocus, setIsFocus] = useState(false)
    const [sortComment, setSortComment] = useState("new")
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const getData = async () => {
        const response = await fetch("/api/demo")
        const res = await response.json()
        setPost(res[1])
    }
    useInsertionEffect(() => {
        getData()
    }, [])

    
    const handleInput = (e:any) => {
        const text = e.currentTarget.textContent.trim();
        setIsEmpty(!text);
    };

    useEffect(() => {
        const handleClickOutside = (event:MouseEvent) => {
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
        <div className='bg-primary rounded-2xl w-full h-fit border border-main-border shadow-lg overflow-auto'>
            <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-3'>
                    <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                        {
                            post?.author ?
                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            : null
                        }
                    </div>

                    <div className='text-foreground flex flex-col'>
                        <h4 className='font-medium text-[17px]'>{post?.author?.name}</h4>
                        <span className='text-[11px] text-foreground/70'>{post?.createdAt}</span>
                    </div>
                </div>
                <HiOutlineDotsHorizontal className='text-[22px] p-1.5 cursor-pointer w-8.75 h-8.75 transition-all hover:bg-dark-clr rounded-full text-foreground' />
            </div>

            <div className='grid gap-3 overflow-hidden max-h-87.5'>
                {
                    post?.content.text && <h4 className='text-white text-[17px] px-5'>{post?.content.text}</h4>
                }
                {
                    post?.content.image &&
                    <div className=''>
                        <Image src={post?.content.image || ""} className='w-full max-h-full cursor-pointer' alt='' width={1000} height={1000} />
                    </div>
                }
            </div>

            <div className='px-3 mt-4 flex items-center gap-0.5 text-foreground'>
                
                <button className='flex items-center gap-2 md:text-[19px] text-[16px] group cursor-pointer transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full' title='Like this post'>
                    <GoHeart className='group-hover:hidden block' />
                    <GoHeartFill className='group-hover:block hidden' />
                    <span className='md:text-[17px] text-[15px]'>{post?.likes}</span>
                </button>

                <button className='md:text-[19px] text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full' title='Comment this post'>
                    <GoComment />
                    <span className='md:text-[17px] text-[15px]'>{post?.comments}</span>
                </button>

                <button className='flex items-center gap-2 md:text-[19px] text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 md:px-4 px-3.25 py-1.25 rounded-full' title='Share this post'>
                    <RiShareForward2Line />
                    <span className='md:text-[17px] text-[15px]'>{post?.shares}</span>
                </button>

            </div>

            <div className='px-5 py-4 grid gap-3 relative'>
                <div className='w-fit h-7.5' ref={dropdownRef}>
                    <ul className={`${isOpen ? "bg-zinc-900 rounded-lg" : "bg-zinc-900/20 rounded-full"} w-fit group absolute top-2 overflow-hidden`}>
                        <li onClick={() => setIsOpen(true)} className='flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-zinc-900/30 w-full px-3.5 py-1.5 text-[15px]'>
                            <span>{sortComment == "old" ? "Oldest Comment" : "New Comment"}</span>
                            <IoIosArrowDown />
                        </li>
                        {
                            isOpen &&
                            <li onClick={() => { setSortComment(sortComment == "new" ? "old" : "new"); setIsOpen(false) }} className={`flex gap-1 items-center text-foreground cursor-pointer transition-all hover:bg-white/2 px-3.5 py-1.5 text-[15px] w-full`}>
                                <span>{sortComment == "new" ? "Oldest Comment" : "New Comment"}</span>
                            </li>
                        }
                    </ul>
                </div>
                <div className='flex items-start gap-1.5'>
                    <Link href={""} className='min-w-10 h-10 rounded-full overflow-hidden'>
                        {
                            post?.author ?
                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            : null
                        }
                    </Link>
                    <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5'>
                        <Link href={""} title='Syed Nveed Abbas Profile' className='font-medium w-fit'>Syed Naveed Abbas</Link>
                        <span className='text-foreground'>Hello this is good!! Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque reprehenderit a dolore qui voluptate non ullam, aut corrupti ratione sapiente!</span>
                    </div>
                </div>
                <div className='flex items-start gap-1.5'>
                    <Link href={""} className='min-w-10 h-10 rounded-full overflow-hidden'>
                        {
                            post?.author ?
                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            : null
                        }
                    </Link>
                    <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5'>
                        <Link href={""} title='Syed Nveed Abbas Profile' className='font-medium w-fit'>Syed Naveed Abbas</Link>
                        <span className='text-foreground'>Hello this is good!! Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque reprehenderit a dolore qui voluptate non ullam, aut corrupti ratione sapiente!</span>
                    </div>
                </div>
                <div className='flex items-start gap-1.5'>
                    <Link href={""} className='min-w-10 h-10 rounded-full overflow-hidden'>
                        {
                            post?.author ?
                            <Image src={post?.author?.avatar} alt="..." width={100} height={100} className="w-full h-full object-cover" />
                            : null
                        }
                    </Link>
                    <div className='grid gap-1 text-foreground text-[15px] bg-dark-clr/40 rounded-[10px] py-1.5 px-2.5'>
                        <Link href={""} title='Syed Nveed Abbas Profile' className='font-mediumw-fit'>Syed Naveed Abbas</Link>
                        <span className='text-foreground'>Hello this is good!! Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque reprehenderit a dolore qui voluptate non ullam, aut corrupti ratione sapiente!</span>
                    </div>
                </div>

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
    )
}