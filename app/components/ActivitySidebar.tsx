import FriendsOnline from "./FriendsOnline";
import TrendingNow from "./TrendingNow";

function ActivitySidebar() {
    return (
        <div className="min-w-87.5 lg:block hidden h-full relative min-h-screen">
            <div className="lg:flex flex-col hidden gap-6 bg-light-clr w-87.5 border-l border-l-main-border h-full fixed top-0 right-0 pt-25 pb-10 px-5">
                <TrendingNow />
                <FriendsOnline />
            </div>
        </div>
    )
}

export default ActivitySidebar;