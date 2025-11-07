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

const simulatedWidgets = [
  {
    kind: "odds" as const,
    gameId: "sim-nba-nyk-bkn",
    moneyline: { home: -132, away: 118 },
    implied: { home: 0.57, away: 0.46 },
  },
  {
    kind: "playerForm" as const,
    playerId: "sim-jokic",
    stat: "rebounds",
    points: [15, 13, 11, 16, 14],
    summary: "Jokic is averaging 13.8 rebounds across his last five with two 15+ efforts.",
  },
  {
    kind: "injuries" as const,
    team: "nyk",
    list: [
      { player: "Julius Randle", status: "Out", impact: "High" },
      { player: "Jalen Brunson", status: "Questionable", impact: "Medium" },
    ],
  },
] as const;

const simulatedSources = [
  { provider: "mock", endpoint: "odds", ids: ["sim-nba-nyk-bkn"], fetchedAt: new Date().toISOString() },
  { provider: "mock", endpoint: "injuries", ids: ["nyk"], fetchedAt: new Date().toISOString() },
] as const;

export const simulateAssistantStream = async ({
  prompt,
  onPatch,
  signal
}: SimulateStreamArgs) => {
  const start = performance.now();

  const steps: readonly { delay: number; patch: AssistantStreamPatch }[] = [
    { delay: 220, patch: { headline: "Grounded response" } },
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
          "Knicks sit near -134 with Brunson leaning in, Randle still sidelined. "
      }
    },
    {
      delay: 520,
      patch: {
        answer:
          "Knicks moneyline sits around -132 (57% implied) while Brooklyn floats at +118. Jokic is averaging 13.8 rebounds in his last five; Knicks list Randle out and Brunson questionable. Analytics only—bet responsibly.",
      }
    },
    {
      delay: 720,
      patch: {
        widgets: simulatedWidgets,
        sources: simulatedSources,
        confidence: 0.6,
        caveats: ["Simulated response"],
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
