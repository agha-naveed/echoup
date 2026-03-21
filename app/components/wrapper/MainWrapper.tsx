import React from 'react'
import Navbar from '../Navbar';
import SideNavbar from '../SideNavbar';
import ActivitySidebar from "../ActivitySidebar";


export default function MainWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    return (
        <>
        <div>
          <Navbar />
          <div className='flex justify-between'>
            <SideNavbar />
            <div
              className='bg-light-clr w-full h-full pt-28 pb-10 sm:px-5 px-3 justify-items-center'
            >
              {children}
            </div>
            <ActivitySidebar />
          </div>
        </div>
      </>
    )
}