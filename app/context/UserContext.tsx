"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const UserContext = createContext<{ user: any; isLoading: boolean }>({
    user: null,
    isLoading: true 
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        // Helper function to fetch the profile once we know who the user is
        const fetchProfile = async (sessionUser: any) => {
            if (!sessionUser) {
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("id, username, first_name, last_name, profile_image")
                .eq("id", sessionUser.id)
                .single();
            
            if (isMounted) {
                setUser(profile);
                setIsLoading(false);
            }
        };

        // 1. Check the session immediately on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchProfile(session?.user);
        });

        // 2. LISTEN for changes (This is the magic fix!)
        // If the session takes a second to load from cookies, this listener catches it
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // We only need to fetch again if the user actually changed (e.g. they just logged in)
            fetchProfile(session?.user);
        });

        // Cleanup listener when component unmounts
        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);