"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import ChatBox from "./Chatbox"

export default function FriendsOnline() {
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW: States to handle the chat and current user
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setIsLoading(false);
                return;
            }

            // 1. Fetch the CURRENT USER's profile (needed for the ChatBox)
            const { data: profile } = await supabase
                .from("users")
                .select("id, first_name, profile_image")
                .eq("id", user.id)
                .single();
                
            if (profile) setCurrentUser(profile);

            // 2. Fetch the Friends List
            const { data } = await supabase
                .from("follows")
                .select(`
                    following:users!following_id (
                        id,
                        username,
                        first_name,
                        last_name,
                        profile_image
                    )
                `)
                .eq("follower_id", user.id)
                .limit(15);

            if (data) {
                const formattedFriends = data.map((f: any) => f.following).filter(Boolean);
                setFriends(formattedFriends);
            }
            
            setIsLoading(false);
        };

        fetchData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="bg-primary w-full h-fit rounded-xl p-5 text-gray-500 text-sm animate-pulse">
                Loading friends...
            </div>
        );
    }

    if (friends.length === 0) return null; 

    return (
        <>
            <div className="bg-primary w-full h-fit rounded-xl grid gap-0 overflow-y-auto max-h-[500px] custom-scroll friends-online">
                <h3 className="text-foreground px-5 py-3 text-[18px]">
                    Following <span className="text-green-600 text-sm relative -top-px ml-1">●</span>
                </h3>
                
                {friends.map((item) => {
                    const fName = item.first_name || "User";
                    const lName = item.last_name || "";
                    const fullName = `${fName} ${lName}`.trim();
                    const dp = item.profile_image;

                    return (
                        // Changed from <Link> to <button> so it opens the chat on click!
                        <button 
                            key={`friends-online-${item.id}`} 
                            onClick={() => setActiveChat(item)} 
                            className="px-5 py-[10px] w-full flex items-center gap-3 transition-all hover:bg-dark-clr outline-none cursor-pointer"
                        >
                            <div className="min-w-[40px] h-[40px] overflow-hidden rounded-full border border-main-border flex items-center justify-center bg-main-blue text-white font-bold uppercase shrink-0">
                                {dp ? (
                                    <Image src={dp} alt={fullName} className="object-cover w-full h-full" width={50} height={50} />
                                ) : (
                                    fName.charAt(0)
                                )}
                            </div>
                            <span className="text-foreground font-medium text-[15px] truncate">
                                {fullName}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Render the floating ChatBox ONLY if a friend is clicked and the currentUser is loaded */}
            {activeChat && currentUser && (
                <ChatBox 
                    currentUser={currentUser} 
                    friend={activeChat} 
                    onClose={() => setActiveChat(null)} 
                />
            )}
        </>
    )
}