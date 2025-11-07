"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { AssistantMessage, ConversationMessage, UserMessage } from "@/components/chat/types";

import { simulateAssistantStream } from "./mockStream";
import type { AssistantStreamPatch } from "./patch";
import { persistStoredSession, readStoredSession } from "./storage";

const chatMode = process.env.NEXT_PUBLIC_CHAT_MODE ?? "api";

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
    headline: "Grounded response",
    summary: "Knicks priced -134 moneyline with 57% implied; monitor Brunson's status ahead of tip.",
    answer:
      "The Knicks currently sit at -134 on the moneyline (~57% implied) against Brooklyn. Brunson is probable while Randle remains out; Nets list no new injuries. Maintain unit discipline—analytics only.",
    widgets: [
      {
        kind: "odds",
        gameId: "nba-20240401-nyk-bkn",
        moneyline: { home: -134, away: 120 },
        implied: { home: 0.57, away: 0.45 },
      },
      {
        kind: "injuries",
        team: "nyk",
        list: [
          { player: "Julius Randle", status: "Out", impact: "High" },
          { player: "Jalen Brunson", status: "Probable" },
        ],
      },
    ],
    sources: [
      {
        provider: "mock",
        endpoint: "odds",
        ids: ["nba-20240401-nyk-bkn"],
        fetchedAt: new Date().toISOString(),
      },
      {
        provider: "mock",
        endpoint: "injuries",
        ids: ["nyk"],
        fetchedAt: new Date().toISOString(),
      },
    ],
    confidence: 0.62,
    caveats: ["Odds move quickly—refresh before placing action."],
    status: "complete",
    warnings: ["Analytics only. Bet responsibly (21+)."],
    createdAt: "5:30 PM ET",
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

const applyPatchToAssistant = (message: AssistantMessage, patch: AssistantStreamPatch): AssistantMessage => {
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
    answer: patch.answer ?? message.answer,
    widgets: patch.widgets ?? message.widgets,
    sources: patch.sources ?? message.sources,
    warnings: patch.warnings ? [...patch.warnings] : message.warnings,
    confidence: patch.confidence ?? message.confidence,
    caveats: patch.caveats ?? message.caveats,
    trace: patch.trace ?? message.trace,
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

    if (Array.isArray(payload.sources)) {
      patch.sources = payload.sources as AssistantMessage["sources"];
    }

    if (typeof payload.answer === "string") {
      patch.answer = payload.answer;
    }

    if (Array.isArray(payload.widgets)) {
      patch.widgets = payload.widgets as AssistantMessage["widgets"];
    }

    if (Array.isArray(payload.warnings)) {
      const warnings = payload.warnings.filter((item): item is string => typeof item === "string");
      if (warnings.length > 0) {
        patch.warnings = warnings;
      } else {
        patch.warnings = [];
      }
    }

    if (typeof payload.confidence === "number") {
      patch.confidence = payload.confidence;
    }

    if (Array.isArray(payload.caveats)) {
      const caveats = payload.caveats.filter((item): item is string => typeof item === "string");
      patch.caveats = caveats;
    }

    if (Array.isArray(payload.trace)) {
      patch.trace = payload.trace as AssistantMessage["trace"];
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

const useChatSessionInternal = () => {
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
        headline: "Grounded response",
        summary: "",
        answer: "",
        widgets: [],
        sources: [],
        warnings: [],
        confidence: undefined,
        caveats: [],
        trace: [],
        status: "draft",
      };

      const nextSession: ChatSession = {
        ...sessionRef.current,
        updatedAt: nowIso,
        messages: [...sessionRef.current.messages, userMessage, assistantMessage],
      };

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
                  sessionId: sessionRef.current.id,
                  sportKey: normalizedSportKey,
                  marketKey: normalizedMarketKey,
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
    [applyPatch, finishStreaming]
  );

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  const hasAssistantResponse = useMemo(
    () => session.messages.some((message) => message.role === "assistant"),
    [session.messages]
  );

  const latestAssistant = useMemo(() => {
    for (let index = session.messages.length - 1; index >= 0; index -= 1) {
      const message = session.messages[index];
      if (message.role === "assistant") {
        return message as AssistantMessage;
      }
    }
    return undefined;
  }, [session.messages]);

  const clearError = useCallback(() => setLastError(null), []);

  return {
    messages: session.messages,
    isStreaming,
    sendPrompt,
    sessionId: session.id,
    hasAssistantResponse,
    latestAssistant,
    latestWidgets: latestAssistant?.widgets ?? [],
    lastError,
    clearError,
  } as const;
};

type ChatSessionValue = ReturnType<typeof useChatSessionInternal>;

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

export const ChatSessionProvider = ({ children }: { children: ReactNode }) => {
  const value = useChatSessionInternal();
  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
};

export const useChatSession = (): ChatSessionValue => {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error("useChatSession must be used within a ChatSessionProvider");
  }
  return context;
};

export type UseChatSessionReturn = ReturnType<typeof useChatSession>;
