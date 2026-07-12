"use client"
import Image from "next/image";
import { IoIosSearch } from "react-icons/io";
import { MdTravelExplore } from "react-icons/md";
import { FaRegBell } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import logo from '@/images/logo.png'
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { toggleFollowState } from "@/actions/follow";

export default function Navbar() {
    const [toggleSearch, setToggleSearch] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    
    // Supabase States
    const [userProfile, setUserProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [limitError, setLimitError] = useState({
        follow: false
    })

    // New state to track who we just followed back in this session
    const [followedBackIds, setFollowedBackIds] = useState<Set<string>>(new Set());

    const handleFollowBack = async (e: React.MouseEvent, senderId: string) => {
        e.preventDefault(); 
        e.stopPropagation();

        if (!userProfile?.id) return;

        // Determine if we are following or unfollowing
        const isCurrentlyFollowing = followedBackIds.has(senderId);
        const action = isCurrentlyFollowing ? "unfollow" : "follow";

        // Optimistic UI update
        setFollowedBackIds(prev => {
            const next = new Set(prev);
            if (action === "follow") {
                next.add(senderId);
            } else {
                next.delete(senderId);
            }
            return next;
        });

        // Call the Redis Rate-Limited Action
        const response = await toggleFollowState(userProfile.id, senderId, action);

        if (!response.success) {
            setLimitError({...limitError, follow: true})
            setTimeout(() => {
                setLimitError({...limitError, follow: false})
            }, 10000)
            // Revert state if rate limited or database fails
            setFollowedBackIds(prev => {
                const next = new Set(prev);
                if (action === "follow") {
                    next.delete(senderId);
                } else {
                    next.add(senderId);
                }
                return next;
            });
        }
    };


    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            
            // Search Supabase for users matching the query
            const { data, error } = await supabase
                .from("users")
                .select("id, username, first_name, last_name, profile_image")
                .or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
                .limit(5); // Show top 5 results

            if (data) {
                setSearchResults(data);
            }
            setIsSearching(false);
        };

        // Wait 500ms after the user stops typing before fetching
        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, supabase]);

    useEffect(() => {
        const fetchUserAndData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // 1. Fetch Profile
                const { data: profile } = await supabase
                    .from("users")
                    .select("id, first_name, username, profile_image")
                    .eq("id", user.id)
                    .single();
                    
                if (profile) {
                    setUserProfile(profile);

                    // =========================================================
                    // NEW: Fetch all the people the current user is ALREADY following
                    // =========================================================
                    const { data: myFollows } = await supabase
                        .from("follows")
                        .select("following_id")
                        .eq("follower_id", profile.id);
                        
                    if (myFollows) {
                        // Pre-fill the state with the IDs of people we already follow
                        const currentlyFollowing = new Set(myFollows.map((f: any) => f.following_id));
                        setFollowedBackIds(currentlyFollowing);
                    }

                    // 2. Fetch Notifications
                    const { data: notifs } = await supabase
                        .from("notifications")
                        .select(`
                            id,
                            type,
                            is_read,
                            created_at,
                            post_id,
                            sender_id,
                            sender:users!sender_id ( username, first_name, last_name, profile_image )
                        `)
                        .eq("recipient_id", profile.id)
                        .order("created_at", { ascending: false })
                        .limit(20);

                    if (notifs) {
                        setNotifications(notifs);
                        setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
                    }
                }
            }
        };

        fetchUserAndData();
    }, [supabase]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setToggleSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/account"); 
        router.refresh(); 
    };

    const markNotificationsAsRead = async () => {
        if (unreadCount === 0 || !userProfile?.id) return;
        
        // Optimistic UI update
        setUnreadCount(0);
        
        // Background DB update
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("recipient_id", userProfile.id)
            .eq("is_read", false);
    };

    return (
        <div className="flex text-foreground fixed top-0 w-full border-b border-b-main-border shadow-[0_10px_15px_#1112167e] z-20">
            <Link href={"/"} className="bg-dark-clr min-w-[75px] grid place-content-center text-3xl border-r border-b border-main-border">
                <Image src={logo} alt="Logo" width={50} height={50} className="w-[38px]" />
            </Link>
            <div className="bg-light-clr w-full py-3 px-5 flex items-center justify-between">
                <>
                    <div onClick={() => setToggleSearch(false)} className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${toggleSearch ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
                    
                    <div className="relative flex items-center md:ml-6" ref={searchRef}>
                        {/* Desktop Icon */}
                        <IoIosSearch className="md:text-[22px] text-[40px] block text-foreground md:absolute md:p-0 p-2 rounded-full md:left-[18px]" onClick={() => setToggleSearch(true)} />
                        
                        {/* Desktop Input */}
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchQuery || ""}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-primary md:block hidden outline-none border border-main-border focus:border-main-blue/20 py-2 pr-6 pl-[48px] w-[400px] rounded-full" 
                            onClick={() => setToggleSearch(true)} 
                        />
                        
                        {/* Mobile Search Bar overlay */}
                        <div className={`md:hidden flex items-center justify-center fixed left-1/2 translate-x-[-50%] transition-all w-full px-4 bg-dark-clr h-[70px] z-50 ${toggleSearch ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
                            <IoIosSearch className="text-[22px] text-foreground absolute left-8" />
                            <input 
                                autoFocus={toggleSearch} 
                                type="text" 
                                placeholder="Search" 
                                value={searchQuery || ""}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-primary border border-main-border py-2 pr-6 w-full pl-[48px] rounded-full outline-none focus:border-main-blue/50" 
                            />
                        </div>

                        {/* SEARCH RESULTS DROPDOWN */}
                        {toggleSearch && searchQuery.trim().length > 0 && (
                            <div className="absolute top-full md:mt-1 left-0 md:w-full w-[400px] md:left-auto  md:translate-x-0 -translate-x-1/2 bg-dark-clr border border-main-border rounded-xl shadow-2xl overflow-hidden z-[60]">
                                {isSearching ? (
                                    <div className="px-4 py-4 text-center text-sm text-gray-500 animate-pulse">
                                        Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="px-4 py-4 text-center text-sm text-gray-500">
                                        No users found.
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {searchResults.map((user: any) => (
                                            <Link 
                                                key={user.id} 
                                                href={`/@${user.username}`} 
                                                onClick={() => {
                                                    setToggleSearch(false);
                                                    setSearchQuery(""); // Clear search on click
                                                }}
                                                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 border-b border-main-border last:border-0"
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-main-blue flex items-center justify-center shrink-0">
                                                    {user.profile_image ? (
                                                        <Image src={user.profile_image} alt={user.username} width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-bold uppercase">{user.first_name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-medium text-foreground leading-tight">
                                                        {user.first_name} {user.last_name || ""}
                                                    </span>
                                                    <span className="text-[13px] text-gray-500 leading-tight">
                                                        @{user.username}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
                <div className="flex items-center gap-2">
                    <button title="Explore" className="md:flex hidden items-center justify-center gap-[6px] transition-all hover:bg-dark-clr w-[44px] h-[44px] rounded-full cursor-pointer">
                        <MdTravelExplore className="text-[22px]" />
                    </button>
                    
                    {/* NOTIFICATIONS DROPDOWN CONTAINER */}
                    <div className="relative group" onMouseEnter={markNotificationsAsRead}>
                        <button title="Notifications" className="flex relative items-center justify-center gap-[6px] transition-all hover:bg-dark-clr w-[44px] h-[44px] rounded-full cursor-pointer">
                            <FaRegBell className="text-[22px]" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-dark-clr"></span>
                            )}
                        </button>

                        <div className="absolute right-[-60px] md:right-0 top-full pt-3 w-[320px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="bg-dark-clr border border-main-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-[15px] max-h-[400px] overflow-y-auto custom-scroll">
                                <div className="px-4 py-3 font-bold text-foreground border-b border-main-border sticky top-0 bg-dark-clr z-10">
                                    Notifications
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    notifications.map((notif: any) => {
                                    const sFName = notif.sender?.first_name || "User";
                                    const sDP = notif.sender?.profile_image;
                                    const senderId = notif.sender_id; // Added to get the sender's ID
                                    
                                    // Determine text and link based on notification type
                                    let text = "";
                                    let linkHref = `/@${notif.sender?.username}`; 
                                    if (notif.type === "like") { text = "liked your post."; linkHref = `/post/${notif.post_id}`; }
                                    if (notif.type === "comment") { text = "commented on your post."; linkHref = `/post/${notif.post_id}`; }
                                    if (notif.type === "follow") { text = "started following you."; }

                                    const hasFollowedBack = followedBackIds.has(senderId);

                                    return (
                                        <div key={notif.id} onClick={() => router.push(linkHref)} className={`flex items-start gap-3 px-4 py-3 border-b border-main-border transition-colors cursor-pointer hover:bg-white/5 ${!notif.is_read ? 'bg-main-blue/10' : ''}`}>
                                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-main-blue flex items-center justify-center text-white font-bold">
                                                {sDP ? <Image src={sDP} alt="DP" width={40} height={40} className="w-full h-full object-cover" /> : sFName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-foreground/90 leading-tight">
                                                    <Link 
                                                        href={`/@${notif.sender?.username}`} 
                                                        className="font-bold hover:underline cursor-pointer"
                                                        title={notif?.sender?.first_name + " " + notif?.sender?.last_name}
                                                    >
                                                        {sFName}
                                                    </Link> {text}
                                                    
                                                    {notif.type === "follow" && (
                                                        <button 
                                                            disabled={limitError.follow}
                                                            onClick={(e) => handleFollowBack(e, senderId)}
                                                            className={`block mt-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${limitError.follow && "bg-zinc-700 hover:bg-zinc-700 cursor-not-allowed"} ${
                                                                hasFollowedBack 
                                                                ? "bg-dark-clr border border-main-border text-foreground cursor-pointer hover:bg-dark-clr/60" 
                                                                : "bg-main-blue hover:bg-main-dark-blue text-white cursor-pointer"
                                                            }`}
                                                        >
                                                            {
                                                                limitError.follow ? "Try Again Later" :
                                                                hasFollowedBack ? "Following" : "Follow Back"
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                                <span suppressHydrationWarning className="text-[11px] text-gray-500 mt-1 block">
                                                    {formatDistanceToNowStrict(new Date(notif.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-[44px] border-r mx-1 border-r-main-border"></div>

                    {/* PROFILE DROPDOWN CONTAINER */}
                    <div className="relative group">
                        <Link href={userProfile?.username ? `/@${userProfile.username}` : "#"} className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden cursor-pointer border border-main-border transition-all hover:border-main-blue flex">
                            {userProfile?.profile_image ? (
                                <Image src={userProfile.profile_image} alt="Profile" width={200} height={200} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-main-blue text-white flex items-center justify-center font-bold text-lg uppercase">
                                    {userProfile?.first_name?.charAt(0) || "U"}
                                </div>
                            )}
                        </Link>

                        <div className="absolute right-0 top-full pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="bg-dark-clr border border-main-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-[15px]">
                                <Link href={userProfile?.username ? `/@${userProfile.username}` : "#"} className="px-4 py-3 text-foreground hover:bg-white/10 transition-colors border-b border-main-border">Profile</Link>
                                <Link href="/settings" className="px-4 py-3 text-foreground hover:bg-white/10 transition-colors border-b border-main-border">Settings</Link>
                                <button onClick={handleLogout} className="px-4 py-3 text-left font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer">Log out</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}