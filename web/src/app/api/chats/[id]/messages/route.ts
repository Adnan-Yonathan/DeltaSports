import { NextRequest } from "next/server";
import { listMessages } from "@/lib/repos/messages";
import { prisma } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function GET(_: NextRequest, { params }: Params) {
  const messages = await listMessages(params.id);
  return Response.json({ messages });
}

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      role: body.role,
      content: body.content,
      tokens: body.tokens ?? 0,
    },
  });
  return Response.json({ message });
}
