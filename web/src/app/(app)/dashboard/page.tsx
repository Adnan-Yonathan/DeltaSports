"use client";

import { useState } from "react";

import { ConversationPane } from "@/components/chat/ConversationPane";

const operations = [
  {
    title: "Latency",
    value: "742 ms",
    helper: "Avg. LLM response time over last 20 requests"
  },
  {
    title: "Win rate delta",
    value: "+6.3%",
    helper: "Performance vs. sportsbook closing lines"
  },
  {
    title: "Data providers",
    value: "2 / 2",
    helper: "All odds endpoints and backups responsive"
  }
] as const;

const analyticsSignals = [
  {
    title: "Prompt capture",
    description: "`chat_prompt_submitted` fires with token length and quick prompt metadata."
  },
  {
    title: "Format toggles",
    description: "`odds_format_toggled` records user preference shifts for odds rendering."
  },
  {
    title: "Streaming completion",
    description: "`llm.answer.stream_completed` captures latency and fallback usage."
  }
] as const;

function TelemetryPanel() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Operational telemetry</h3>
          <p className="text-xs text-slate-300">
            Track the orchestration health for the streaming chat experience.
          </p>
        </header>
        <ul className="grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-1">
          {operations.map((metric) => (
            <li key={metric.title} className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-slate-400">{metric.title}</p>
              <p className="mt-1 text-lg font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{metric.helper}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Analytics checkpoints</h3>
          <p className="text-xs text-slate-300">
            PostHog instrumentation pairs UI events with LLM outcomes for faster iteration.
          </p>
        </header>
        <ul className="space-y-3 text-xs text-slate-300">
          {analyticsSignals.map((signal) => (
            <li key={signal.title} className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-medium text-white">{signal.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{signal.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1">
      <div className="relative flex min-h-0 min-w-0 flex-1 justify-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end px-4 pt-4 sm:px-6">
          <div className="hidden pointer-events-auto xl:flex">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
              onClick={() => setIsUtilityOpen((value) => !value)}
              aria-expanded={isUtilityOpen}
            >
              {isUtilityOpen ? "Hide telemetry" : "Show telemetry"}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`h-4 w-4 transition ${isUtilityOpen ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex w-full max-w-3xl flex-1">
          <ConversationPane />
        </div>
      </div>

      <aside
        className={`pointer-events-auto hidden w-[22rem] max-w-full flex-col border-l border-white/5 bg-black/40 px-6 py-6 shadow-xl transition duration-300 xl:flex ${
          isUtilityOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isUtilityOpen}
      >
        <TelemetryPanel />
      </aside>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-6 xl:hidden">
        <div className="pointer-events-auto w-full max-w-xl px-4">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            onClick={() => setIsUtilityOpen(true)}
            aria-expanded={isUtilityOpen}
          >
            View telemetry
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M4 7l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-3xl border border-white/10 bg-black/90 px-5 pb-8 pt-6 shadow-2xl transition duration-300 sm:max-w-xl xl:hidden ${
          isUtilityOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isUtilityOpen}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Telemetry</p>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white"
            onClick={() => setIsUtilityOpen(false)}
            aria-label="Close telemetry panel"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="mt-4 max-h-[40vh] overflow-y-auto pr-1 text-xs">
          <TelemetryPanel />
        </div>
      </div>
    </div>
  );
}
