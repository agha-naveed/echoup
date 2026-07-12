"use client"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDown, IoMdClose } from "react-icons/io";
import { RiSendPlaneFill } from "react-icons/ri";
import { format } from "date-fns";
import { createPortal } from "react-dom"; // <-- Import createPortal
import { createClient } from "@/utils/supabase/client";

type Message = {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
};

type ChatBoxProps = {
    currentUser: { id: string; first_name: string; profile_image: string };
    friend: { id: string; username: string; first_name: string; last_name: string; profile_image: string };
    onClose: () => void;
};

export default function ChatBox({ currentUser, friend, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [minimized, setMinimized] = useState(false);

    const supabase = createClient();
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    
    // State to ensure we only use Portals on the client side
    const [mounted, setMounted] = useState(false);
    
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const friendFullName = `${friend.first_name} ${friend.last_name || ""}`.trim();

    // Mark as mounted on client to prevent SSR errors
    useEffect(() => {
        setMounted(true);
    }, []);

    // ==========================================
    // WEBSOCKET CONNECTION
    // ==========================================
    useEffect(() => {
        const socketUrl = `ws://127.0.0.1:8000/ws/chat/${currentUser.id}/${friend.id}`;
        ws.current = new WebSocket(socketUrl);

        ws.current.onopen = () => console.log(`Connected to chat with ${friend.username}`);

        ws.current.onmessage = (event) => {
            const incomingData = JSON.parse(event.data);
            setMessages((prev) => [...prev, incomingData]);
        };

        ws.current.onclose = () => console.log("Chat connection closed");

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [currentUser.id, friend.id, friend.username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ==========================================
    // SEND MESSAGE LOGIC
    // ==========================================
    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const text = inputValue.trim();
        if (!text || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const newMessage = {
            id: `msg-${Date.now()}`, 
            senderId: currentUser.id,
            text: text,
            timestamp: new Date().toISOString()
        };

        ws.current.send(JSON.stringify(newMessage));
        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");
    };


    // ==========================================
    // FETCH CHAT HISTORY (Supabase)
    // ==========================================
    useEffect(() => {
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                // Trick: Get messages where (sender is ME or receiver is ME) AND (sender is FRIEND or receiver is FRIEND)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .or(`sender_id.eq.${friend.id},receiver_id.eq.${friend.id}`)
                .order("created_at", { ascending: true }); // Ascending so the oldest is at the top!

            if (data) {
                // Map the database columns to match your Message type
                const formattedMessages = data.map((msg: any) => ({
                    id: msg.id,
                    senderId: msg.sender_id,
                    text: msg.text,
                    timestamp: msg.created_at
                }));
                
                // If you already have some live messages, we merge them (history first, live messages second)
                setMessages((prev) => {
                    // Prevent duplicates if WebSocket pushed a message while history was loading
                    const existingIds = new Set(prev.map(p => p.id));
                    const newHistory = formattedMessages.filter((m:any) => !existingIds.has(m.id));
                    return [...newHistory, ...prev];
                });
            }
            setIsLoadingHistory(false);
        };

        fetchHistory();
    }, [currentUser.id, friend.id, supabase]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Prevent rendering until the client has loaded (required for createPortal)
    if (!mounted) return null;

    // THE FIX: Wrap the entire return inside createPortal()
    return createPortal(
        // Responsive Layout: Full width on mobile, 350px on desktop. Fixed positioning!
        <div className={`fixed bottom-0 right-0 sm:right-4 lg:right-[370px] w-full sm:w-[350px] ${minimized ? "h-fit" : "h-[65vh] sm:h-[450px]"} bg-primary border-t sm:border border-main-border sm:rounded-t-xl rounded-t-xl shadow-2xl flex flex-col z-[100] overflow-hidden transition-all duration-300`}>
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 bg-dark-clr border-b border-main-border shrink-0 cursor-pointer" onClick={() => setMinimized(!minimized)}>
                <div className="flex relative items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-main-border shrink-0 bg-main-blue flex items-center justify-center text-white font-bold">
                        {friend.profile_image ? (
                            <Image src={friend.profile_image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            friend.first_name.charAt(0).toUpperCase()
                        )}
                    </div>
                    {/* Online Status Dot */}
                    <div className="absolute bottom-0 left-6 w-3 h-3 bg-green-500 border-2 border-dark-clr rounded-full"></div>
                    <div className="flex flex-col">
                        <span className="text-foreground font-medium text-[15px] leading-tight">{friendFullName}</span>
                        <span className="text-gray-400 text-[12px] leading-tight">Active now</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className={`${minimized ? "rotate-180" : "rotate-0"} text-gray-400 text-[18px] cursor-pointer hover:text-white transition-all p-1 rounded-full hover:bg-white/10`}>
                        <IoIosArrowDown />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-400 cursor-pointer hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <IoMdClose className="text-xl" />
                    </button>
                </div>
            </div>

            {/* MESSAGES AREA */}
            <div className={`${minimized ? "hidden" : "flex"} flex-1 p-4 overflow-y-auto custom-scroll flex-col gap-3 bg-primary/50`}>
                {isLoadingHistory ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm animate-pulse">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                        Say hi to {friend.first_name}!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-full`}>
                                <div 
                                    className={`px-4 py-2 text-[14px] rounded-[18px] max-w-[85%] break-words ${
                                        isMe 
                                        ? "bg-main-blue text-white rounded-br-sm" 
                                        : "bg-dark-clr text-foreground border border-main-border rounded-bl-sm"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 px-1">
                                    {format(new Date(msg.timestamp), "h:mm a")}
                                </span>
                            </div>
                        );
                    })
                )}
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className={`${minimized ? "hidden" : "flex"} p-3 border-t border-main-border bg-primary shrink-0`}>
                <form onSubmit={handleSendMessage} className={`flex w-full items-center gap-2 bg-dark-clr/50 border border-main-border rounded-full px-3 py-1.5 focus-within:border-main-blue/50 transition-colors`}>
                    <input
                        type="text"
                        placeholder="Aa"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-foreground text-[14px] placeholder:text-gray-500 px-2"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={!inputValue.trim()}
                        className={`p-1.5 rounded-full transition-colors ${
                            inputValue.trim() ? "text-main-blue hover:bg-main-blue/10 cursor-pointer" : "text-gray-600 cursor-default"
                        }`}
                    >
                        <RiSendPlaneFill className="text-[20px]" />
                    </button>
                </form>
            </div>
        </div>,
        document.body // Teleports the component directly into the body tag!
    );
}