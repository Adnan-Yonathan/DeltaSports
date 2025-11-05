import { NextRequest } from "next/server";
import { deleteChat, getChat, updateChat } from "@/lib/repos/chats";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const chat = await getChat(params.id);
  if (!chat) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return Response.json({ data: chat });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const chat = await updateChat(params.id, body ?? {});
  return Response.json({ data: chat });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await deleteChat(params.id);
  return new Response(null, { status: 204 });
}
