import { IoSearchOutline, IoBookmarkOutline } from "react-icons/io5";
import { FaUserFriends } from "react-icons/fa";
import NavItem from "./NavItem";
import { IoMdPerson } from "react-icons/io";

export default function SettingSidebar() {
    return (
        <div className="md:w-[75px] md:h-screen w-full bg-light-clr fixed left-0 md:top-0 bottom-0 z-10 border-r border-r-main-border md:pt-22 pt-2 pb-2 px-2 flex md:flex-col md:items-center md:justify-start justify-center md:shadow-[4px_0_15px_#1112167e] border-t md:gap-0 gap-2">
            <NavItem
        href="/setting"
        title="Personal Details"
        icon={<IoMdPerson className="text-2xl menu-light-shadow" />}
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
    )
}