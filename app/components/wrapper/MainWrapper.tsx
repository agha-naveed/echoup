"use client"
import React from 'react'
import Navbar from '../Navbar';
import SideNavbar from '../SideNavbar';
import ActivitySidebar from "../ActivitySidebar";
import { usePathname } from 'next/navigation';

export default function MainWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isReelsPage = pathname === '/reels';
  return (
    <>
      <div>
        <Navbar />
        <div className='flex justify-between'>
          <SideNavbar />
          <div
            className={`bg-light-clr w-full h-full ${!isReelsPage ? "pt-28 pb-10" : "pt-20 pb-2.5 min-h-screen"} sm:px-5 px-3 justify-items-center`}
          >
            {children}
          </div>
          <ActivitySidebar />
        </div>
      </div>
    </>
  )
}