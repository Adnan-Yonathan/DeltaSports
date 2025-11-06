import type { TablesRow } from "./supabase";

export type SidebarChatSession = Pick<
  TablesRow<"chat_sessions">,
  "id" | "title" | "last_message_preview" | "updated_at" | "last_message_at" | "created_at"
>;

export type ChatMessageRow = TablesRow<"chat_messages">;
