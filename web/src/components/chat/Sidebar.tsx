"use client";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { ChatList, type ChatListItem } from "./ChatList";

const features = [
  { label: "Prompts", href: "/docs/prompts" },
  { label: "Files", href: "/dashboard/files" },
  { label: "Settings", href: "/dashboard/settings" },
];

type SidebarProps = {
  initialChats: ChatListItem[];
  activeChatId?: string;
};

export function Sidebar({ initialChats, activeChatId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState(initialChats);

  const fuse = useMemo(
    () =>
      new Fuse(chats, {
        keys: ["title"],
        threshold: 0.4,
      }),
    [chats],
  );

  const filtered = useMemo(() => {
    if (!search) return chats;
    return fuse.search(search).map((item) => item.item);
  }, [chats, fuse, search]);

  const pinned = filtered.filter((chat) => chat.pinned);
  const others = filtered.filter((chat) => !chat.pinned);

  async function togglePin(chat: ChatListItem) {
    const res = await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !chat.pinned }),
    });
    if (res.ok) {
      setChats((current) =>
        current.map((item) => (item.id === chat.id ? { ...item, pinned: !chat.pinned } : item)),
      );
    }
  }

  function renameChat(chat: ChatListItem) {
    const nextTitle = window.prompt("Rename chat", chat.title);
    if (!nextTitle) return;
    fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    }).then(() => {
      setChats((current) =>
        current.map((item) => (item.id === chat.id ? { ...item, title: nextTitle } : item)),
      );
    });
  }

  async function deleteChat(chat: ChatListItem) {
    if (!window.confirm("Delete this chat?")) return;
    const res = await fetch(`/api/chats/${chat.id}`, { method: "DELETE" });
    if (res.ok) {
      setChats((current) => current.filter((item) => item.id !== chat.id));
    }
  }

  return (
    <aside className={`flex h-full flex-col border-r border-slate-800 bg-slate-950 text-white transition-all ${collapsed ? "w-16" : "w-72"}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((state) => !state)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded bg-slate-800 px-2 py-1 text-xs"
        >
          {collapsed ? "▶" : "◀"}
        </button>
        {!collapsed && (
          <input
            aria-label="Search chats"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-40 rounded bg-slate-800 px-2 py-1 text-xs"
          />
        )}
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-4">
            <h2 className="mb-2 text-xs uppercase text-slate-500">Pinned</h2>
            <ChatList chats={pinned} activeChatId={activeChatId} onPin={togglePin} onRename={renameChat} onDelete={deleteChat} />
          </div>
          <div className="mb-4">
            <h2 className="mb-2 text-xs uppercase text-slate-500">Chats</h2>
            <ChatList chats={others} activeChatId={activeChatId} onPin={togglePin} onRename={renameChat} onDelete={deleteChat} />
          </div>
          <div>
            <h2 className="mb-2 text-xs uppercase text-slate-500">Features</h2>
            <ul className="space-y-1 text-sm text-slate-300">
              {features.map((feature) => (
                <li key={feature.href}>
                  <a className="block rounded px-3 py-2 hover:bg-slate-800" href={feature.href}>
                    {feature.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </aside>
  );
}
