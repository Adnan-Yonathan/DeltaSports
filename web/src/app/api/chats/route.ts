import { NextRequest } from "next/server";
import { createChat, listChats } from "@/lib/repos/chats";

export async function GET() {
  const chats = await listChats();
  return Response.json({ chats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = body.title ?? "New conversation";
  const model = body.model ?? "gpt-4o-mini";
  const chat = await createChat({ title, model });
  return Response.json({ chat });
}
