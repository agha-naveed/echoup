"use client";

import { createContext, useContext, useState } from "react";

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
  // User comes from the Redis-backed session on the server (see getCurrentUser).
  const [user] = useState(initialUser);
  const [isLoading] = useState(false);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);