"use client";

import { Children, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

interface SidebarChat {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

interface SidebarProps {
  currentChatId?: string;
  onCreateChat?: () => void;
}

const features = [
  { name: "Prompts", href: "/prompts" },
  { name: "Files", href: "/files" },
  { name: "Settings", href: "/settings" },
];

export function Sidebar({ currentChatId, onCreateChat }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<SidebarChat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/chats");
      const json = await res.json();
      if (!active) return;
      setChats(json.chats ?? []);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(chats, {
      keys: ["title"],
      threshold: 0.4,
    });
  }, [chats]);

  const filteredChats = useMemo(() => {
    if (!search) return chats;
    return fuse.search(search).map((result) => result.item);
  }, [search, chats, fuse]);

  const pinned = filteredChats.filter((chat) => chat.pinned);
  const others = filteredChats.filter((chat) => !chat.pinned);

  const handleCreate = async () => {
    if (onCreateChat) {
      onCreateChat();
      return;
    }
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini" }),
    });
    const json = await res.json();
    window.location.href = `/chat/${json.chat.id}`;
  };

  const togglePin = async (chat: SidebarChat) => {
    await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !chat.pinned }),
    });
    setChats((prev) =>
      prev.map((item) =>
        item.id === chat.id ? { ...item, pinned: !item.pinned } : item,
      ),
    );
  };

  const renameChat = async (chat: SidebarChat, title: string) => {
    await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setChats((prev) =>
      prev.map((item) => (item.id === chat.id ? { ...item, title } : item)),
    );
  };

  const deleteChat = async (chat: SidebarChat) => {
    await fetch(`/api/chats/${chat.id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((item) => item.id !== chat.id));
  };

  return (
    <aside
      className={`flex h-full w-72 flex-col border-r border-slate-800 bg-brand/60 ${collapsed ? "hidden md:flex" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wide"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
        <button
          onClick={handleCreate}
          className="rounded bg-brand-accent px-3 py-1 text-xs font-semibold text-brand"
        >
          New Chat
        </button>
      </div>
      <div className="px-4">
        <label className="sr-only" htmlFor="chat-search">
          Search chats
        </label>
        <input
          id="chat-search"
          type="search"
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <Section
          title="Pinned"
          emptyText={loading ? "Loading..." : "No pinned chats yet"}
        >
          {pinned.map((chat) => (
            <SidebarItem
              key={chat.id}
              chat={chat}
              active={chat.id === currentChatId}
              onPin={() => togglePin(chat)}
              onRename={(title) => renameChat(chat, title)}
              onDelete={() => deleteChat(chat)}
            />
          ))}
        </Section>
        <Section
          title="Chats"
          emptyText={loading ? "Loading..." : "Start a new conversation"}
        >
          {others.map((chat) => (
            <SidebarItem
              key={chat.id}
              chat={chat}
              active={chat.id === currentChatId}
              onPin={() => togglePin(chat)}
              onRename={(title) => renameChat(chat, title)}
              onDelete={() => deleteChat(chat)}
            />
          ))}
        </Section>
        <Section title="Features" emptyText="">
          <ul className="space-y-2 text-sm text-slate-300">
            {features.map((feature) => (
              <li key={feature.name}>
                <Link href={feature.href} className="hover:text-white">
                  {feature.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </nav>
      <div className="px-4 pb-4 text-xs text-slate-400">
        Delta is informational only; not betting advice.
      </div>
    </aside>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  emptyText: string;
}

function Section({ title, children, emptyText }: SectionProps) {
  const hasChildren = Children.count(children) > 0;
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
        <span>{title}</span>
      </div>
      <div className="space-y-2">
        {hasChildren ? children : (
          <p className="text-xs text-slate-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

interface SidebarItemProps {
  chat: SidebarChat;
  active?: boolean;
  onPin: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function SidebarItem({ chat, active, onPin, onRename, onDelete }: SidebarItemProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(chat.title);

  const submitRename = () => {
    onRename(value.trim() ? value : "Untitled");
    setEditing(false);
  };

  return (
    <div
      className={`group rounded border border-transparent px-2 py-2 text-sm ${
        active
          ? "border-brand-accent bg-slate-800 text-white"
          : "hover:border-slate-700 hover:bg-slate-900"
      }`}
    >
      {editing ? (
        <input
          className="w-full rounded bg-slate-900 px-2 py-1 text-sm"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={submitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitRename();
            }
          }}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between">
          <Link href={`/chat/${chat.id}`} className="flex-1 truncate">
            {chat.title || "Untitled"}
          </Link>
          <div className="flex items-center gap-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => setEditing(true)} aria-label="Rename chat">
              ✏️
            </button>
            <button onClick={onPin} aria-label="Toggle pin">
              {chat.pinned ? "📌" : "📍"}
            </button>
            <button onClick={onDelete} aria-label="Delete chat">
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
