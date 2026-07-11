"use client"
import { useState } from "react";
import { GoPlus } from "react-icons/go";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { createClient } from "@/utils/supabase/client";

type ProfileHeaderProps = {
    profile: any;
    currentUserId: string | undefined;
    initialIsFollowing: boolean;
    initialFollowersCount: number;
    initialFollowingCount: number;
    postCount: number;
};

export default function ProfileHeader({
    profile,
    currentUserId,
    initialIsFollowing,
    initialFollowersCount,
    initialFollowingCount,
    postCount
}: ProfileHeaderProps) {
    const supabase = createClient();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(initialFollowersCount);
    const [isProcessing, setIsProcessing] = useState(false);

    const isOwnProfile = currentUserId === profile.id;
    const fullName = `${profile.first_name} ${profile.last_name || ""}`.trim();

    const handleFollowToggle = async () => {
        if (!currentUserId || isProcessing || isOwnProfile) return;
        
        setIsProcessing(true);
        const wasFollowing = isFollowing;

        // Optimistic UI Update
        setIsFollowing(!wasFollowing);
        setFollowersCount((prev) => wasFollowing ? prev - 1 : prev + 1);

        try {
            if (wasFollowing) {
                await supabase.from("follows").delete()
                    .match({ follower_id: currentUserId, following_id: profile.id });
            } else {
                await supabase.from("follows").insert({
                    follower_id: currentUserId,
                    following_id: profile.id
                });
            }
        } catch (error) {
            console.error("Failed to toggle follow", error);
            // Revert state if the database fails
            setIsFollowing(wasFollowing);
            setFollowersCount((prev) => wasFollowing ? prev + 1 : prev - 1);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
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

                    {/* Hides the follow button if it is the user's own profile */}
                    {!isOwnProfile ? (
                        <button 
                            onClick={handleFollowToggle}
                            disabled={isProcessing || !currentUserId}
                            className={`outline-none flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                                isFollowing 
                                ? "bg-dark-clr border border-main-border text-foreground hover:bg-light-clr" 
                                : "btn-gradient text-white"
                            }`}
                        >
                            {!isFollowing && <GoPlus className="text-xl relative -left-0.5" />}
                            <span className="font-medium">{isFollowing ? "Following" : "Follow"}</span>
                        </button>
                    ) : (
                        <button className="bg-dark-clr border border-main-border text-foreground hover:bg-light-clr outline-none flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all">
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="text-foreground">
                <p className="sm:w-[60%] w-full my-5">
                    Software Developer at Echo Up. Share your world and connect with others.
                </p>
                <div className="sm:text-[17px] text-[15px] flex gap-7">
                    <div className="text-center"><span className="font-medium text-white">{postCount}</span> Posts</div>
                    <div className="text-center"><span className="font-medium text-white">{followersCount}</span> Followers</div>
                    <div className="text-center"><span className="font-medium text-white">{initialFollowingCount}</span> Following</div>
                </div>
            </div>
        </div>
    );
}