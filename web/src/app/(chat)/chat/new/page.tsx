import { redirect } from "next/navigation";
import { createChat } from "@/lib/repos/chats";

export default async function NewChatPage() {
  const chat = await createChat({ title: "New conversation", model: "gpt-4o-mini" });
  redirect(`/chat/${chat.id}`);
}
