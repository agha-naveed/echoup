import { AiFillHome } from "react-icons/ai";
import { IoSearchOutline, IoBookmarkOutline } from "react-icons/io5";
import { FaUserFriends } from "react-icons/fa";
import NavItem from "./NavItem";

export default function SideNavbar() {
    return (
      <div className="md:w-18.75 md:min-w-18.75 md:z-0 z-999 md:h-screen w-full md:relative fixed bottom-0">
          <div className="md:w-18.75 md:min-w-18.75 md:h-screen w-full bg-light-clr fixed left-0 md:top-0 bottom-0 z-10 border-r border-r-main-border md:pt-22 pt-2 pb-2 px-2 flex md:flex-col md:items-center md:justify-start justify-center md:shadow-[4px_0_15px_#1112167e] border-t md:gap-0 gap-2">
        <NavItem
          href="/"
          title="Home"
          icon={<AiFillHome className="text-2xl menu-light-shadow" />}
        />

        <NavItem
          href="/search"
          title="Search"
          exact={false}
          icon={<IoSearchOutline className="text-2xl" />}
        />

        <NavItem
          href="/saved"
          title="Saved"
          icon={<IoBookmarkOutline className="text-[22px]" />}
        />

        <NavItem
          href="/friends"
          title="Friends"
          icon={<FaUserFriends className="text-[22px]" />}
        />
        </div>
      </div>
    )
}