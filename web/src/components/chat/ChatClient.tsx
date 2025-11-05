"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { Command, CommandPalette } from "./CommandPalette";
import type { ChatMessage, ChatCitation, ChatToolCall } from "./MessageBubble";

interface ChatClientProps {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialModel: string;
}

interface SseEvent {
  event: string;
  data: any;
}

export function ChatClient({
  conversationId,
  initialMessages,
  initialModel,
}: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(0.2);
  const [league, setLeague] = useState("NBA");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const sendPrompt = useCallback(async () => {
    if (!input.trim()) return;
    setStreaming(true);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
    };
    setInput("");

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        toolCalls: [],
      },
    ]);

    const history = [...messages, userMessage];
    const payload = {
      conversationId: activeConversationId,
      model,
      temperature,
      messages: history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let updatedConversationId = activeConversationId;
      let citations: ChatCitation[] = [];
      const toolCalls: ChatToolCall[] = [];

      let assistantContent = "";

      const applyAssistantUpdate = (content: string) => {
        assistantContent = content;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content, citations, toolCalls: [...toolCalls] }
              : message,
          ),
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          const parsed = parseSse(part);
          if (!parsed) continue;
          if (parsed.event === "token") {
            applyAssistantUpdate(assistantContent + parsed.data);
          }
          if (parsed.event === "metadata") {
            citations = parsed.data.citations ?? [];
            applyAssistantUpdate(assistantContent);
          }
          if (parsed.event === "tool") {
            toolCalls.push({
              id: `${toolCalls.length}-${Date.now()}`,
              name: parsed.data.name,
              args: parsed.data.args ?? {},
              result: parsed.data.result ?? parsed.data.data,
            });
            applyAssistantUpdate(assistantContent);
          }
          if (parsed.event === "done") {
            updatedConversationId =
              parsed.data.conversationId ?? updatedConversationId;
            applyAssistantUpdate(parsed.data.text ?? "");
          }
        }
      }

      setActiveConversationId(updatedConversationId);
    } catch (error) {
      console.error("Chat streaming failed", error);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, activeConversationId, model, temperature]);

  const executeCommand = useCallback(
    (command: Command) => {
      setPaletteOpen(false);
      setInput((prev) => `${command.title} ${prev}`.trim() + " ");
    },
    [],
  );

  const disclaimer = useMemo(
    () =>
      "Delta provides informational sports intelligence only. No guarantees or betting advice.",
    [],
  );

  return (
    <div className="flex h-full w-full">
      <Sidebar currentChatId={activeConversationId} />
      <div className="flex flex-1 flex-col">
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-3 text-xs text-slate-400">
          {disclaimer}
        </div>
        <MessageList messages={messages} />
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={sendPrompt}
          onRegenerate={() => sendPrompt()}
          onEditLast={() => {
            const lastUser = [...messages].reverse().find((msg) => msg.role === "user");
            setInput(lastUser?.content ?? "");
          }}
          disabled={streaming}
          model={model}
          temperature={temperature}
          league={league}
          onModelChange={setModel}
          onTemperatureChange={setTemperature}
          onLeagueChange={setLeague}
        />
      </div>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onExecute={executeCommand}
      />
    </div>
  );
}

function parseSse(raw: string): SseEvent | null {
  const lines = raw.split("\n");
  let event = "message";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.replace("event:", "").trim();
    }
    if (line.startsWith("data:")) {
      data += line.replace("data:", "").trim();
    }
  }
  if (!event) return null;
  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return { event, data };
  }
}
