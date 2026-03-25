import db from "@/app/api/lib/db";
import FeedPage from "@/app/components/Feed";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Image from "next/image"
import Link from "next/link";
import { GoPlus } from "react-icons/go";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

const page = async () => {

    const initialPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
        limit: 20,
        with: {
            author: true
        }
    });

    return (
        <div className="min-h-screen container mx-auto w-fit max-w-[730px]">
            <div className="relative">
                <div className="w-full flex max-w-[1500px] sm:h-[270px] h-[37vw] object-cover rounded-xl overflow-hidden">
                    <Image src={"https://static.vecteezy.com/system/resources/thumbnails/033/252/051/small/space-for-text-on-textured-background-surrounded-by-a-lion-in-watercolor-style-background-image-ai-generated-photo.jpg"} width={1000} height={1000} alt="Cover Page" className="w-full object-cover" />
                </div>
                <div className="absolute sm:max-w-[180px] sm:min-w-[180px] sm:w-[180px] sm:min-h-[180px] sm:max-h-[180px] sm:h-[180px] min-w-[100px] w-[30vmin] min-h-[100px] h-[30vmin] overflow-hidden rounded-full sm:outline-7 outline-4 outline-light-clr -bottom-4 sm:left-12 left-9">
                    <Image src={"https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"} width={360} height={480} alt="DP" className="w-full" />
                </div>
            </div>

            <div className="sm:px-7 pt-5 pb-5 px-3">
                <div className="flex items-center justify-between">
                    <div className="text-foreground">
                        <h3 className="sm:text-3xl text-2xl font-medium">Ali</h3>
                        <p>@ali</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-dark-clr px-2.25 rounded-lg border border-foreground/10 cursor-pointer transition-all hover:bg-light-clr outline-none">
                            <HiOutlineDotsHorizontal className="text-xl text-foreground h-full" />
                        </button>
                        <button className="btn-gradient outline-none">
                            <GoPlus className="text-xl relative -left-0.5" />
                            <span>Follow</span>
                        </button>
                    </div>
                </div>

                <div className="text-foreground">
                    <p className="sm:w-[60%] w-full my-5">CEO & Software Developer at echoup. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis, ipsam?</p>
                    <div className="sm:text-[17px] text-[15px] flex gap-7">
                        <Link href={""} className="text-center"><span className="font-medium text-white">1,209</span> Posts</Link>
                        <Link href={""} className="text-center"><span className="font-medium text-white">15.7K</span> Followers</Link>
                        <Link href={""} className="text-center"><span className="font-medium text-white">354</span> Following</Link>
                    </div>
                </div>
            </div>

            <div className="border-b border-b-main-border"></div>

            <div className="sm:px-7 px-3 py-2">
                <div className="flex sm:justify-start justify-between gap-4 border-b border-b-main-border">
                    <button className="sm:text-[18px] text-[15px] text-white">
                        <span className="sm:px-[7px] sm:py-[9px] py-2 block font-medium cursor-pointer">Posts</span>
                        <div className="w-full h-0 border border-main-blue"></div>
                    </button>
                    <button className="text-[18px] text-foreground cursor-pointer hover:text-white">
                        <span className="sm:px-[7px] sm:py-[9px] py-2 block">About</span>
                        <div className="w-full h-0"></div>
                    </button>
                    <button className="text-[18px] text-foreground cursor-pointer hover:text-white">
                        <span className="sm:px-[7px] sm:py-[9px] py-2 block">Friends</span>
                        <div className="w-full h-0"></div>
                    </button>
                    <button className="text-[18px] text-foreground cursor-pointer hover:text-white">
                        <span className="sm:px-[7px] sm:py-[9px] py-2 block">Photos</span>
                        <div className="w-full h-0"></div>
                    </button>
                </div>
            </div>

            <div className="sm:px-7 px-3 py-3 flex gap-3">
                <FeedPage initialPosts={initialPosts} />
                {/* <div className="p-4 min-w-70 h-50 bg-white">

                </div> */}
            </div>
        </div>
    )
}

export default page