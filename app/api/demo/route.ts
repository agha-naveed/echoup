import { NextRequest, NextResponse } from "next/server";

export function GET() {
    const posts = [
      {
        id: "1",
        author: {
          name: "Ali",
          avatar: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"
        },
        content: {
          image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmWGvixTDzPc0uGP9YPlW_fvwpJxoKrzI2oA&s"
        },
        createdAt: "8h ago",
        likes: 500,
        comments: 112,
        shares: 2
      },
      {
        id: "2",
        author: {
          name: "Ali",
          avatar: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"
        },
        content: {
          text: "Scenary",
          image: "https://t4.ftcdn.net/jpg/02/79/67/37/360_F_279673798_itmQUSrwFy7mldM3eqyZ5McwhHaNSds0.jpg"
        },
        createdAt: "8h ago",
        likes: 500,
        comments: 112,
        shares: 2
      },
      {
        id: "3",
        author: {
          name: "Ali",
          avatar: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"
        },
        content: {
          text: "Bismillah. Allah Muhammad saww Ali Fatima Hasan Hussain Abbas"
        },
        createdAt: "8h ago",
        likes: 500,
        comments: 112,
        shares: 2 
    }]
    return NextResponse.json(posts)
}