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
    console.log(post)
    return (
        <div className='bg-primary rounded-2xl w-full h-fit border border-main-border shadow-lg'>
            <div className='flex items-center justify-between px-5 py-4'>
                <div className='flex items-center gap-3'>
                    <Link href={post.author?.username} className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                        {
                            post.author?.profileImage &&
                            <Image src={post?.author?.profileImage || ""} alt={`${post.author.firstName}'s Posts`} width={100} height={100} className="w-full h-full object-cover" />
                        }
                    </Link>

                    <div className='text-foreground flex flex-col'>
                        <Link href={post.author?.username} className='font-medium text-[17px]'>{post.author?.firstName} {post.author?.lastName}</Link>
                        <span className='text-[11px] text-foreground/70'>{post.createdAt.toString().substring(4, 15)}</span>
                    </div>
                </div>
                <HiOutlineDotsHorizontal className='text-[22px] p-[6px] cursor-pointer w-[35px] h-[35px] transition-all hover:bg-dark-clr rounded-full text-foreground' />
            </div>

            <Link href={"/post/asd"} className='grid gap-3 overflow-hidden max-h-[350px]'>
                {
                    post.content && <h4 className='text-white text-[17px] px-5'>{post?.content}</h4>
                }
                {
                    post?.imageUrl &&
                    <Image src={post?.imageUrl || ""} className='w-full max-h-full' alt='' width={1000} height={1000} />
                }
            </Link>

            <div className='px-3 py-4 flex items-center gap-[2px] text-foreground'>

                <button className='flex items-center gap-2 md:text-[19px] text-[16px] group cursor-pointer transition-all hover:bg-dark-clr/50 md:px-[16px] px-[13px] py-[5px] rounded-full' title='Like this post'>
                    <GoHeart className='group-hover:hidden block' />
                    <GoHeartFill className='group-hover:block hidden' />
                    <span className='md:text-[17px] text-[15px]'>{post.likes}</span>
                </button>

                <button className='md:text-[19px] text-[16px] cursor-pointer flex items-center gap-2 transition-all hover:bg-dark-clr/50 md:px-[16px] px-[13px] py-[5px] rounded-full' title='Comment this post'>
                    <GoComment />
                    <span className='md:text-[17px] text-[15px]'>{post.comments}</span>
                </button>

                <button className='flex items-center gap-2 md:text-[19px] text-[16px] cursor-pointer transition-all hover:bg-dark-clr/50 md:px-[16px] px-[13px] py-[5px] rounded-full' title='Share this post'>
                    <RiShareForward2Line />
                    <span className='md:text-[17px] text-[15px]'>{post.shares}</span>
                </button>

            </div>
        </div>
    )
}