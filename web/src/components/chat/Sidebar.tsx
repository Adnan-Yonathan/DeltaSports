"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/auth/SupabaseAuthProvider";
import { useEffect, useState, useCallback } from "react";
import { loadUserChatSessions } from "@/lib/chat/chatPersistence";
import type { ChatSession } from "@/lib/chat/chatPersistence";

type ChatHistoryItem = {
  id: string;
  title: string;
  preview: string;
  href: string;
};

const defaultChatHistory: readonly ChatHistoryItem[] = [
  {
    id: "latest-knicks",
    title: "Knicks vs. Celtics market check",
    preview: "Moneyline odds, injury outlook, risk notes",
    href: "/dashboard?chat=latest-knicks"
  },
  {
    id: "jokic-prop",
    title: "Jokic 25+ points fair price",
    preview: "Last 10 games, projected lines, implied prob",
    href: "/dashboard?chat=jokic-prop"
  },
  {
    id: "bankroll-health",
    title: "Bankroll health pulse",
    preview: "Streak summary & exposure bands",
    href: "/dashboard?chat=bankroll-health"
  }
] as const;

const secondaryLinks = [
  { label: "Odds Scanner", href: "/odds-scanner" },
  { label: "Bankroll", href: "/bankroll" },
  { label: "Bet History", href: "/bankroll/history" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Prompts", href: "/prompts" },
  { label: "Files", href: "/files" },
  { label: "Settings", href: "/settings" }
] as const;

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChat = searchParams?.get("chat");
  const { userProfile } = useSupabaseAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChatHistory = useCallback(async () => {
    if (!userProfile?.id) {
      setChatHistory([...defaultChatHistory]);
      setLoading(false);
      return;
    }

    try {
      const sessions = await loadUserChatSessions(userProfile.id);
      const historyItems: ChatHistoryItem[] = sessions.slice(0, 5).map((session) => {
        const timeAgo = getTimeAgo(session.last_message_at || session.created_at);
        return {
          id: session.id,
          title: session.title || "Untitled conversation",
          preview: `Last active ${timeAgo}`,
          href: `/dashboard?chat=${session.id}`,
        };
      });

      // If no sessions, show default
      if (historyItems.length === 0) {
        setChatHistory([...defaultChatHistory]);
      } else {
        setChatHistory(historyItems);
      }
    } catch (error) {
      console.error("Failed to load chat history", error);
      setChatHistory([...defaultChatHistory]);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  return (
    <aside className="hidden w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/30 lg:flex">
      <div className="flex flex-col gap-6 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Sessions</p>
          <h2 className="text-lg font-semibold text-white">Workspace</h2>
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-xl border border-brand-accent/40 bg-brand-accent/20 px-4 py-2 text-sm font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30 hover:text-white"
        >
          + New chat
        </button>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Recent conversations</p>
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <p className="text-xs text-slate-400">Loading chat history...</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {chatHistory.map((chat, index) => {
                const isDashboardRoute = pathname === "/dashboard";
                const isMatch = activeChat ? activeChat === chat.id : index === 0;
                const isActive = isDashboardRoute && isMatch;

                return (
                  <li key={chat.id}>
                    <Link
                      href={chat.href}
                      className={`block rounded-xl border px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "border-brand-accent/60 bg-brand-accent/10 text-white"
                          : "border-transparent bg-white/5 text-slate-200 hover:border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <p className="font-medium">{chat.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{chat.preview}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-auto space-y-4 border-t border-white/5 bg-black/40 px-6 py-6 text-xs text-slate-400">
        <div className="space-y-2">
          {secondaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-slate-300 transition hover:text-white"
            >
              <span>{item.label}</span>
              <span aria-hidden className="text-slate-500">→</span>
            </Link>
          ))}
        </div>
        <p>
          Streaming responses include responsible betting guidance and source citations for every recommendation.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
