import Link from "next/link"

const TrendingNow = () => {
    return (
        <div className="bg-primary w-full h-fit rounded-xl px-4 py-5">
            <h4 className="text-foreground text-[20px] font-medium">Trending Now</h4>
            <div className="grid gap-[2px] text-foreground/90 text-[18px] mt-2 pl-[6px]">
                <Link href={""} className="hover:text-white w-fit">#AIArt</Link>
                <Link href={""} className="hover:text-white w-fit">#FutureCities</Link>
                <Link href={""} className="hover:text-white w-fit">#creativeCoding</Link>
            </div>
        </div>
    )
}

export default TrendingNow