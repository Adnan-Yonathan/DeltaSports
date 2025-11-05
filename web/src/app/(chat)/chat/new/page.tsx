import { redirect } from "next/navigation";
import { createChat } from "@/lib/repos/chats";

export default async function NewChatPage() {
  const chat = await createChat({ title: "New chat", model: "gpt-4o" });
  redirect(`/chat/${chat.id}`);
}
