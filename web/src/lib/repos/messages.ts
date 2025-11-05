import { MessageRole } from "@prisma/client";
import { prisma } from "../db";

type CreateMessageInput = {
  conversationId: string;
  role: MessageRole;
  content: unknown;
  tokens?: number | null;
};

export async function listMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { toolCalls: true },
  });
}

export async function createMessage(input: CreateMessageInput) {
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content as any,
      tokens: input.tokens ?? null,
    },
    include: { toolCalls: true },
  });
}
