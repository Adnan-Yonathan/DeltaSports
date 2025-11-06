"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AssistantMessage,
  AssistantSection,
  ConversationMessage,
  UserMessage,
} from "@/components/chat/types";
import { useSessionContext } from "@/components/providers/SessionProvider";
import type { ChatMessageRow } from "@/types/chat";
import type { TablesInsert } from "@/types/supabase";

import { simulateAssistantStream } from "./mockStream";
import type { AssistantStreamPatch } from "./patch";
import { persistStoredSession, readStoredSession } from "./storage";

const chatMode = process.env.NEXT_PUBLIC_CHAT_MODE ?? "api";

const FALLBACK_TIMEZONE = "America/New_York";

type ChatSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
};

type SendPromptArgs = {
  prompt: string;
  quickPromptId?: string;
  sportKey?: string;
  marketKey?: string;
};

type UseChatSessionOptions = {
  sessionId?: string | null;
};

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createInitialSession = (formatTimestamp: (date: Date) => string): ChatSession => {
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    id: `session-${createId()}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [
      {
        id: "user-seed",
        role: "user",
        content: "What are tonight's Knicks moneyline odds and any injury news I should know?",
        createdAt: formatTimestamp(now),
      },
      {
        id: "assistant-seed",
        role: "assistant",
        headline: "Short answer",
        summary:
          "Knicks sit at -134 (1.75 decimal / 3/4 fractional). Brunson probable, Randle ruled out, Celtics report no new limitations.",
        createdAt: formatTimestamp(now),
        odds: {
          american: "-134",
          decimal: "1.75",
          fractional: "3/4",
          impliedProbability: "57.3%",
        },
        sections: [
          {
            id: "key-stats",
            title: "Key stats",
            items: [
              "NYK 7-3 in last 10 · Opp PPG allowed: 109.8",
              "Celtics offense 118.5 rating over same stretch",
            ],
          },
          {
            id: "assumptions",
            title: "Assumptions",
            items: [
              "Line captured at 5:45 PM ET from primary odds feed",
              "Injury report refreshed 5:30 PM ET with league data",
            ],
          },
          {
            id: "timestamps",
            title: "Timestamps",
            items: [
              "Odds API sync 2 minutes ago",
              "Backup provider verified 90 seconds ago",
            ],
          },
        ],
        sources: [
          { id: "odds-api", label: "Odds API" },
          { id: "nba-injuries", label: "NBA.com injuries" },
        ],
        warnings: [],
        status: "complete",
      },
    ],
  };
};

const normalizeStoredMessages = (messages: readonly ConversationMessage[]): ConversationMessage[] =>
  messages.map((message) => {
    if (message.role === "assistant") {
      return {
        ...message,
        status: message.status ?? "complete",
        warnings: message.warnings ?? [],
        sections: message.sections ?? [],
        sources: message.sources ?? [],
        odds: message.odds ?? {},
      } satisfies AssistantMessage;
    }

    return message;
  });

const mergeSections = (
  existing: readonly AssistantSection[] | undefined,
  incoming: readonly AssistantSection[] | undefined,
  single?: AssistantSection
): readonly AssistantSection[] | undefined => {
  if (incoming) {
    return [...incoming];
  }

  if (!single) {
    return existing;
  }

  const current = existing ? [...existing] : [];
  const index = current.findIndex((section) => section.id === single.id);
  if (index >= 0) {
    current[index] = single;
    return current;
  }

  current.push(single);
  return current;
};

const applyPatchToAssistant = (
  message: AssistantMessage,
  patch: AssistantStreamPatch
): AssistantMessage => {
  const summary =
    patch.summary !== undefined
      ? patch.summary
      : patch.summaryDelta
        ? `${message.summary ?? ""}${patch.summaryDelta}`
        : message.summary;

  const nextError =
    patch.status === "error"
      ? patch.error ?? message.error ?? "Assistant response unavailable."
      : patch.error ?? message.error;

  return {
    ...message,
    headline: patch.headline ?? message.headline,
    summary,
    odds: patch.odds ? { ...(message.odds ?? {}), ...patch.odds } : message.odds,
    sections: mergeSections(message.sections, patch.sections, patch.section),
    sources: patch.sources ?? message.sources,
    warnings: patch.warnings ? [...patch.warnings] : message.warnings,
    status: patch.status ?? message.status ?? "draft",
    error: nextError ?? undefined,
  };
};

const parseStreamPayload = (line: string): AssistantStreamPatch | null => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const sanitized = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
  if (!sanitized) {
    return null;
  }

  if (sanitized === "[DONE]") {
    return { status: "complete" };
  }

  try {
    const payload = JSON.parse(sanitized) as Record<string, unknown> & {
      type?: string;
    };

    if (payload.type === "done") {
      return { status: "complete" };
    }

    if (payload.type === "error") {
      return {
        status: "error",
        error: typeof payload.message === "string" ? payload.message : undefined,
      };
    }

    const patch: AssistantStreamPatch = {};

    if (typeof payload.headline === "string") {
      patch.headline = payload.headline;
    }

    if (typeof payload.summary === "string") {
      patch.summary = payload.summary;
    }

    if (typeof payload.summaryDelta === "string") {
      patch.summaryDelta = payload.summaryDelta;
    }

    if (payload.odds && typeof payload.odds === "object") {
      patch.odds = payload.odds as AssistantMessage["odds"];
    }

    if (Array.isArray(payload.sections)) {
      patch.sections = payload.sections as AssistantSection[];
    }

    if (payload.section && typeof payload.section === "object") {
      patch.section = payload.section as AssistantSection;
    }

    if (Array.isArray(payload.sources)) {
      patch.sources = payload.sources as AssistantMessage["sources"];
    }

    if (Array.isArray(payload.warnings)) {
      const warnings = payload.warnings.filter((item): item is string => typeof item === "string");
      patch.warnings = warnings;
    }

    if (typeof payload.status === "string") {
      patch.status = payload.status as AssistantMessage["status"];
    }

    if (typeof payload.error === "string") {
      patch.error = payload.error;
    }

    return Object.keys(patch).length > 0 ? patch : null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to parse chat stream payload", error, line);
    }
    return null;
  }
};

const readStream = async (
  stream: ReadableStream<Uint8Array>,
  onPatch: (patch: AssistantStreamPatch) => void,
  signal: AbortSignal
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      const patch = parseStreamPayload(line);
      if (patch) {
        onPatch(patch);
      }
      newlineIndex = buffer.indexOf("\n");
    }
  }

  if (buffer.trim()) {
    const patch = parseStreamPayload(buffer);
    if (patch) {
      onPatch(patch);
    }
  }
};

const toApiMessages = (messages: readonly ConversationMessage[]) =>
  messages.map((message) => {
    if (message.role === "assistant") {
      return {
        role: message.role,
        headline: message.headline,
        summary: message.summary,
        odds: message.odds,
        sections: message.sections,
        sources: message.sources,
        warnings: message.warnings,
        status: message.status,
      };
    }

    return {
      role: message.role,
      content: message.content,
    };
  });

const mapRowToMessage = (
  row: ChatMessageRow,
  formatTimestamp: (date: Date) => string
): ConversationMessage | null => {
  const createdAt = formatTimestamp(new Date(row.created_at));

  if (row.role === "assistant") {
    const payload = row.content ?? {};
    const headline = typeof payload.headline === "string" ? payload.headline : "Short answer";
    const summary = typeof payload.summary === "string" ? payload.summary : "";
    const odds =
      payload.odds && typeof payload.odds === "object"
        ? (payload.odds as AssistantMessage["odds"])
        : undefined;
    const sections = Array.isArray(payload.sections)
      ? (payload.sections as AssistantMessage["sections"])
      : undefined;
    const sources = Array.isArray(payload.sources)
      ? (payload.sources as AssistantMessage["sources"])
      : undefined;
    const warnings = Array.isArray(payload.warnings)
      ? (payload.warnings as AssistantMessage["warnings"])
      : [];
    const error = typeof payload.error === "string" ? payload.error : undefined;

    return {
      id: row.id,
      role: "assistant",
      createdAt,
      headline,
      summary,
      odds,
      sections,
      sources,
      warnings,
      status: (row.status as AssistantMessage["status"]) ?? "draft",
      error,
    } satisfies AssistantMessage;
  }

  if (row.role === "user") {
    const payload = row.content ?? {};
    const content = typeof payload.content === "string" ? payload.content : "";

    return {
      id: row.id,
      role: "user",
      content,
      createdAt,
    } satisfies UserMessage;
  }

  return null;
};

const buildAssistantPayload = (message: AssistantMessage) => ({
  headline: message.headline,
  summary: message.summary,
  odds: message.odds,
  sections: message.sections,
  sources: message.sources,
  warnings: message.warnings,
  error: message.error,
});

export const useChatSession = ({ sessionId }: UseChatSessionOptions = {}) => {
  const {
    supabase,
    profile,
    chatSessions,
    updateChatSessionMetadata,
  } = useSessionContext();
  const timezone = profile?.preferred_timezone ?? FALLBACK_TIMEZONE;

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }),
    [timezone]
  );

  const formatTimestamp = useCallback(
    (date: Date) => `${timestampFormatter.format(date)} ${timezone}`,
    [timestampFormatter, timezone]
  );

  const managedSessionIds = useMemo(
    () => new Set(chatSessions.map((session) => session.id)),
    [chatSessions]
  );

  const defaultSessionId = chatSessions[0]?.id ?? null;
  const resolvedSessionId = sessionId ?? defaultSessionId ?? null;
  const isManagedSession = resolvedSessionId ? managedSessionIds.has(resolvedSessionId) : false;

  const [session, setSession] = useState<ChatSession>(() => {
    const stored = readStoredSession<ConversationMessage>();
    if (stored) {
      return {
        id: stored.id,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
        messages: normalizeStoredMessages(stored.messages),
      };
    }

    return createInitialSession(formatTimestamp);
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(session);
  const streamingRef = useRef(isStreaming);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    streamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    persistStoredSession(session);
  }, [session]);

  useEffect(() => {
    abortRef.current?.abort();
  }, [resolvedSessionId]);

  useEffect(() => {
    if (!profile || !resolvedSessionId || !isManagedSession) {
      return;
    }

    let isMounted = true;

    const loadRemoteSession = async () => {
      try {
        const { data: sessionRow, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("id, created_at, updated_at")
          .eq("id", resolvedSessionId)
          .eq("user_id", profile.id)
          .maybeSingle();

        if (sessionError || !sessionRow) {
          if (process.env.NODE_ENV === "development") {
            console.warn("No chat session found in Supabase", sessionError);
          }
          return;
        }

        const { data: messageRows, error: messagesError } = await supabase
          .from("chat_messages")
          .select("id, session_id, role, content, status, created_at, updated_at")
          .eq("session_id", resolvedSessionId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Failed to load chat messages", messagesError);
          }
          return;
        }

        const messages = (messageRows ?? [])
          .map((row) => mapRowToMessage(row, formatTimestamp))
          .filter((message): message is ConversationMessage => message !== null);

        if (!isMounted) {
          return;
        }

        const remoteSession: ChatSession = {
          id: sessionRow.id,
          createdAt: sessionRow.created_at ?? sessionRow.updated_at ?? new Date().toISOString(),
          updatedAt: sessionRow.updated_at ?? sessionRow.created_at ?? new Date().toISOString(),
          messages,
        };

        sessionRef.current = remoteSession;
        setSession(remoteSession);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to load chat session from Supabase", error);
        }
      }
    };

    void loadRemoteSession();

    return () => {
      isMounted = false;
    };
  }, [formatTimestamp, isManagedSession, profile, resolvedSessionId, supabase]);

  const persistAssistantState = useCallback(
    async (sessionIdValue: string, message: AssistantMessage, patch: AssistantStreamPatch) => {
      if (!profile || !managedSessionIds.has(sessionIdValue)) {
        return;
      }

      try {
        await supabase
          .from("chat_messages")
          .update({
            content: buildAssistantPayload(message),
            status: message.status,
          })
          .eq("id", message.id);

        if (patch.status === "complete" || patch.status === "error") {
          const nowIso = new Date().toISOString();
          const preview = message.summary?.trim().length
            ? message.summary
            : message.headline?.trim().length
              ? message.headline
              : "Assistant response ready.";

          await supabase
            .from("chat_sessions")
            .update({
              last_message_preview: preview,
              last_message_at: nowIso,
            })
            .eq("id", sessionIdValue);

          updateChatSessionMetadata(sessionIdValue, {
            last_message_preview: preview ?? null,
            last_message_at: nowIso,
            updated_at: nowIso,
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to persist assistant message", error);
        }
      }
    },
    [managedSessionIds, profile, supabase, updateChatSessionMetadata]
  );

  const applyPatch = useCallback(
    (sessionIdValue: string, assistantId: string, patch: AssistantStreamPatch) => {
      setSession((prev) => {
        const nextMessages = prev.messages.map((message) => {
          if (message.id !== assistantId || message.role !== "assistant") {
            return message;
          }

          return applyPatchToAssistant(message, patch);
        });

        const next: ChatSession = {
          ...prev,
          updatedAt: new Date().toISOString(),
          messages: nextMessages,
        };

        const assistant = nextMessages.find(
          (message): message is AssistantMessage => message.id === assistantId && message.role === "assistant"
        );

        if (assistant) {
          void persistAssistantState(sessionIdValue, assistant, patch);
        }

        sessionRef.current = next;
        return next;
      });
    },
    [persistAssistantState]
  );

  const finishStreaming = useCallback(() => {
    setIsStreaming(false);
    abortRef.current = null;
  }, []);

  const sendPrompt = useCallback(
    ({ prompt, quickPromptId, sportKey, marketKey }: SendPromptArgs) => {
      const trimmed = prompt.trim();
      if (!trimmed || streamingRef.current) {
        return;
      }

      const normalizedSportKey =
        typeof sportKey === "string" && sportKey.trim().length > 0 ? sportKey.trim() : undefined;
      const normalizedMarketKey =
        typeof marketKey === "string" && marketKey.trim().length > 0 ? marketKey.trim() : undefined;

      const now = new Date();
      const nowIso = now.toISOString();
      const sessionIdValue = resolvedSessionId ?? sessionRef.current.id;
      const isSessionPersisted = managedSessionIds.has(sessionIdValue);

      const userMessage: UserMessage = {
        id: `user-${createId()}`,
        role: "user",
        content: trimmed,
        createdAt: formatTimestamp(now),
      };

      const assistantMessage: AssistantMessage = {
        id: `assistant-${createId()}`,
        role: "assistant",
        createdAt: formatTimestamp(now),
        headline: "Short answer",
        summary: "",
        odds: {},
        sections: [],
        sources: [],
        warnings: [],
        status: "draft",
      };

      const nextSession: ChatSession = {
        ...sessionRef.current,
        id: sessionIdValue,
        updatedAt: nowIso,
        messages: [...sessionRef.current.messages, userMessage, assistantMessage],
      };

      const conversationPayload = toApiMessages([
        ...sessionRef.current.messages,
        userMessage,
      ]);

      sessionRef.current = nextSession;
      setSession(nextSession);

      setIsStreaming(true);
      setLastError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      if (profile && isSessionPersisted) {
        const messageInserts: TablesInsert<"chat_messages">[] = [
          {
            id: userMessage.id,
            session_id: sessionIdValue,
            role: "user",
            content: { content: trimmed },
            status: "complete",
            created_at: nowIso,
          },
          {
            id: assistantMessage.id,
            session_id: sessionIdValue,
            role: "assistant",
            content: buildAssistantPayload(assistantMessage),
            status: assistantMessage.status,
            created_at: nowIso,
          },
        ];

        void supabase
          .from("chat_messages")
          .insert<TablesInsert<"chat_messages">>(messageInserts)
          .select();

        void supabase
          .from("chat_sessions")
          .update({
            last_message_preview: trimmed,
            last_message_at: nowIso,
          })
          .eq("id", sessionIdValue);

        updateChatSessionMetadata(sessionIdValue, {
          last_message_preview: trimmed,
          last_message_at: nowIso,
          updated_at: nowIso,
        });
      }

      const runSimulator = async () => {
        try {
          await simulateAssistantStream({
            prompt: trimmed,
            signal: controller.signal,
            onPatch: (patch) => applyPatch(sessionIdValue, assistantMessage.id, patch),
          });
          return true;
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException && fallbackError.name === "AbortError") {
            return true;
          }

          applyPatch(sessionIdValue, assistantMessage.id, {
            status: "error",
            error: "We couldn't complete that request. Try again shortly.",
          });

          setLastError("We hit a snag while generating that response. Please try again.");
          return false;
        }
      };

      const execute = async () => {
        try {
          if (chatMode === "api") {
            try {
              const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  prompt: trimmed,
                  conversation: conversationPayload,
                  sessionId: sessionIdValue,
                  sportKey: normalizedSportKey,
                  marketKey: normalizedMarketKey,
                  quickPromptId,
                  userProfileId: profile?.id,
                }),
                signal: controller.signal,
              });

              if (response.ok && response.body) {
                await readStream(
                  response.body,
                  (patch) => applyPatch(sessionIdValue, assistantMessage.id, patch),
                  controller.signal
                );
                applyPatch(sessionIdValue, assistantMessage.id, { status: "complete" });
                return;
              }

              const handled = await runSimulator();
              if (handled) {
                return;
              }

              let errorMessage = "We couldn't complete that request. Try again shortly.";

              try {
                const data = await response.json();
                if (typeof data.error === "string" && data.error.trim().length > 0) {
                  errorMessage = data.error.trim();
                }
              } catch (parseError) {
                try {
                  const text = await response.text();
                  if (text.trim().length > 0) {
                    errorMessage = text.trim();
                  }
                } catch {
                  // ignore secondary parsing errors
                }
              }

              setLastError(errorMessage);
              return;
            } catch (error) {
              if (error instanceof DOMException && error.name === "AbortError") {
                return;
              }

              if (process.env.NODE_ENV === "development") {
                console.warn("Falling back to simulated assistant stream", error);
              }

              const handled = await runSimulator();
              if (handled) {
                return;
              }
            }
          } else {
            await runSimulator();
          }
        } finally {
          finishStreaming();
        }
      };

      void execute();
    },
    [
      applyPatch,
      finishStreaming,
      formatTimestamp,
      managedSessionIds,
      profile,
      resolvedSessionId,
      supabase,
      updateChatSessionMetadata,
    ]
  );

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  const hasAssistantResponse = useMemo(
    () => session.messages.some((message) => message.role === "assistant"),
    [session.messages]
  );

  const clearError = useCallback(() => setLastError(null), []);

  return {
    messages: session.messages,
    isStreaming,
    sendPrompt,
    sessionId: session.id,
    hasAssistantResponse,
    lastError,
    clearError,
  } as const;
};

export type UseChatSessionReturn = ReturnType<typeof useChatSession>;
