"use client";

import type { AssistantMessage, ConversationMessage, OddsFormat } from "./types";

const formatLabels: Record<OddsFormat, string> = {
  american: "American",
  decimal: "Decimal",
  fractional: "Fractional"
};

type MessageBubbleProps = {
  message: ConversationMessage;
  oddsFormat: OddsFormat;
};

export function MessageBubble({ message, oddsFormat }: MessageBubbleProps) {
  if (message.role === "assistant") {
    const status: AssistantMessage["status"] = message.status ?? "draft";
    const isError = status === "error";
    const isDraft = status === "draft";
    const oddsValue = message.odds?.[oddsFormat];
    const impliedProbability = message.odds?.impliedProbability;
    const sections = message.sections ?? [];
    const sources = message.sources ?? [];
    const warnings = message.warnings ?? [];

    return (
      <article
        className={`flex w-full max-w-2xl flex-col gap-3 self-end rounded-2xl border px-4 py-4 text-sm text-slate-200 transition ${
          isError
            ? "border-red-500/60 bg-red-500/10"
            : "border-brand-accent/40 bg-brand-accent/10"
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-accent">
              Assistant · {message.headline ?? "Response"}
            </span>
            {status !== "complete" ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
                  isError
                    ? "border-red-500/60 text-red-200"
                    : "border-brand-accent/60 text-brand-accent"
                }`}
              >
                {isError ? "Error" : "Streaming"}
              </span>
            ) : null}
          </div>
          <span className="text-slate-400">{message.createdAt}</span>
        </header>
        {oddsValue || impliedProbability ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">{formatLabels[oddsFormat]} odds</p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {oddsValue ? (
                <span className="rounded-full border border-brand-accent/50 bg-brand-accent/20 px-3 py-1 font-medium text-brand-accent">
                  {oddsValue}
                </span>
              ) : null}
              {impliedProbability ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-slate-200">
                  Implied probability: {impliedProbability}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        {isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {message.error ?? "We couldn't complete that request."}
          </div>
        ) : (
          <p className={`text-base text-slate-100 ${isDraft && !message.summary ? "animate-pulse text-slate-400" : ""}`}>
            {message.summary && message.summary.trim().length > 0
              ? message.summary
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
        {sections.length > 0 ? (
          <div className="grid gap-3 rounded-2xl bg-black/40 p-4 text-xs text-slate-300 sm:grid-cols-2">
            {sections.map((section) => (
              <section key={section.id} className="space-y-1">
                <h4 className="font-semibold text-white">{section.title}</h4>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item} className="text-slate-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : isDraft && !isError ? (
          <div className="rounded-2xl border border-white/5 bg-black/40 p-4 text-xs text-slate-400">
            Building supporting stats…
          </div>
        ) : null}
        {sources.length > 0 ? (
          <footer className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
            <span className="text-xs font-semibold text-white">Sources</span>
            {sources.map((source) => (
              <span
                key={source.id}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-slate-300"
              >
                {source.label}
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
