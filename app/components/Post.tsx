"use client"
import Image from 'next/image'
import { GoHeart, GoHeartFill, GoComment } from "react-icons/go";
import { RiShareForward2Line } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { PostType } from '../types/post';
import Link from 'next/link';

type Props = {
    post: PostType
}

export default function Post({ post }: Props) {
    const images = post.imageUrl || [];
    const imageCount = images.length;

    const ImageTile = ({ src, alt, width = 600, height = 600, idx, cHeight }: any) => (
        <Link href={`/post/${post.id}?photo=${idx + 1}`} className={`${imageCount == 4 && "h-74.25! overflow-hidden"} w-full h-full relative group`}>
            <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
            
            <Image 
                src={src} 
                alt={alt || "Post attachment"} 
                className={`w-full h-[${cHeight}]! object-cover`} 
                width={width} 
                height={height}
                style={{height: imageCount == 4 ? "100%" : ""}}
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
                            <div className='grid grid-cols-2 gap-1 h-75'>
                                <ImageTile src={images[0]} idx={0} />
                                <ImageTile src={images[1]} idx={1} />
                            </div>
                        )}

                        {imageCount === 3 && (
                            <div className='flex gap-1 h-100'>
                                <div className='w-[65%] h-full'>
                                    <ImageTile src={images[0]} idx={0} />
                                </div>
                                <div className='flex w-[35%] flex-col gap-1 h-full'>
                                    <ImageTile src={images[1]} idx={1} cHeight={"175px"} />
                                    <ImageTile src={images[2]} idx={2} cHeight={"175px"} />
                                </div>
                            </div>
                        )}

                        {imageCount >= 4 && (
                            <div className='grid grid-cols-2 gap-1 h-full'>
                                <ImageTile src={images[0]} idx={0} width={400} height={300} cHeight={"100%"} />
                                <ImageTile src={images[1]} idx={1} width={400} height={300} cHeight={"100%"} />
                                <ImageTile src={images[2]} idx={2} width={400} height={300} cHeight={"100%"} />
                                <ImageTile src={images[3]} idx={3} width={400} height={300} cHeight={"100%"} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className='px-3 py-4 flex items-center gap-0.5 text-foreground'>
                <button className='flex items-center gap-2 md:text-[19px] text-[16px] group transition-all hover:bg-dark-clr/50 hover:text-red-500 md:px-4 px-3 py-1.5 rounded-full'>
                    <GoHeart className='group-hover:hidden block' />
                    <GoHeartFill className='group-hover:block hidden' />
                    <span className='md:text-[17px] text-[15px]'>{post.likes || 0}</span>
                </button>
                <button className='md:text-[19px] text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 hover:text-main-blue md:px-4 px-3 py-1.5 rounded-full'>
                    <GoComment />
                    <span className='md:text-[17px] text-[15px]'>{post.comments || 0}</span>
                </button>
                <button className='flex items-center gap-2 md:text-[19px] text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 hover:text-green-500 md:px-4 px-3 py-1.5 rounded-full'>
                    <RiShareForward2Line />
                    <span className='md:text-[17px] text-[15px]'>{post.shares || 0}</span>
                </button>
            </div>
        </div>
    )
}