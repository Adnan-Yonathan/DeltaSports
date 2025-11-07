"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const chatHistory = [
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
  { label: "Bankroll", href: "/bankroll" },
  { label: "Prompts", href: "/prompts" },
  { label: "Files", href: "/files" },
  { label: "Settings", href: "/settings" }
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChat = searchParams?.get("chat");

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
