import { prisma } from "../db";

export async function listChats() {
  return prisma.conversation.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getChat(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function createChat(input: { title: string; model: string }) {
  return prisma.conversation.create({
    data: {
      title: input.title,
      model: input.model,
    },
  });
}

export async function updateChat(
  id: string,
  data: Partial<{ title: string; pinned: boolean; model: string; updatedAt: Date }>,
) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}

export async function deleteChat(id: string) {
  return prisma.conversation.delete({ where: { id } });
}
