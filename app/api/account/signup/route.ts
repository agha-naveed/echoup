import { isReserved } from "@/lib/username";

export async function POST(req: Request) {
  const body = await req.json();
  const username = body.username.toLowerCase();

    if (isReserved(username)) {
        return Response.json(
            { error: "Username not allowed" },
            { status: 400 }
        );
    }

}