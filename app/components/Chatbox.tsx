"use client"
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowDown, IoMdClose } from "react-icons/io";
import { RiSendPlaneFill } from "react-icons/ri";
import { format } from "date-fns";
import { createPortal } from "react-dom";
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

const PAGE_SIZE = 10;
// Trigger loading older messages once the user scrolls within this many
// px of the top of the list.
const NEAR_TOP_THRESHOLD = 60;

export default function ChatBox({ currentUser, friend, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [minimized, setMinimized] = useState(false);

    // Memoized so it's created ONCE per mount, not on every render.
    const supabase = useMemo(() => createClient(), []);

    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [mounted, setMounted] = useState(false);

    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Tracks the id of the last message so we only auto-scroll to bottom
    // when something is appended at the END (new send/receive) — not when
    // older messages are prepended at the start (load-more).
    const lastMessageIdRef = useRef<string | null>(null);
    const hasMoreRef = useRef(hasMore);
    const isLoadingMoreRef = useRef(isLoadingMore);

    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);

    const friendFullName = `${friend.first_name} ${friend.last_name || ""}`.trim();

    const conversationFilter = useMemo(
        () =>
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUser.id})`,
        [currentUser.id, friend.id]
    );

    const formatRow = (msg: any): Message => ({
        id: msg.id,
        senderId: msg.sender_id,
        text: msg.text,
        timestamp: msg.created_at
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // ==========================================
    // WEBSOCKET CONNECTION (FastAPI backend)
    // ==========================================
    useEffect(() => {
        let isMounted = true;

        const timeoutId = setTimeout(() => {
            if (!isMounted) return;

            const socketUrl = `ws://127.0.0.1:8000/ws/chat/${currentUser.id}/${friend.id}`;
            ws.current = new WebSocket(socketUrl);

            ws.current.onopen = () => console.log(`Connected to chat with ${friend.username}`);

            ws.current.onmessage = (event) => {
                const incomingData = JSON.parse(event.data);
                setMessages((prev) => {
                    if (prev.some((m) => m.id === incomingData.id)) return prev;
                    return [...prev, incomingData];
                });
            };

            ws.current.onclose = () => console.log("Chat connection closed");
        }, 50);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [currentUser.id, friend.id, friend.username]);

    // ==========================================
    // SEND MESSAGE LOGIC
    // FIX: no more optimistic local add here. The FastAPI backend saves
    // the message to Supabase and bounces the confirmed row back to the
    // SENDER over the same WebSocket (see main.py). Previously this
    // function also added a local copy with a temp id, so when that
    // server-confirmed copy arrived it didn't match the temp id and got
    // added as a second bubble. Now the WS `onmessage` handler above is
    // the single place messages get added, for both sender and receiver.
    // ==========================================
    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();

        const text = inputValue.trim();
        if (!text || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const outgoing = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: text,
            timestamp: new Date().toISOString()
        };

        ws.current.send(JSON.stringify(outgoing));
        setInputValue("");
    };

    // ==========================================
    // FETCH INITIAL CHAT HISTORY — last PAGE_SIZE messages
    // ==========================================
    useEffect(() => {
        let isMounted = true;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            setHasMore(true);

            try {
                const queryPromise = supabase
                    .from("messages")
                    .select("*")
                    .or(conversationFilter)
                    .order("created_at", { ascending: false })
                    .limit(PAGE_SIZE);

                // Safety net so a hung request can't leave the spinner
                // stuck forever.
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Supabase history fetch timed out after 8s")), 8000)
                );

                const { data, error }: any = await Promise.race([queryPromise, timeoutPromise]);

                if (error) throw error;

                if (isMounted && data) {
                    // Rows come back newest-first; reverse to oldest-first for display.
                    const formatted = data.map(formatRow).reverse();

                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const merged = formatted.filter((m: Message) => !existingIds.has(m.id));
                        return [...merged, ...prev];
                    });

                    setHasMore(data.length === PAGE_SIZE);
                }
            } catch (err: any) {
                console.error("Failed to load history:", err);
            } finally {
                if (isMounted) {
                    setIsLoadingHistory(false);
                }
            }
        };

        if (currentUser?.id && friend?.id) {
            fetchHistory();
        } else {
            setIsLoadingHistory(false);
        }

        return () => {
            isMounted = false;
        };
    }, [currentUser.id, friend.id, supabase, conversationFilter]);

    // ==========================================
    // LOAD MORE (older) MESSAGES — triggered on scroll-to-top
    // Fetches the next PAGE_SIZE messages older than the oldest one
    // currently loaded, prepends them, and preserves scroll position
    // so the view doesn't jump.
    // ==========================================
    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMoreRef.current || !hasMoreRef.current || messages.length === 0) return;

        const oldest = messages[0];
        const container = messagesContainerRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;
        const prevScrollTop = container?.scrollTop ?? 0;

        setIsLoadingMore(true);

        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(conversationFilter)
                .lt("created_at", oldest.timestamp)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE);

            if (error) throw error;

            if (data && data.length > 0) {
                const formatted = data.map(formatRow).reverse();

                setMessages((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const merged = formatted.filter((m: Message) => !existingIds.has(m.id));
                    return [...merged, ...prev];
                });

                // Restore scroll position after the DOM grows upward, so
                // the messages the user was looking at stay in place
                // instead of the view jumping to the top.
                requestAnimationFrame(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
                    }
                });
            }

            setHasMore(data ? data.length === PAGE_SIZE : false);
        } catch (err: any) {
            console.error("Failed to load more messages:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [messages, supabase, conversationFilter]);

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (container.scrollTop <= NEAR_TOP_THRESHOLD) {
            loadMoreMessages();
        }
    };

    // ==========================================
    // AUTO-SCROLL TO BOTTOM
    // Only fires when a message is appended at the END (initial load,
    // sent message, or a live incoming message) — never when older
    // messages are prepended at the start via loadMoreMessages.
    // ==========================================
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if (lastMsg.id !== lastMessageIdRef.current) {
            lastMessageIdRef.current = lastMsg.id;
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!mounted) return null;

    return createPortal(
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
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className={`${minimized ? "hidden" : "flex"} flex-1 p-4 overflow-y-auto custom-scroll flex-col gap-3 bg-primary/50`}
            >
                {isLoadingHistory ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm animate-pulse">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                        Say hi to {friend.first_name}!
                    </div>
                ) : (
                    <>
                        {isLoadingMore && (
                            <div className="flex items-center justify-center text-gray-500 text-xs py-1 animate-pulse shrink-0">
                                Loading older messages...
                            </div>
                        )}
                        {!hasMore && (
                            <div className="flex items-center justify-center text-gray-600 text-[11px] py-1 shrink-0">
                                Start of conversation
                            </div>
                        )}
                        {messages.map((msg) => {
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
                        })}
                    </>
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
        document.body
    );
}