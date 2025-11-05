import { NextRequest } from "next/server";
import { deleteChat, getChat, updateChat } from "@/lib/repos/chats";

interface Params {
  params: { id: string };
}

export async function GET(_: NextRequest, { params }: Params) {
  const chat = await getChat(params.id);
  if (!chat) {
    return new Response("Not found", { status: 404 });
  }
  return Response.json({ chat });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const data = await req.json();
  const chat = await updateChat(params.id, data);
  return Response.json({ chat });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await deleteChat(params.id);
  return new Response(null, { status: 204 });
}
