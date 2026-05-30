import FeedPage from "@/components/Feed"; // Adjust path if needed
import Image from "next/image"
import Link from "next/link";
import { GoPlus } from "react-icons/go";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

// Next.js passes dynamic route parameters via the 'params' prop
const UserProfilePage = async ({ params }: { params: { user: string } }) => {
    // Await params for Next.js 15+ compatibility
    const resolvedParams = await params; 
    
    // 1. Decode the URL (turns "%40ali" into "@ali")
    let rawUsername = decodeURIComponent(resolvedParams.user);

    // 2. Strip the "@" symbol if it exists, otherwise enforce it by returning 404
    if (rawUsername.startsWith("@")) {
        rawUsername = rawUsername.substring(1);
    } else {
        // If a user tries to visit /ali instead of /@ali, show 404 page
        notFound(); 
    }

    const supabase = await createClient();

    // 3. Fetch the user's profile details using the clean username
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("username", rawUsername)
        .single();

    // If the user doesn't exist in the database, show a 404
    if (!profile || profileError) {
        notFound();
    }

    // 4. Fetch the posts specifically authored by this user
    const { data: initialPosts } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            image_url,
            created_at,
            author:users ( id, username, first_name, last_name, profile_image ),
            likes ( id ),
            comments (
                id,
                content,
                created_at,
                author:users ( id, username, first_name, last_name, profile_image )
            ),
            shares ( id )
        `)
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

    // Format the display name safely handling the nullable last name
    const fullName = `${profile.first_name} ${profile.last_name || ""}`.trim();
    
    // Fallback DP if they haven't uploaded one
    const profileImageUrl = profile.profile_image || "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480";

    return (
        <div className="min-h-screen container mx-auto w-fit max-w-[730px]">
            <div className="relative">
                <div className="w-full flex max-w-[1500px] sm:h-[270px] h-[37vw] object-cover rounded-xl overflow-hidden bg-dark-clr">
                    <Image src={"https://static.vecteezy.com/system/resources/thumbnails/033/252/051/small/space-for-text-on-textured-background-surrounded-by-a-lion-in-watercolor-style-background-image-ai-generated-photo.jpg"} width={1000} height={1000} alt="Cover Page" className="w-full object-cover" />
                </div>
                <div className="absolute sm:max-w-[180px] sm:min-w-[180px] sm:w-[180px] sm:min-h-[180px] sm:max-h-[180px] sm:h-[180px] min-w-[100px] w-[30vmin] min-h-[100px] h-[30vmin] overflow-hidden rounded-full sm:outline-7 outline-4 outline-light-clr -bottom-4 sm:left-12 left-9 bg-primary">
                    <Image src={profileImageUrl} width={360} height={480} alt={`${fullName}'s Profile Picture`} className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="sm:px-7 pt-5 pb-5 px-3">
                <div className="flex items-center justify-between">
                    <div className="text-foreground">
                        <h3 className="sm:text-3xl text-2xl font-medium">{fullName}</h3>
                        <p className="text-gray-400">@{profile.username}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-dark-clr px-2.25 rounded-lg border border-foreground/10 cursor-pointer transition-all hover:bg-light-clr outline-none flex items-center justify-center">
                            <HiOutlineDotsHorizontal className="text-xl text-foreground h-full" />
                        </button>
                        <button className="btn-gradient outline-none flex items-center gap-1 px-4 py-2 rounded-lg">
                            <GoPlus className="text-xl relative -left-0.5" />
                            <span>Follow</span>
                        </button>
                    </div>
                </div>

                <div className="text-foreground">
                    <p className="sm:w-[60%] w-full my-5">
                        Software Developer at Echo Up. Share your world and connect with others.
                    </p>
                    <div className="sm:text-[17px] text-[15px] flex gap-7">
                        <div className="text-center"><span className="font-medium text-white">{initialPosts?.length || 0}</span> Posts</div>
                        <div className="text-center"><span className="font-medium text-white">0</span> Followers</div>
                        <div className="text-center"><span className="font-medium text-white">0</span> Following</div>
                    </div>
                </div>
            </div>

            <div className="border-b border-b-main-border"></div>

            <div className="sm:px-7 px-3 py-2">
                <div className="flex sm:justify-start justify-between gap-4 border-b border-b-main-border">
                    <button className="sm:text-[18px] text-[15px] text-white">
                        <span className="sm:px-[7px] sm:py-[9px] py-2 block font-medium cursor-pointer">Posts</span>
                        <div className="w-full h-[2px] bg-main-blue"></div>
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
                <FeedPage initialPosts={initialPosts || []} />
            </div>
        </div>
    )
}

export default UserProfilePage;