"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/utils/supabase/client";

const UserContext = createContext<{
  user: any;
  isLoading: boolean;
}>({
  user: null,
  isLoading: true,
});

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: any;
}) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("users")
          .select(
            "id, username, first_name, last_name, profile_image"
          )
          .eq("id", session.user.id)
          .single();

        setUser(profile);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);