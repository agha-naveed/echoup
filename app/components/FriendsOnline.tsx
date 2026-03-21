"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function FriendsOnline() {
    const [friends, setFriends] = useState([
        {
            name: "brock lesnar",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Cristiano",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Mr. Bean",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "brock lesnar",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Cristiano",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Mr. Bean",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "brock lesnar",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Cristiano",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        },
        {
            name: "Mr. Bean",
            image: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480",
            profile: ""
        }
    ])    
    return (
        <div className="bg-primary w-full h-fit rounded-xl grid gap-0 overflow-y-auto friends-online">
            <h3 className="text-foreground px-5 py-3 text-[18px]">Friends Online <span className="text-green-600">●</span></h3>
            {
                friends.map((item, idx) => (
                    <Link key={`friends-online-${idx}`} href={item.profile} className="px-5 py-[10px] flex items-center gap-2 transition-all hover:bg-dark-clr outline-none">
                        <div className="w-[40px] h-[40px] overflow-hidden rounded-full">
                            <Image src={item.image} alt={`${item.name}`} className="object-cover" width={50} height={50} />
                        </div>
                        <span className="text-foreground">{item.name}</span>
                    </Link>
                ))
            }
        </div>
    )
}