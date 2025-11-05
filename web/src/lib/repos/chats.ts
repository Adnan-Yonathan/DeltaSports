import { prisma } from "../db";

export async function listChats() {
  return prisma.conversation.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getChat(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
  });
}

export async function createChat({
  title,
  model,
}: {
  title: string;
  model: string;
}) {
  return prisma.conversation.create({
    data: {
      title,
      model,
    },
  });
}

export async function updateChat(
  id: string,
  data: Partial<{ title: string; pinned: boolean; model: string }>,
) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}

export async function deleteChat(id: string) {
  await prisma.toolCall.deleteMany({ where: { message: { conversationId: id } } });
  await prisma.message.deleteMany({ where: { conversationId: id } });
  return prisma.conversation.delete({ where: { id } });
}
