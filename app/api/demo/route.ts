import { NextRequest, NextResponse } from "next/server";

export function GET() {
  const posts = [
    {
      id: "1",
      author: {
        firstName: "Ali",
        lastName: "abbas",
        profileImage: "https://ntvb.tmsimg.com/assets/assets/487578_v9_bb.jpg?w=360&h=480"
      },
      // imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmWGvixTDzPc0uGP9YPlW_fvwpJxoKrzI2oA&s",
      content: "Hello",
      createdAt: "8h ago",
      likes: 500,
      comments: 112,
      shares: 2
    },
  ]
  return NextResponse.json(posts)
}