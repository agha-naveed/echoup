"use client"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { RiSendPlaneFill } from "react-icons/ri";
import { format } from "date-fns";

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
    
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const friendFullName = `${friend.first_name} ${friend.last_name || ""}`.trim();

    // ==========================================
    // WEBSOCKET CONNECTION (FastAPI)
    // ==========================================
    useEffect(() => {
        // Replace this URL with your actual FastAPI WebSocket endpoint!
        // Example: ws://localhost:8000/ws/chat/{currentUser.id}/{friend.id}
        const socketUrl = `ws://127.0.0.1:8000/ws/chat/${currentUser.id}/${friend.id}`;
        
        ws.current = new WebSocket(socketUrl);

        ws.current.onopen = () => console.log(`Connected to chat with ${friend.username}`);

        ws.current.onmessage = (event) => {
            const incomingData = JSON.parse(event.data);
            // Assuming FastAPI sends: { id, senderId, text, timestamp }
            setMessages((prev) => [...prev, incomingData]);
        };

        ws.current.onclose = () => console.log("Chat connection closed");

        // Cleanup the socket when the user closes the chat box
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [currentUser.id, friend.id, friend.username]);

    // Auto-scroll to the bottom when a new message arrives
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
            id: `msg-${Date.now()}`, // Temporary ID until backend confirms
            senderId: currentUser.id,
            text: text,
            timestamp: new Date().toISOString()
        };

        // 1. Send to FastAPI Backend
        ws.current.send(JSON.stringify(newMessage));

        // 2. Optimistic UI Update (Show instantly on screen)
        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-0 right-4 sm:right-10 w-[350px] h-[450px] bg-primary border border-main-border rounded-t-xl shadow-2xl flex flex-col z-50 overflow-hidden">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 bg-dark-clr border-b border-main-border shrink-0 cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-main-border shrink-0 bg-main-blue flex items-center justify-center text-white font-bold">
                        {friend.profile_image ? (
                            <Image src={friend.profile_image} alt="DP" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            friend.first_name.charAt(0).toUpperCase()
                        )}
                        {/* Online Status Dot */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-clr rounded-full"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-foreground font-medium text-[15px] leading-tight">{friendFullName}</span>
                        <span className="text-gray-400 text-[12px] leading-tight">Active now</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                    <IoMdClose className="text-xl" />
                </button>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 p-4 overflow-y-auto custom-scroll flex flex-col gap-3 bg-primary/50">
                {messages.length === 0 ? (
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
            <div className="p-3 border-t border-main-border bg-primary shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-dark-clr/50 border border-main-border rounded-full px-3 py-1.5 focus-within:border-main-blue/50 transition-colors">
                    <input
                        type="text"
                        placeholder="Aa"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-foreground text-[14px] placeholder:text-gray-500"
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
        </div>
    );
}