import { NextRequest } from "next/server";
import { createChat, listChats } from "@/lib/repos/chats";

export async function GET() {
  const chats = await listChats();
  return Response.json({ data: chats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, model } = body ?? {};
  const chat = await createChat({
    title: title ?? "Untitled chat",
    model: model ?? "gpt-4o",
  });
  return Response.json({ data: chat });
}
