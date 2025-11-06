"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useSessionContext } from "@/components/providers/SessionProvider";

const secondaryLinks = [
  { label: "Prompts", href: "/prompts" },
  { label: "Files", href: "/files" },
  { label: "Settings", href: "/settings" }
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase, profile, chatSessions, replaceChatSessions } = useSessionContext();
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const activeChatParam = searchParams?.get("chat");

  const activeSessionId = useMemo(() => {
    if (activeChatParam) {
      return activeChatParam;
    }
    return chatSessions[0]?.id ?? null;
  }, [activeChatParam, chatSessions]);

  const handleCreateSession = useCallback(async () => {
    if (!profile || isCreating) {
      return;
    }

    setCreationError(null);
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: profile.id,
          title: "New conversation",
          last_message_preview: "Start by asking about the markets you follow most.",
        })
        .select("id, title, last_message_preview, last_message_at, updated_at, created_at")
        .single();

      if (error || !data) {
        throw error ?? new Error("Unable to create chat session");
      }

      replaceChatSessions([data, ...chatSessions.filter((session) => session.id !== data.id)]);
      router.push(`/dashboard?chat=${data.id}`);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to create chat session", error);
      }
      setCreationError("We couldn't create a new chat session. Try again in a moment.");
    } finally {
      setIsCreating(false);
    }
  }, [chatSessions, isCreating, profile, replaceChatSessions, router, supabase]);

  return (
    <aside className="hidden w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/30 lg:flex">
      <div className="flex flex-col gap-6 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Sessions</p>
          <h2 className="text-lg font-semibold text-white">Workspace</h2>
        </div>
        <button
          type="button"
          onClick={handleCreateSession}
          disabled={!profile || isCreating}
          className="flex items-center justify-center rounded-xl border border-brand-accent/40 bg-brand-accent/20 px-4 py-2 text-sm font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating…" : "+ New chat"}
        </button>
        {creationError ? (
          <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">{creationError}</p>
        ) : null}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Recent conversations</p>
          <ul className="space-y-2">
            {chatSessions.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-300">
                No saved sessions yet. Start a conversation to see it here.
              </li>
            ) : (
              chatSessions.map((chat) => {
                const isDashboardRoute = pathname === "/dashboard";
                const isActive = isDashboardRoute && chat.id === activeSessionId;

                return (
                  <li key={chat.id}>
                    <Link
                      href={`/dashboard?chat=${chat.id}`}
                      className={`block rounded-xl border px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "border-brand-accent/60 bg-brand-accent/10 text-white"
                          : "border-transparent bg-white/5 text-slate-200 hover:border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <p className="font-medium">{chat.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {chat.last_message_preview ?? "Awaiting the assistant's first insight."}
                      </p>
                    </Link>
                  </li>
                );
              })
            )}
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
