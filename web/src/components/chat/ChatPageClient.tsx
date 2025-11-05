"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Command } from "./CommandPalette";
import { CommandPalette } from "./CommandPalette";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

type ClientMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: any;
};

type ChatPageClientProps = {
  conversationId: string;
  initialMessages: ClientMessage[];
  initialModel: string;
  chatTitle: string;
};

function normalizeContent(content: any) {
  if (!content) return { text: "" };
  if (typeof content === "string") return { text: content };
  if (content.text) return content;
  if (typeof content === "object") return { ...content };
  return { text: String(content) };
}

export function ChatPageClient({ conversationId, initialMessages, initialModel, chatTitle }: ChatPageClientProps) {
  const [messages, setMessages] = useState<ClientMessage[]>(
    initialMessages.map((message) => ({ ...message, content: normalizeContent(message.content) })),
  );
  const [streamingMessage, setStreamingMessage] = useState<ClientMessage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(0.2);
  const [league, setLeague] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef<ClientMessage | null>(null);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "new-chat",
        label: "Start new chat",
        onSelect: () => {
          window.location.href = "/chat/new";
        },
        keywords: ["create", "new"],
      },
      {
        id: "open-dashboard",
        label: "Open dashboard",
        onSelect: () => {
          window.location.href = "/dashboard";
        },
        keywords: ["dashboard", "home"],
      },
      {
        id: "injuries-today",
        label: "Today's injuries",
        onSelect: () => {
          setPrompt("Show today's key injuries across leagues");
        },
        keywords: ["injury"],
      },
      {
        id: "line-moves",
        label: "Top line moves (24h)",
        onSelect: () => {
          setPrompt("Summarize the biggest line moves in the past 24 hours");
        },
        keywords: ["line", "movement"],
      },
    ],
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return;
    setError(null);

    const userMessage: ClientMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: { text: prompt },
    };

    const historyPayload = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content?.text ?? "",
    }));

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setIsStreaming(true);

    const assistantDraft: ClientMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: { text: "", toolCalls: [] },
    };
    streamingRef.current = assistantDraft;
    setStreamingMessage(assistantDraft);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...historyPayload, { role: "user", content: prompt }],
          model,
          temperature,
          league,
          tools: [
            {
              type: "function",
              function: {
                name: "fetchSportsData",
                description: "Fetch normalized sports data",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    league: { type: "string" },
                    market: { type: "string" },
                    team: { type: "string" },
                    player: { type: "string" },
                    dateRange: { type: "string" },
                    location: { type: "string" },
                    sportsbook: { type: "string" },
                  },
                  required: ["query"],
                },
              },
            },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          const lines = rawEvent.split("\n");
          let eventName = "message";
          let dataPayload = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.replace("event:", "").trim();
            }
            if (line.startsWith("data:")) {
              dataPayload += line.replace("data:", "").trim();
            }
          }

          if (!dataPayload) continue;

          if (eventName === "token") {
            setStreamingMessage((current) => {
              const next = {
                ...(current ?? assistantDraft),
                content: {
                  ...((current ?? assistantDraft).content ?? {}),
                  text: `${current?.content?.text ?? ""}${dataPayload}`,
                  toolCalls: current?.content?.toolCalls ?? [],
                },
              };
              streamingRef.current = next;
              return next;
            });
          } else if (eventName === "tool") {
            let parsed: any = null;
            try {
              parsed = JSON.parse(dataPayload);
            } catch (err) {
              parsed = { raw: dataPayload };
            }
            setStreamingMessage((current) => {
              const next = {
                ...(current ?? assistantDraft),
                content: {
                  ...((current ?? assistantDraft).content ?? {}),
                  text: current?.content?.text ?? "",
                  toolCalls: [...(current?.content?.toolCalls ?? []), parsed],
                },
              };
              streamingRef.current = next;
              return next;
            });
          } else if (eventName === "error") {
            setError(dataPayload);
          }
        }
      }

      setMessages((current) => {
        const final = streamingRef.current ?? streamingMessage ?? assistantDraft;
        return [...current, final];
      });
      streamingRef.current = null;
      setStreamingMessage(null);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      streamingRef.current = null;
      setStreamingMessage(null);
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId, isStreaming, messages, model, prompt, streamingMessage, temperature]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{chatTitle}</h1>
          <p className="text-xs text-slate-400">Delta is informational only; not betting advice.</p>
        </div>
        <div className="text-xs text-slate-500">{!isStreaming ? "Idle" : "Streaming…"}</div>
      </header>
      {error && <div className="bg-red-900/40 px-6 py-2 text-sm text-red-200">{error}</div>}
      <MessageList messages={messages} streamingMessage={streamingMessage} />
      <Composer
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
        disabled={isStreaming}
        model={model}
        onModelChange={setModel}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        league={league}
        onLeagueChange={setLeague}
        onAttach={(file) => {
          setMessages((current) => [
            ...current,
            {
              id: `file-${Date.now()}`,
              role: "system",
              content: { text: `Attached file: ${file.name}` },
            },
          ]);
        }}
        onRegenerate={() => {
          if (!streamingMessage && messages.length > 0) {
            const lastUser = [...messages].reverse().find((item) => item.role === "user");
            if (lastUser?.content?.text) {
              setPrompt(lastUser.content.text);
            }
          }
        }}
      />
      <footer className="border-t border-slate-800 px-6 py-3 text-xs text-slate-500">
        Remember: odds change quickly and availability varies by sportsbook and jurisdiction.
      </footer>
      <CommandPalette commands={commands} />
    </div>
  );
}
