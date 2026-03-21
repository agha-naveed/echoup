import React from 'react'
import Navbar from '../Navbar';
import SettingSidebar from '../SettingSidebar';

export default function MainWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      <div>
        <Navbar />
        <div className='flex'>
          <SettingSidebar />
          <div className='bg-light-clr w-full h-full pt-28 md:pl-28 sm:pl-10 pl-6 pr-6 md:pr-0 sm:pr-10 pb-10'>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}