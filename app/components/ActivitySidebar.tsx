import FriendsOnline from "./FriendsOnline";
import TrendingNow from "./TrendingNow";

function ActivitySidebar() {
    return (
        <>
            {/* 1. DESKTOP SIDEBAR (Hidden on mobile) */}
            <div className="min-w-87.5 lg:block hidden h-full relative min-h-screen">
                <div className="flex flex-col gap-6 bg-light-clr w-87.5 border-l border-l-main-border h-full fixed top-0 right-0 pt-25 pb-10 px-5">
                    <TrendingNow />
                    <FriendsOnline isMobile={false} />
                </div>
            </div>

            {/* 2. MOBILE MESSAGES BUTTON (Hidden on Desktop) */}
            <div className="lg:hidden block">
                <FriendsOnline isMobile={true} />
            </div>
        </>
    )
}

export default ActivitySidebar;