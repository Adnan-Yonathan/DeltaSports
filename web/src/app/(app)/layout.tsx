import { Sidebar } from "@/components/chat/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import {
  createServerSupabaseClient,
  getServerSupabaseSession,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import type { SidebarChatSession } from "@/types/chat";
import type { TablesInsert, TablesRow } from "@/types/supabase";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";

const formatLastSynced = (timestamp: string | null, timezone: string | null) => {
  if (!timestamp) {
    return "No alerts yet";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone ?? "UTC",
    });
    return `${formatter.format(new Date(timestamp))} ${timezone ?? "UTC"}`;
  } catch {
    const fallback = new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${fallback} ${timezone ?? "UTC"}`;
  }
};

const ensureProfile = async (
  supabase: ReturnType<typeof createServerSupabaseClient>,
  authUserId: string
): Promise<TablesRow<"user_profiles"> | null> => {
  const existingProfileResult = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingProfileResult.error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to load user profile", existingProfileResult.error);
    }
    return null;
  }

  if (existingProfileResult.data) {
    return existingProfileResult.data as TablesRow<"user_profiles">;
  }

  const profileInsert: TablesInsert<"user_profiles"> = { auth_user_id: authUserId };

  const createdProfileResult = await supabase
    .from("user_profiles")
    .insert<TablesInsert<"user_profiles">>(profileInsert)
    .select("*")
    .single();

  if (createdProfileResult.error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to seed user profile", createdProfileResult.error);
    }
    return null;
  }

  return createdProfileResult.data as TablesRow<"user_profiles">;
};

const ensureDefaultChatSession = async (
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string
): Promise<SidebarChatSession[]> => {
  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, title, last_message_preview, last_message_at, updated_at, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!error && sessions && sessions.length > 0) {
    return sessions;
  }

  const defaultPreview = "Ask about tonight's odds or injury news to start a session.";
  const sessionInsert: TablesInsert<"chat_sessions"> = {
    user_id: userId,
    title: "New conversation",
    last_message_preview: defaultPreview,
  };

  const { data: newSession, error: insertError } = await supabase
    .from("chat_sessions")
    .insert<TablesInsert<"chat_sessions">>(sessionInsert)
    .select("id, title, last_message_preview, last_message_at, updated_at, created_at")
    .single();

  if (insertError || !newSession) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to seed chat session", insertError);
    }
    return [];
  }

  return [newSession];
};

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const { client: supabase, session } = await getServerSupabaseSession();

  if (!isServerSupabaseConfigured) {
    redirect("/sign-in");
  }

  if (!session) {
    redirect("/sign-in");
  }

  const profile = await ensureProfile(supabase, session.user.id);
  const chatSessions = profile ? await ensureDefaultChatSession(supabase, profile.id) : [];

  const { data: lastAlertEvent } = profile
    ? await supabase
        .from("alert_events")
        .select("created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const lastAlertAt = lastAlertEvent?.created_at ?? null;
  const favoriteSports = profile?.favorite_sports?.filter(Boolean) ?? [];
  const timezoneLabel = profile?.preferred_timezone ?? "UTC";
  const formattedLastSynced = formatLastSynced(lastAlertAt, timezoneLabel);

  return (
    <SessionProvider
      initialSession={session}
      initialProfile={profile}
      initialChatSessions={chatSessions}
      initialLastAlertAt={lastAlertAt}
    >
      <section className="flex h-full w-full gap-6">
        <Suspense
          fallback={
            <aside className="hidden w-full max-w-xs rounded-2xl border border-white/5 bg-black/30 lg:flex" />
          }
        >
          <Sidebar />
        </Suspense>
        <div className="flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/40">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-black/60 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Active session</p>
              <h2 className="text-xl font-semibold text-white">Command Center</h2>
              <p className="text-sm text-slate-300">
                Live bankroll guardrails and odds intelligence streamed in real time.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right text-xs text-slate-300">
              <div className="flex flex-wrap justify-end gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Timezone</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                  {timezoneLabel}
                </span>
              </div>
              {favoriteSports.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                  <span>Focus sports</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                    {favoriteSports.slice(0, 3).join(" · ")}
                  </span>
                </div>
              ) : null}
              <div className="flex flex-col text-right text-xs text-slate-400">
                <span className="uppercase tracking-wide">Last synced</span>
                <span className="text-sm font-medium text-white">{formattedLastSynced}</span>
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </section>
    </SessionProvider>
  );
}
