import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatPageClient } from "@/components/chat/ChatPageClient";
import { listChats, getChat } from "@/lib/repos/chats";
import { listMessages } from "@/lib/repos/messages";

import type { ChatListItem } from "@/components/chat/ChatList";

async function getData(id: string) {
  const [chats, messages, chat] = await Promise.all([
    listChats(),
    listMessages(id),
    getChat(id),
  ]);
  return { chats, messages, chat };
}

type PageProps = {
  params: { id: string };
};

export default async function ChatPage({ params }: PageProps) {
  const { chat, chats, messages } = await getData(params.id);

  if (!chat) {
    notFound();
  }

  const sidebarChats: ChatListItem[] = chats.map((item) => ({
    id: item.id,
    title: item.title,
    pinned: item.pinned,
    updatedAt: item.updatedAt.toISOString(),
  }));

  const initialMessages = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: (message.content as any) ?? {},
  }));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar initialChats={sidebarChats} activeChatId={chat.id} />
      <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading…</div>}>
        <ChatPageClient
          conversationId={chat.id}
          initialMessages={initialMessages}
          initialModel={chat.model}
          chatTitle={chat.title}
        />
      </Suspense>
    </div>
  );
}
