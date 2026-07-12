"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import ChatBox from "./Chatbox"
import { IoMdClose } from "react-icons/io"
import { RiMessage3Fill } from "react-icons/ri" // Import the Message Icon!

export default function FriendsOnline({ isMobile = false }: { isMobile?: boolean }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    
    // State to toggle the mobile friend drawer
    const [showMobileList, setShowMobileList] = useState(false);
    
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("id, first_name, profile_image")
                .eq("id", user.id)
                .single();
                
            if (profile) setCurrentUser(profile);

            const { data } = await supabase
                .from("follows")
                .select(`
                    following:users!following_id (
                        id, username, first_name, last_name, profile_image
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

    if (isLoading || friends.length === 0) return null; 

    // ==========================================
    // 1. MOBILE RENDER (Floating Button + Drawer)
    // ==========================================
    if (isMobile) {
        return (
            <>
                {/* Floating Messages Button */}
                <button
                    onClick={() => setShowMobileList(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-main-blue text-white rounded-full shadow-2xl flex items-center justify-center text-[28px] z-[90] hover:bg-main-dark-blue transition-transform hover:scale-105"
                >
                    <RiMessage3Fill />
                </button>

                {/* Mobile Slide-Up Drawer */}
                {showMobileList && (
                    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={() => setShowMobileList(false)}>
                        <div className="bg-primary w-full h-[75vh] rounded-t-3xl flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-main-border" onClick={e => e.stopPropagation()}>
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-main-border bg-dark-clr">
                                <h3 className="text-foreground text-[19px] font-bold">Messages</h3>
                                <button onClick={() => setShowMobileList(false)} className="text-gray-400 hover:text-white text-[26px] transition-colors bg-white/5 rounded-full p-1.5">
                                    <IoMdClose />
                                </button>
                            </div>

                            {/* Drawer Friends List */}
                            <div className="flex-1 overflow-y-auto custom-scroll pb-10">
                                {friends.map((item) => {
                                    const fullName = `${item.first_name || "User"} ${item.last_name || ""}`.trim();
                                    return (
                                        <button 
                                            key={`mobile-${item.id}`} 
                                            onClick={() => { setActiveChat(item); setShowMobileList(false); }} 
                                            className="px-6 py-4 w-full flex items-center gap-4 transition-all hover:bg-dark-clr outline-none cursor-pointer border-b border-main-border/30"
                                        >
                                            <div className="min-w-[45px] h-[45px] rounded-full overflow-hidden bg-main-blue flex items-center justify-center text-white font-bold text-lg shrink-0 border border-main-border">
                                                {item.profile_image ? (
                                                    <Image src={item.profile_image} alt={fullName} className="object-cover w-full h-full" width={60} height={60} />
                                                ) : (
                                                    item.first_name?.charAt(0) || "U"
                                                )}
                                            </div>
                                            <span className="text-foreground font-medium text-[16px]">
                                                {fullName}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Render the portaled ChatBox */}
                {activeChat && currentUser && (
                    <ChatBox currentUser={currentUser} friend={activeChat} onClose={() => setActiveChat(null)} />
                )}
            </>
        )
    }

    // ==========================================
    // 2. DESKTOP RENDER (Normal Sidebar View)
    // ==========================================
    return (
        <>
            <div className="bg-primary w-full h-fit rounded-xl grid gap-0 overflow-y-auto max-h-[500px] custom-scroll friends-online">
                <h3 className="text-foreground px-5 py-3 text-[18px]">
                    Following <span className="text-green-600 text-sm relative -top-px ml-1">●</span>
                </h3>
                
                {friends.map((item) => {
                    const fullName = `${item.first_name || "User"} ${item.last_name || ""}`.trim();
                    return (
                        <button 
                            key={`desktop-${item.id}`} 
                            onClick={() => setActiveChat(item)} 
                            className="px-5 py-[10px] w-full flex items-center gap-3 transition-all hover:bg-dark-clr outline-none cursor-pointer"
                        >
                            <div className="min-w-[40px] h-[40px] overflow-hidden rounded-full border border-main-border flex items-center justify-center bg-main-blue text-white font-bold uppercase shrink-0">
                                {item.profile_image ? (
                                    <Image src={item.profile_image} alt={fullName} className="object-cover w-full h-full" width={50} height={50} />
                                ) : (
                                    item.first_name?.charAt(0) || "U"
                                )}
                            </div>
                            <span className="text-foreground font-medium text-[15px] truncate">
                                {fullName}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Render the portaled ChatBox */}
            {activeChat && currentUser && (
                <ChatBox currentUser={currentUser} friend={activeChat} onClose={() => setActiveChat(null)} />
            )}
        </>
    )
}