"use client";

import { Markdown } from "@/lib/markdown/render";
import { Citations } from "./Citations";
import { ToolCallCard } from "./ToolCallCard";

type ChatContent = {
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

type MessageBubbleProps = {
  role: "user" | "assistant" | "system" | "tool";
  content: ChatContent;
  isStreaming?: boolean;
};

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const alignment = role === "user" ? "items-end" : "items-start";
  const bubbleStyles =
    role === "user"
      ? "bg-sky-600 text-white"
      : role === "assistant"
        ? "bg-slate-800 text-slate-100"
        : "bg-slate-900 text-slate-300";

  return (
    <div className={`flex flex-col ${alignment} gap-2`}>
      <div className={`max-w-xl rounded-lg px-4 py-3 text-sm shadow ${bubbleStyles}`}>
        {content.text ? <Markdown className="prose prose-invert max-w-none">{content.text}</Markdown> : null}
        {isStreaming && <span className="mt-2 inline-flex animate-pulse text-xs text-slate-300">Streaming…</span>}
        {content.meta?.assumptions && (
          <div className="mt-3 rounded border border-slate-700 bg-slate-950 p-3 text-xs">
            <h4 className="mb-1 font-semibold">Assumptions</h4>
            <Markdown className="prose prose-invert max-w-none text-xs">
              {String(content.meta.assumptions)}
            </Markdown>
          </div>
        )}
        <Citations citations={content.citations} />
        {content.toolCalls?.map((call, index) => (
          <ToolCallCard key={`${call.name}-${index}`} name={call.name} args={call.args} result={call.result} latencyMs={call.latencyMs} />
        ))}
      </div>
      {role === "assistant" && (
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Delta • Informational only</p>
      )}
    </div>
  );
}
