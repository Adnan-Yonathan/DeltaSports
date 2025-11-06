"use client";

import { type ChangeEvent, useCallback, useMemo, useState } from "react";

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

const sportOptions = [
  { value: "basketball_nba", label: "NBA" },
  { value: "basketball_ncaab", label: "NCAA Basketball" },
  { value: "football_nfl", label: "NFL" },
  { value: "baseball_mlb", label: "MLB" },
  { value: "hockey_nhl", label: "NHL" }
] as const;

const marketOptions = [
  { value: "h2h", label: "Moneyline" },
  { value: "spreads", label: "Spread" },
  { value: "totals", label: "Total" }
] as const;

export function ConversationPane() {
  const [composerValue, setComposerValue] = useState("");
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>("american");
  const [selectedSportKey, setSelectedSportKey] = useState<string>(sportOptions[0]?.value ?? "basketball_nba");
  const [selectedMarketKey, setSelectedMarketKey] = useState<string>(marketOptions[0]?.value ?? "h2h");
  const { messages, isStreaming, sendPrompt, hasAssistantResponse, lastError, clearError } = useChatSession();

  const handleComposerSubmit = useCallback(
    ({ prompt, quickPromptId }: { prompt: string; quickPromptId?: string }) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        return;
      }

      setComposerValue("");
      sendPrompt({
        prompt: trimmed,
        quickPromptId,
        sportKey: selectedSportKey,
        marketKey: selectedMarketKey,
      });
    },
    [selectedMarketKey, selectedSportKey, sendPrompt]
  );

  const handleOddsFormatChange = useCallback(
    (format: OddsFormat) => {
      setOddsFormat((current) => (current === format ? current : format));
    },
    []
  );

  const handleSportChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSportKey(event.target.value);
  }, []);

  const handleMarketChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarketKey(event.target.value);
  }, []);

  const showErrorBanner = useMemo(() => Boolean(lastError), [lastError]);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/40">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-black/60 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Live conversation stream</h3>
          <p className="text-sm text-slate-300">
            Streamed answers include short summaries, odds formats, and citation badges.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <label className="flex flex-col gap-1 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sport</span>
            <select
              className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              value={selectedSportKey}
              onChange={handleSportChange}
              disabled={isStreaming}
            >
              {sportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Market</span>
            <select
              className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              value={selectedMarketKey}
              onChange={handleMarketChange}
              disabled={isStreaming}
            >
              {marketOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Odds format</span>
            <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/5">
              {oddsOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-3 py-1 font-medium transition ${
                    oddsFormat === option.value
                      ? "bg-brand-accent text-black"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-pressed={oddsFormat === option.value}
                  onClick={() => handleOddsFormatChange(option.value)}
                  disabled={isStreaming}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      {showErrorBanner ? (
        <div className="border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm text-red-200">
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
      <MessageList messages={messages} oddsFormat={oddsFormat} isStreaming={isStreaming} />
      <div className="sticky bottom-0 space-y-3 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pb-6 pt-4">
        {hasAssistantResponse ? (
          <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold uppercase tracking-wide text-white">Responsible betting reminder</p>
            <p className="mt-1 text-slate-400">
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
