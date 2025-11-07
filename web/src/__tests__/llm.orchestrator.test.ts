import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeltaAnswer } from "@/lib/llmClient";

const completionSpy = vi.fn();

vi.mock("openai", () => {
  class MockCompletions {
    create = completionSpy;
  }
  class MockChat {
    completions = new MockCompletions();
  }
  class MockOpenAI {
    chat = new MockChat();
    constructor() {
      (globalThis as any).__openaiInstance = this;
    }
  }
  return { default: MockOpenAI };
});

const mockOdds = {
  id: "tool-1",
  ok: true,
  cacheHit: false,
  durationMs: 12,
  data: {
    gameId: "nba-20240401-nyk-bkn",
    market: "moneyline" as const,
    moneyline: { home: -120, away: 110 },
    implied: { home: 0.55, away: 0.47 },
    fetchedAt: new Date().toISOString(),
    provider: "mock",
    endpoint: "odds",
    ids: ["nba-20240401-nyk-bkn"],
  },
};

const mockInjuries = {
  id: "tool-2",
  ok: true,
  cacheHit: false,
  durationMs: 10,
  data: {
    team: "nyk",
    list: [{ player: "Julius Randle", status: "Out" }],
    fetchedAt: new Date().toISOString(),
    provider: "mock",
    endpoint: "injuries",
    ids: ["nyk"],
  },
};

vi.mock("@/lib/tools/sportsTools", () => {
  return {
    callOddsTool: vi.fn().mockResolvedValue(mockOdds),
    callStatsTool: vi.fn().mockResolvedValue({ id: "tool-3", ok: true, cacheHit: false, durationMs: 9, data: null }),
    callInjuriesTool: vi.fn().mockResolvedValue(mockInjuries),
    toTrace: (_name: string, result: typeof mockOdds) => ({
      id: result.id,
      name: "mock",
      cacheHit: result.cacheHit,
      durationMs: result.durationMs,
      ok: result.ok,
      source: result.source,
    }),
  };
});

import { runDeltaConversation } from "@/lib/llmClient";

describe("runDeltaConversation", () => {
  beforeEach(() => {
    completionSpy.mockReset();
    completionSpy
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call-1",
                  function: { name: "getOdds", arguments: JSON.stringify({ gameId: "nba-20240401-nyk-bkn", market: "moneyline" }) },
                },
                {
                  id: "call-2",
                  function: { name: "getInjuries", arguments: JSON.stringify({ team: "nyk" }) },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: "Mock answer",
                widgets: [
                  {
                    kind: "odds",
                    gameId: "nba-20240401-nyk-bkn",
                  },
                  {
                    kind: "injuries",
                    team: "nyk",
                    list: [{ player: "Julius Randle", status: "Out" }],
                  },
                ],
                sources: [
                  { provider: "mock", endpoint: "odds", ids: ["nba-20240401-nyk-bkn"], fetchedAt: new Date().toISOString() },
                ],
                confidence: 0.6,
              } satisfies DeltaAnswer),
            },
          },
        ],
      });
  });

  it("returns grounded answer and trace", async () => {
    const result = await runDeltaConversation("Test prompt");

    expect(result.answer.widgets).toHaveLength(2);
    expect(result.trace.length).toBeGreaterThan(0);
  });
});
