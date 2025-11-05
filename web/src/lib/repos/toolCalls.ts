import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export async function createToolCall(
  data: Prisma.ToolCallCreateInput,
) {
  return prisma.toolCall.create({ data });
}

export async function createManyToolCalls(
  data: Prisma.ToolCallCreateManyInput[],
) {
  if (!data.length) return [];
  await prisma.toolCall.createMany({ data });
  return prisma.toolCall.findMany({
    where: { messageId: { in: data.map((d) => d.messageId) } },
  });
}
