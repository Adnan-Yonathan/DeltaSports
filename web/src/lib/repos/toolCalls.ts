import { prisma } from "../db";

type ToolCallInput = {
  messageId: string;
  name: string;
  args: unknown;
  result?: unknown;
  latencyMs?: number | null;
};

export async function createToolCall(input: ToolCallInput) {
  return prisma.toolCall.create({
    data: {
      messageId: input.messageId,
      name: input.name,
      args: input.args as any,
      result: input.result as any,
      latencyMs: input.latencyMs ?? null,
    },
  });
}
