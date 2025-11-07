"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AssistantMessage,
  AssistantSection,
  ConversationMessage,
  UserMessage,
} from "@/components/chat/types";

import { simulateAssistantStream } from "./mockStream";
import type { AssistantStreamPatch } from "./patch";
import { persistStoredSession, readStoredSession } from "./storage";
import { createChatSession, saveChatMessage, updateChatSession, generateSessionTitle, loadChatMessages } from "./chatPersistence";
import { getSupabaseClient } from "@/lib/supabaseClient";

const chatMode = process.env.NEXT_PUBLIC_CHAT_MODE ?? "api";

type ChatSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  dbSessionId?: string; // Supabase database session ID
  userId?: string; // User ID for database persistence
};

type SendPromptArgs = {
  prompt: string;
  quickPromptId?: string;
  sportKey?: string;
  marketKey?: string;
  userProfileId?: string;
  tonePreference?: 'neutral' | 'confident' | 'cautious';
};

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

const formatTimestamp = (date: Date) => `${timestampFormatter.format(date)} ET`;

const seedMessages: ConversationMessage[] = [
  {
    id: "user-seed",
    role: "user",
    content: "What are tonight's Knicks moneyline odds and any injury news I should know?",
    createdAt: "5:29 PM ET",
  },
  {
    id: "assistant-seed",
    role: "assistant",
    headline: "Short answer",
    summary:
      "Knicks sit at -134 (1.75 decimal / 3/4 fractional). Brunson probable, Randle ruled out, Celtics report no new limitations.",
    createdAt: "5:30 PM ET",
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
    status: "complete",
  },
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeStoredMessages = (messages: readonly ConversationMessage[]): ConversationMessage[] =>
  messages.map((message) => {
    if (message.role === "assistant") {
      return {
        ...message,
        status: message.status ?? "complete",
      } satisfies AssistantMessage;
    }

    return message;
  });

const createInitialSession = (): ChatSession => {
  const nowIso = new Date().toISOString();
  return {
    id: `session-${createId()}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [...seedMessages],
  };
};

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
      if (warnings.length > 0) {
        patch.warnings = warnings;
      } else {
        patch.warnings = [];
      }
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

export const useChatSession = () => {
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

    return createInitialSession();
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

  const applyPatch = useCallback(
    (assistantId: string, patch: AssistantStreamPatch) => {
      setSession((prev) => {
        const next: ChatSession = {
          ...prev,
          updatedAt: new Date().toISOString(),
          messages: prev.messages.map((message) => {
            if (message.id !== assistantId || message.role !== "assistant") {
              return message;
            }

            return applyPatchToAssistant(message, patch);
          }),
        };

        sessionRef.current = next;
        return next;
      });
    },
    []
  );

  const finishStreaming = useCallback(() => {
    setIsStreaming(false);
    abortRef.current = null;
  }, []);

  const sendPrompt = useCallback(
    ({ prompt, quickPromptId, sportKey, marketKey, userProfileId, tonePreference }: SendPromptArgs) => {
      const trimmed = prompt.trim();
      if (!trimmed || streamingRef.current) {
        return;
      }

      const normalizedSportKey =
        typeof sportKey === "string" && sportKey.trim().length > 0 ? sportKey.trim() : undefined;
      const normalizedMarketKey =
        typeof marketKey === "string" && marketKey.trim().length > 0 ? marketKey.trim() : undefined;
      const normalizedUserProfileId =
        typeof userProfileId === "string" && userProfileId.trim().length > 0 ? userProfileId.trim() : undefined;
      const normalizedTonePreference = tonePreference ?? 'neutral';

      const now = new Date();
      const nowIso = now.toISOString();
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
        updatedAt: nowIso,
        messages: [...sessionRef.current.messages, userMessage, assistantMessage],
        userId: normalizedUserProfileId ?? sessionRef.current.userId,
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

      const runSimulator = async () => {
        try {
          await simulateAssistantStream({
            prompt: trimmed,
            signal: controller.signal,
            onPatch: (patch) => applyPatch(assistantMessage.id, patch),
          });
          return true;
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException && fallbackError.name === "AbortError") {
            return true;
          }

          applyPatch(assistantMessage.id, {
            status: "error",
            error: "We couldn't complete that request. Try again shortly.",
          });

          setLastError("We hit a snag while generating that response. Please try again.");
          return false;
        }
      };

      const execute = async () => {
        let streamingSuccessful = false;
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
                  sessionId: sessionRef.current.id,
                  sportKey: normalizedSportKey,
                  marketKey: normalizedMarketKey,
                  userProfileId: normalizedUserProfileId,
                  tonePreference: normalizedTonePreference,
                  quickPromptId,
                }),
                signal: controller.signal,
              });

              if (response.ok && response.body) {
                await readStream(
                  response.body,
                  (patch) => applyPatch(assistantMessage.id, patch),
                  controller.signal
                );
                applyPatch(assistantMessage.id, { status: "complete" });
                streamingSuccessful = true;
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
            streamingSuccessful = true;
          }
        } finally {
          finishStreaming();

          // Persist to database if streaming was successful and user is authenticated
          if (streamingSuccessful && normalizedUserProfileId) {
            (async () => {
              try {
                // Create database session if this is the first real message (excluding seed messages)
                const realMessages = sessionRef.current.messages.filter(
                  (m) => !m.id.includes('seed')
                );

                if (!sessionRef.current.dbSessionId && realMessages.length === 2) {
                  // First real exchange - create session in database
                  const title = generateSessionTitle(trimmed);
                  const dbSession = await createChatSession(normalizedUserProfileId, title);

                  if (dbSession) {
                    setSession((prev) => ({
                      ...prev,
                      dbSessionId: dbSession.id,
                      userId: normalizedUserProfileId,
                    }));
                    sessionRef.current.dbSessionId = dbSession.id;
                    sessionRef.current.userId = normalizedUserProfileId;
                  }
                }

                // Save messages to database if we have a dbSessionId
                if (sessionRef.current.dbSessionId) {
                  await saveChatMessage(sessionRef.current.dbSessionId, userMessage);

                  // Get the latest assistant message from the session
                  const latestAssistant = sessionRef.current.messages.find(
                    (m) => m.id === assistantMessage.id
                  );
                  if (latestAssistant) {
                    await saveChatMessage(sessionRef.current.dbSessionId, latestAssistant);
                  }

                  // Update session timestamp
                  await updateChatSession(sessionRef.current.dbSessionId, {
                    last_message_at: nowIso,
                  });
                }
              } catch (dbError) {
                // Don't fail the entire operation if database persistence fails
                if (process.env.NODE_ENV === "development") {
                  console.warn("Failed to persist chat to database", dbError);
                }
              }
            })();
          }
        }
      };

      void execute();
    },
    [applyPatch, finishStreaming]
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
