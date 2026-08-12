"use client"
import React from 'react'
import { usePathname } from 'next/navigation';

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isReelsPage = pathname.startsWith('/reels');

    return (
        <div
            className={`bg-light-clr w-full h-full ${!isReelsPage ? "pt-28 pb-10" : "pt-20 pb-2.5 min-h-screen"} sm:px-5 px-3 justify-items-center`}
        >
            {children}
        </div>
    );
}