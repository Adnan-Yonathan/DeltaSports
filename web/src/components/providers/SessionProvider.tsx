"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Session } from "@supabase/supabase-js";
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

import {
  getBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
  type BrowserSupabaseClient,
} from "@/lib/supabase/browser";
import type { SidebarChatSession } from "@/types/chat";
import type { TablesRow } from "@/types/supabase";

type SessionContextValue = {
  supabase: BrowserSupabaseClient;
  session: Session | null;
  profile: TablesRow<"user_profiles"> | null;
  chatSessions: SidebarChatSession[];
  lastAlertAt: string | null;
  refreshProfile: () => Promise<void>;
  refreshChatSessions: () => Promise<void>;
  setLastAlertAt: (value: string | null) => void;
  updateChatSessionMetadata: (sessionId: string, updates: Partial<SidebarChatSession>) => void;
  replaceChatSessions: (sessions: SidebarChatSession[]) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const sortSessions = (sessions: SidebarChatSession[]) =>
  [...sessions].sort((a, b) => {
    const left = new Date(a.updated_at ?? a.last_message_at ?? a.created_at ?? 0).getTime();
    const right = new Date(b.updated_at ?? b.last_message_at ?? b.created_at ?? 0).getTime();
    return right - left;
  });

type SessionProviderProps = {
  initialSession: Session | null;
  initialProfile: TablesRow<"user_profiles"> | null;
  initialChatSessions: SidebarChatSession[];
  initialLastAlertAt: string | null;
  children: ReactNode;
};

export function SessionProvider({
  initialSession,
  initialProfile,
  initialChatSessions,
  initialLastAlertAt,
  children,
}: SessionProviderProps) {
  const [supabase] = useState(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(initialSession);
  const [profile, setProfile] = useState<TablesRow<"user_profiles"> | null>(initialProfile);
  const [chatSessions, setChatSessions] = useState<SidebarChatSession[]>(() => sortSessions(initialChatSessions));
  const [lastAlertAt, setLastAlertAt] = useState<string | null>(initialLastAlertAt ?? null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setChatSessions([]);
        setLastAlertAt(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const channel = supabase
      .channel(`chat_sessions:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresInsertPayload<SidebarChatSession>) => {
          setChatSessions((current) => {
            const existing = current.find((session) => session.id === payload.new.id);
            if (existing) {
              return sortSessions(
                current.map((session) => (session.id === payload.new.id ? { ...session, ...payload.new } : session))
              );
            }

            return sortSessions([payload.new, ...current]);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresUpdatePayload<SidebarChatSession>) => {
          setChatSessions((current) =>
            sortSessions(current.map((session) => (session.id === payload.new.id ? { ...session, ...payload.new } : session)))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresDeletePayload<SidebarChatSession>) => {
          setChatSessions((current) => current.filter((session) => session.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile, supabase]);

  const refreshProfile = useCallback(async () => {
    if (!session || !isBrowserSupabaseConfigured) {
      return;
    }

    const response = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (!response.error) {
      const nextProfile = (response.data as TablesRow<"user_profiles"> | null) ?? null;
      setProfile(nextProfile);
    }
  }, [session, supabase]);

  const refreshChatSessions = useCallback(async () => {
    if (!profile || !isBrowserSupabaseConfigured) {
      return;
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, last_message_preview, last_message_at, updated_at, created_at")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChatSessions(sortSessions(data as SidebarChatSession[]));
    }
  }, [profile, supabase]);

  const updateChatSessionMetadata = useCallback((sessionId: string, updates: Partial<SidebarChatSession>) => {
    setChatSessions((current) =>
      sortSessions(current.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)))
    );
  }, []);

  const replaceChatSessions = useCallback((sessions: SidebarChatSession[]) => {
    setChatSessions(sortSessions(sessions));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      supabase,
      session,
      profile,
      chatSessions,
      lastAlertAt,
      refreshProfile,
      refreshChatSessions,
      setLastAlertAt,
      updateChatSessionMetadata,
      replaceChatSessions,
    }),
    [
      supabase,
      session,
      profile,
      chatSessions,
      lastAlertAt,
      refreshProfile,
      refreshChatSessions,
      updateChatSessionMetadata,
      replaceChatSessions,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
