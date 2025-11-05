"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: {
    text?: string;
    meta?: Record<string, unknown>;
    citations?: Array<{ id: string; label: string; url?: string; fetchedAt?: string }>;
    toolCalls?: Array<{
      name: string;
      args: Record<string, unknown>;
      result?: Record<string, unknown> | null;
      latencyMs?: number | null;
    }>;
  };
};

type MessageListProps = {
  messages: ChatMessage[];
  streamingMessage?: ChatMessage | null;
};

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6" role="log" aria-live="polite">
      {messages.map((message) => (
        <MessageBubble key={message.id} role={message.role} content={message.content} />
      ))}
      {streamingMessage && (
        <MessageBubble
          key={streamingMessage.id}
          role={streamingMessage.role}
          content={streamingMessage.content}
          isStreaming
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
