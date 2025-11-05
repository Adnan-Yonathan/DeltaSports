"use client";

import Link from "next/link";
import { useTransition } from "react";

export type ChatListItem = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
};

type ChatListProps = {
  chats: ChatListItem[];
  activeChatId?: string;
  onPin?: (chat: ChatListItem) => void;
  onRename?: (chat: ChatListItem) => void;
  onDelete?: (chat: ChatListItem) => void;
};

export function ChatList({ chats, activeChatId, onPin, onRename, onDelete }: ChatListProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul role="listbox" aria-label="Chat history" className="space-y-1">
      {chats.map((chat) => {
        const isActive = chat.id === activeChatId;
        return (
          <li key={chat.id}>
            <Link
              href={`/chat/${chat.id}`}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition hover:bg-slate-800 ${isActive ? "bg-slate-800 text-white" : "text-slate-300"}`}
            >
              <span className="truncate" aria-current={isActive ? "true" : undefined}>
                {chat.title}
              </span>
              <span className="ml-2 flex gap-1 text-xs text-slate-400">
                <button
                  type="button"
                  aria-label={chat.pinned ? "Unpin chat" : "Pin chat"}
                  onClick={(event) => {
                    event.preventDefault();
                    if (onPin) startTransition(() => onPin(chat));
                  }}
                  className="rounded px-1 hover:bg-slate-700"
                >
                  {chat.pinned ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  aria-label="Rename chat"
                  onClick={(event) => {
                    event.preventDefault();
                    if (onRename) onRename(chat);
                  }}
                  className="rounded px-1 hover:bg-slate-700"
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label="Delete chat"
                  onClick={(event) => {
                    event.preventDefault();
                    if (onDelete) startTransition(() => onDelete(chat));
                  }}
                  className="rounded px-1 hover:bg-slate-700"
                >
                  ⌫
                </button>
              </span>
            </Link>
          </li>
        );
      })}
      {chats.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No chats yet.</li>}
      {isPending && <li className="px-3 py-2 text-xs text-slate-500">Updating…</li>}
    </ul>
  );
}
