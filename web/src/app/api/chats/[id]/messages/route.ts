import { MessageRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { createMessage, listMessages } from "@/lib/repos/messages";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const messages = await listMessages(params.id);
  return Response.json({ data: messages });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const message = await createMessage({
    conversationId: params.id,
    role: body.role ?? MessageRole.user,
    content: body.content ?? {},
    tokens: body.tokens ?? null,
  });
  return Response.json({ data: message });
}
