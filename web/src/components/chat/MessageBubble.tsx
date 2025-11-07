"use client";

import type { AssistantMessage, ConversationMessage } from "./types";

type MessageBubbleProps = {
  message: ConversationMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "assistant") {
    const status: AssistantMessage["status"] = message.status ?? "draft";
    const isError = status === "error";
    const isDraft = status === "draft";
    const sources = message.sources ?? [];
    const warnings = message.warnings ?? [];
    const caveats = message.caveats ?? [];
    const trace = message.trace ?? [];
    const confidence = typeof message.confidence === "number" ? Math.round(message.confidence * 100) : null;
    const answerText = message.answer || message.summary;

    return (
      <article
        className={`flex w-full max-w-2xl flex-col gap-3 self-end rounded-2xl border px-4 py-4 text-sm text-slate-200 transition ${
          isError ? "border-red-500/60 bg-red-500/10" : "border-brand-accent/40 bg-brand-accent/10"
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-accent">Assistant · {message.headline ?? "Response"}</span>
            {confidence !== null ? (
              <span className="rounded-full border border-brand-accent/60 bg-brand-accent/10 px-2 py-0.5 text-[11px] font-medium text-brand-accent">
                Confidence {confidence}%
              </span>
            ) : null}
            {status !== "complete" ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
                  isError ? "border-red-500/60 text-red-200" : "border-brand-accent/60 text-brand-accent"
                }`}
              >
                {isError ? "Error" : "Streaming"}
              </span>
            ) : null}
          </div>
          <span className="text-slate-400">{message.createdAt}</span>
        </header>
        {isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {message.error ?? "We couldn't complete that request."}
          </div>
        ) : (
          <p className={`text-base text-slate-100 ${isDraft && !answerText ? "animate-pulse text-slate-400" : ""}`}>
            {answerText && answerText.trim().length > 0
              ? answerText
              : isDraft
                ? "Streaming answer..."
                : "Awaiting summary."}
          </p>
        )}
        {warnings.length > 0 ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
            <p className="font-semibold uppercase tracking-wide text-amber-200">Warnings</p>
            <ul className="mt-2 space-y-1 text-amber-100">
              {warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {caveats.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-white">Caveats</p>
            <ul className="mt-2 space-y-1">
              {caveats.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {trace.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-slate-400">
            <p className="text-xs font-semibold uppercase tracking-wide text-white">Tool trace</p>
            <ul className="mt-2 space-y-1">
              {trace.map((entry) => (
                <li key={entry.id}>
                  <span className="font-semibold text-slate-200">{entry.name}</span>
                  <span className="text-slate-500"> · {entry.durationMs}ms</span>
                  <span className="ml-2 text-slate-500">{entry.cacheHit ? "cache" : entry.ok ? "live" : "error"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {sources.length > 0 ? (
          <footer className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
            <span className="text-xs font-semibold text-white">Sources</span>
            {sources.map((source) => (
              <span
                key={`${source.provider}-${source.endpoint}-${source.ids.join("-")}`}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-slate-300"
              >
                {source.provider} · {source.endpoint}
              </span>
            ))}
          </footer>
        ) : null}
      </article>
    );
  }

  return (
    <article className="flex max-w-xl flex-col gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span className="font-semibold text-white">You</span>
        <span>{message.createdAt}</span>
      </header>
      <p className="text-sm text-slate-100">{message.content}</p>
    </article>
  );
}

export default MessageBubble;
