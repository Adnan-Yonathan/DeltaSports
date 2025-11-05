import { notFound } from "next/navigation";
import { ChatClient } from "@/components/chat/ChatClient";
import { getChat } from "@/lib/repos/chats";
import { listMessages } from "@/lib/repos/messages";
import type { ChatMessage } from "@/components/chat/MessageBubble";
import type { Message, ToolCall } from "@prisma/client";

interface PageProps {
  params: { id: string };
}

export default async function ChatPage({ params }: PageProps) {
  const chat = await getChat(params.id);
  if (!chat) {
    notFound();
  }
  const messages = await listMessages(chat.id);

  const formatted: ChatMessage[] = messages.map(
    (message: Message & { toolCalls: ToolCall[] }) => ({
      id: message.id,
      role: message.role as ChatMessage["role"],
      content:
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content),
      createdAt: message.createdAt.toISOString(),
      toolCalls: message.toolCalls?.map((tool) => ({
        id: tool.id,
        name: tool.name,
        args: tool.args as Record<string, unknown>,
        result: tool.result as Record<string, unknown>,
      })),
    })
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <ChatClient
        conversationId={chat.id}
        initialMessages={formatted}
        initialModel={chat.model}
      />
    </div>
  );
}
