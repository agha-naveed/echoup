import FeedPage from "@/components/Feed"; 
import Image from "next/image"
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";

const UserProfilePage = async ({ params }: { params: Promise<{ user: string }> }) => {

    const resolvedParams = await params; 
    
    let rawUsername = decodeURIComponent(resolvedParams.user);

    if (rawUsername.startsWith("@")) {
        rawUsername = rawUsername.substring(1);
    } else {
        notFound(); 
    }

    const supabase = await createClient();

    // 1. Get the current logged-in user
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // 2. Fetch the viewed user's profile
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("username", rawUsername)
        .single();

    if (!profile || profileError) notFound();

    // 3. Fetch their posts
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

    // 4. Fetch Follower and Following Counts
    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

    // 5. Check if the current user is following this profile
    let isFollowing = false;
    if (authUser) {
        const { data: followRecord } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', authUser.id)
            .eq('following_id', profile.id)
            .maybeSingle(); // maybeSingle prevents errors if they aren't following
            
        if (followRecord) isFollowing = true;
    }

    const fullName = `${profile.first_name} ${profile.last_name || ""}`.trim();
    const profileImageUrl = profile.profile_image || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

    return (
        <div className="min-h-screen container mx-auto w-full">
            <div className="relative">
                <div className="w-full flex max-w-[1500px] sm:h-[270px] h-[37vw] object-cover rounded-xl overflow-hidden bg-dark-clr">
                    <Image src={profile.cover_image} width={1000} height={1000} alt="Cover Page" className="w-full object-cover" />
                </div>
                <div className="absolute sm:max-w-[180px] sm:min-w-[180px] sm:w-[180px] sm:min-h-[180px] sm:max-h-[180px] sm:h-[180px] min-w-[100px] w-[30vmin] min-h-[100px] h-[30vmin] overflow-hidden rounded-full sm:outline-7 outline-4 outline-light-clr -bottom-4 sm:left-12 left-9 bg-primary">
                    <Image src={profileImageUrl} width={360} height={480} alt={`${fullName}'s Profile Picture`} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Injected Client Component for Interactivity */}
            <ProfileHeader 
                profile={profile}
                currentUserId={authUser?.id}
                initialIsFollowing={isFollowing}
                initialFollowersCount={followersCount || 0}
                initialFollowingCount={followingCount || 0}
                postCount={initialPosts?.length || 0}
            />

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