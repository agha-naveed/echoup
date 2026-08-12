"use client"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import ChatBox from "./Chatbox"
import { IoMdClose } from "react-icons/io"
import { RiMessage3Fill } from "react-icons/ri"
import { useUser } from "../context/UserContext"

export default function FriendsOnline({ isMobile = false }: { isMobile?: boolean }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [showMobileList, setShowMobileList] = useState(false);
    
    // NEW: Ref to track activeChat inside the Realtime listener without re-triggering it
    const activeChatRef = useRef(activeChat);
    
    const supabase = createClient();

    // Keep the ref updated with the latest state
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const { user } = useUser();


    useEffect(() => {
        const fetchData = async () => {
            // const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            // const { data: profile } = await supabase
            //     .from("users")
            //     .select("id, first_name, profile_image")
            //     .eq("id", user.id)
            //     .single();
                
            if (user) setCurrentUser(user);

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

    // ==========================================
    // NEW: BACKGROUND NOTIFICATION LISTENER
    // ==========================================
    useEffect(() => {
        if (!currentUser) return;

        // Ask the user for permission to show browser pop-ups
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Subscribe to Supabase Realtime for new messages sent to ME
        // Subscribe to Supabase Realtime for new messages sent to ME
        const messageSubscription = supabase
            .channel(`chat-notifications-${currentUser.id}-${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`
                },
                async (payload) => {
                    const newMsg = payload.new;

                    // 1. Check if the chatbox for this sender is currently open
                    const isChatOpen = activeChatRef.current?.id === newMsg.sender_id;
                    
                    // 2. Check if the user is on another tab or minimized the browser
                    const isPageHidden = document.hidden;

                    // THE LOGIC: Notify if the chat is closed OR if the tab is hidden
                    if (!isChatOpen || isPageHidden) {
                        
                        // Play the Beep Sound 
                        const audio = new Audio('/sounds/beep.mp3');
                        audio.play().catch((err) => console.log("Audio play blocked by browser:", err));

                        // Fetch the sender's name
                        const { data: sender } = await supabase
                            .from('users')
                            .select('first_name, last_name')
                            .eq('id', newMsg.sender_id)
                            .single();

                        const senderName = sender ? `${sender.first_name} ${sender.last_name || ''}`.trim() : "Someone";

                        // Show standard Browser Notification
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification(`New message from ${senderName}`, {
                                body: newMsg.text,
                            });
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup listener when component unmounts
        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [currentUser, supabase]);


    if (isLoading || friends.length === 0) return null; 

    // ==========================================
    // 1. MOBILE RENDER (Floating Button + Drawer)
    // ==========================================
    if (isMobile) {
        return (
            <>
                <button
                    onClick={() => setShowMobileList(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-main-blue text-white rounded-full shadow-2xl flex items-center justify-center text-[28px] z-[90] hover:bg-main-dark-blue transition-transform hover:scale-105"
                >
                    <RiMessage3Fill />
                </button>

                {showMobileList && (
                    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={() => setShowMobileList(false)}>
                        <div className="bg-primary w-full h-[75vh] rounded-t-3xl flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-main-border" onClick={e => e.stopPropagation()}>
                            
                            <div className="flex items-center justify-between px-6 py-4 border-b border-main-border bg-dark-clr">
                                <h3 className="text-foreground text-[19px] font-bold">Messages</h3>
                                <button onClick={() => setShowMobileList(false)} className="text-gray-400 hover:text-white text-[26px] transition-colors bg-white/5 rounded-full p-1.5">
                                    <IoMdClose />
                                </button>
                            </div>

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

            {activeChat && currentUser && (
                <ChatBox currentUser={currentUser} friend={activeChat} onClose={() => setActiveChat(null)} />
            )}
        </>
    )
}