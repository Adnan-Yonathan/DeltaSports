import React from "react";
import { Citations } from "./Citations";
import { ToolCallCard } from "./ToolCallCard";

export interface ChatCitation {
  label: string;
  url?: string;
  fetchedAt?: string;
}

export interface ChatToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt?: string;
  citations?: ChatCitation[];
  toolCalls?: ChatToolCall[];
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const alignment = isUser ? "items-end" : "items-start";
  const bubbleStyles = isUser
    ? "bg-brand-accent text-brand"
    : "bg-slate-800 text-slate-100";

  return (
    <div className={`flex w-full flex-col gap-2 ${alignment}`}>
      <div
        className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ${bubbleStyles}`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
      {message.citations && message.citations.length > 0 ? (
        <Citations citations={message.citations} />
      ) : null}
      {message.toolCalls?.map((toolCall) => (
        <ToolCallCard key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  );
}
