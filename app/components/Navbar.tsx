"use client"
import Image from "next/image";
import { IoIosSearch } from "react-icons/io";
import { MdTravelExplore } from "react-icons/md";
import { FaRegBell } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import logo from '@/images/logo.png'
import Link from "next/link";

export default function Navbar() {
    const [toggleSearch, setToggleSearch] = useState(false)
    const searchRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setToggleSearch(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

  return (
    <div className="flex text-foreground fixed top-0 w-full border-b border-b-main-border shadow-[0_10px_15px_#1112167e] z-20">
        <Link href={"/"} className="bg-dark-clr min-w-[75px] grid place-content-center text-3xl border-r border-b border-main-border">
            <Image src={logo} alt="Logo" width={100} height={100} className="w-[38px]" />
        </Link>
        <div className="bg-light-clr w-full py-3 px-5 flex items-center justify-between">
            <>
                <div
                    onClick={() => setToggleSearch(false)}
                    className={`
                    fixed inset-0 bg-black/30 backdrop-blur-[2px]
                    transition-opacity duration-300 ease-out
                    ${
                        toggleSearch
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }
                    `}
                />
                <div className="relative flex items-center md:ml-6" ref={searchRef}>

                    <IoIosSearch className="md:text-[22px] text-[40px] block text-foreground md:absolute md:p-0 p-2 rounded-full md:left-[18px]" onClick={() => setToggleSearch(true)} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-primary md:block hidden outline-none border border-main-border focus:border-main-blue/20 py-2 pr-6 pl-[48px] w-[400px] rounded-full" onClick={() => setToggleSearch(true)}
                    />

                    <div className={`md:hidden flex items-center justify-center fixed left-1/2 translate-x-[-50%] transition-all w-full px-4 bg-dark-clr h-[70px]
                        ${
                            toggleSearch
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-4 pointer-events-none"
                        }
                        `}>
                        <IoIosSearch className="text-[22px] text-foreground absolute left-8" />
                        <input
                            autoFocus={true}
                            type="text"
                            placeholder="Search"
                            className="bg-primary border border-main-border py-2 pr-6 w-full pl-[48px] rounded-full "
                        />
                    </div>
                </div>
            </>
            <div className="flex items-center gap-2">
                <button title="Explore" className="md:flex hidden items-center justify-center gap-[6px] transition-all hover:bg-dark-clr w-[44px] h-[44px] rounded-full cursor-pointer">
                    <MdTravelExplore className="text-[22px]" />
                </button>
                <button title="Notifications" className="flex items-center justify-center gap-[6px] transition-all hover:bg-dark-clr w-[44px] h-[44px] rounded-full cursor-pointer">
                    <FaRegBell className="text-[22px]" />
                </button>
                <div className="h-[44px] border-r mx-1 border-r-main-border"></div>
                <div className="min-w-[45.5px] w-[45.5px] h-[45.5px] max-w-[45.5px] max-h-[45.5px] min-h-[45.5px] rounded-full overflow-hidden">
                    <Image src={"https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"}
                    alt="s" width={200} height={200} className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
    </div>
  )
}