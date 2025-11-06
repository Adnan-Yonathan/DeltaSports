"use client";

import { useCallback, useMemo, useState } from "react";

import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import type { OddsFormat, QuickPrompt } from "./types";
import { useChatSession } from "@/lib/chat/useChatSession";

const quickPrompts: readonly QuickPrompt[] = [
  {
    id: "nba-edges",
    label: "Tonight's NBA edges",
    description: "Moneyline odds, injuries, and handle shifts",
    prompt: "What are tonight's Knicks moneyline odds and any injury news?"
  },
  {
    id: "player-prop",
    label: "Player prop audit",
    description: "Find EV-positive props for star players",
    prompt: "Show Jokic's last 10 games and a fair price for 25+ points."
  },
  {
    id: "bankroll",
    label: "Bankroll health",
    description: "Summarize exposure by league and bet type",
    prompt: "Give me a bankroll summary across NBA and NHL tonight."
  }
] as const;

const oddsOptions: readonly { value: OddsFormat; label: string }[] = [
  { value: "american", label: "American" },
  { value: "decimal", label: "Decimal" },
  { value: "fractional", label: "Fractional" }
];

export function ConversationPane() {
  const [composerValue, setComposerValue] = useState("");
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>("american");
  const { messages, isStreaming, sendPrompt, hasAssistantResponse, lastError, clearError } = useChatSession();

  const handleComposerSubmit = useCallback(
    ({ prompt, quickPromptId }: { prompt: string; quickPromptId?: string }) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        return;
      }

      setComposerValue("");
      sendPrompt({ prompt: trimmed, quickPromptId });
    },
    [sendPrompt]
  );

  const handleOddsFormatChange = useCallback(
    (format: OddsFormat) => {
      const assistantResponses = messages.filter((message) => message.role === "assistant").length;

      setOddsFormat((current) => {
        if (current === format) {
          return current;
        }

        return format;
      });
    },
    [messages]
  );

  const showErrorBanner = useMemo(() => Boolean(lastError), [lastError]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(39,39,42,0.35)_0%,_transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black via-black/80 to-transparent"
      />
      <div className="relative z-20 flex flex-1 flex-col">
        {showErrorBanner ? (
          <div className="border-b border-red-500/40 bg-red-500/15 px-6 py-3 text-sm text-red-100">
            <div className="flex items-start justify-between gap-4">
              <span>{lastError}</span>
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-wide text-red-200/70 hover:text-red-100"
                onClick={clearError}
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <div className="pointer-events-none absolute right-4 top-4 flex max-w-full justify-end pr-2 sm:right-6 sm:top-6">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] text-slate-200 shadow-lg backdrop-blur">
            <span className="uppercase tracking-wide text-slate-400">Odds</span>
            <div className="flex items-center gap-1">
              {oddsOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-2 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 ${
                    oddsFormat === option.value
                      ? "bg-brand-accent/90 text-black"
                      : "text-slate-200/80 hover:text-white"
                  }`}
                  aria-pressed={oddsFormat === option.value}
                  onClick={() => handleOddsFormatChange(option.value)}
                >
                  {option.label.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <MessageList messages={messages} oddsFormat={oddsFormat} isStreaming={isStreaming} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black via-black/85 to-transparent"
      />
      <div className="relative z-20 space-y-4 px-4 pb-6 pt-4 sm:px-6 md:px-10">
        {hasAssistantResponse ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-xs text-slate-200 backdrop-blur">
            <p className="font-semibold uppercase tracking-wide text-white">Responsible betting reminder</p>
            <p className="mt-1 text-slate-300">
              Insights are informational and not guarantees. Always verify odds, respect your bankroll limits, and wager responsibly.
            </p>
          </div>
        ) : null}
        <Composer
          value={composerValue}
          disabled={isStreaming}
          quickPrompts={quickPrompts}
          onChange={setComposerValue}
          onSubmit={handleComposerSubmit}
        />
      </div>
    </div>
  );
}

export default ConversationPane;
