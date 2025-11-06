"use client";

import type { AssistantStreamPatch } from "./patch";

type SimulateStreamArgs = {
  prompt: string;
  onPatch: (patch: AssistantStreamPatch) => void;
  signal: AbortSignal;
};

const waitFor = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", abortListener);
      resolve();
    }, ms);

    const abortListener = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", abortListener);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal.addEventListener("abort", abortListener);
  });

const simulatedSections = [
  {
    id: "key-stats",
    title: "Key stats",
    items: [
      "NYK 7-3 in last 10 · Opp PPG allowed: 109.8",
      "Celtics offense rating: 118.5 over last 10"
    ] as const
  },
  {
    id: "assumptions",
    title: "Assumptions",
    items: [
      "Primary line captured 6 minutes ago",
      "Backup odds within 0.5% EV delta",
      "Injury report timestamped 15 minutes prior"
    ] as const
  },
  {
    id: "timestamps",
    title: "Timestamps",
    items: [
      "Odds API sync 2 minutes ago",
      "Backup provider verified 90 seconds ago"
    ] as const
  }
] as const;

const simulatedSources = [
  { id: "odds-api", label: "Odds API" },
  { id: "nba-injuries", label: "NBA.com injuries" },
  { id: "gpt-backfill", label: "GPT-4o backup" }
] as const;

export const simulateAssistantStream = async ({
  prompt,
  onPatch,
  signal
}: SimulateStreamArgs) => {
  const start = performance.now();

  const steps: readonly { delay: number; patch: AssistantStreamPatch }[] = [
    { delay: 220, patch: { headline: "Short answer" } },
    {
      delay: 320,
      patch: {
        summaryDelta: `Here's what I found for "${prompt}": `
      }
    },
    {
      delay: 420,
      patch: {
        summaryDelta:
          "Knicks sit at -134 with Brunson probable, Randle out, Celtics clean report. "
      }
    },
    {
      delay: 520,
      patch: {
        odds: {
          american: "-134",
          decimal: "1.75",
          fractional: "3/4",
          impliedProbability: "57.3%"
        }
      }
    },
    {
      delay: 620,
      patch: {
        sections: simulatedSections
      }
    },
    {
      delay: 720,
      patch: {
        sources: simulatedSources
      }
    }
  ];

  for (const step of steps) {
    await waitFor(step.delay, signal);
    onPatch(step.patch);
  }

  onPatch({ status: "complete" });

  return {
    latencyMs: performance.now() - start,
    transport: "mock" as const
  };
};
