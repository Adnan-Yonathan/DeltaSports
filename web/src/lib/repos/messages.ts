import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export type MessageWithToolCalls = Prisma.MessageGetPayload<{
  include: { toolCalls: true };
}>;

export async function listMessages(
  conversationId: string,
): Promise<MessageWithToolCalls[]> {
  return prisma.message.findMany({
    where: { conversationId },
    include: { toolCalls: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createMessage(
  data: Prisma.MessageCreateInput,
) {
  return prisma.message.create({ data });
}

export async function createMessages(
  data: Prisma.MessageCreateManyInput[],
) {
  if (!data.length) return [];
  await prisma.message.createMany({ data });
  return prisma.message.findMany({
    where: { conversationId: data[0].conversationId },
    orderBy: { createdAt: "asc" },
  });
}
