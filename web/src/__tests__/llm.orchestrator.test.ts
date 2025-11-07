import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type { DeltaAnswer } from "../lib/llmClient";

const ensureTestEnv = () => {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";
  process.env.OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://example.com";
  process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? "test-model";
  process.env.SPORTS_VENDOR = process.env.SPORTS_VENDOR ?? "mock";
  process.env.SPORTS_API_BASE = process.env.SPORTS_API_BASE ?? "https://api.example.com";
  process.env.SPORTS_API_KEY = process.env.SPORTS_API_KEY ?? "";
  process.env.FEATURE_FLAGS = process.env.FEATURE_FLAGS ?? "llm_insights,line_movements";
  process.env.CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS ?? "30";
};

let runDeltaConversation: typeof import("../lib/llmClient").runDeltaConversation;

before(() => {
  ensureTestEnv();
  ({ runDeltaConversation } = require("../lib/llmClient"));
});

class MockCompletions {
  responses: Array<any> = [];
  calls: Array<any> = [];

  queue(response: any) {
    this.responses.push(response);
  }

  reset() {
    this.responses = [];
    this.calls = [];
  }

  async create(args: any) {
    this.calls.push(args);
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No mock completion response available");
    }
    return response;
  }
}

type MockToolResult<T> = {
  id: string;
  ok: boolean;
  cacheHit: boolean;
  durationMs: number;
  data: T | null;
};

describe("runDeltaConversation", () => {
  const completions = new MockCompletions();
  const client = { chat: { completions } } as const;

  const mockOdds: MockToolResult<any> = {
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

  const mockInjuries: MockToolResult<any> = {
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

  beforeEach(() => {
    completions.reset();
    completions.queue({
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: "call-1",
                function: {
                  name: "getOdds",
                  arguments: JSON.stringify({ gameId: "nba-20240401-nyk-bkn", market: "moneyline" }),
                },
              },
              {
                id: "call-2",
                function: {
                  name: "getInjuries",
                  arguments: JSON.stringify({ team: "nyk" }),
                },
              },
            ],
          },
        },
      ],
    });

    completions.queue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: "Mock answer",
              widgets: [
                { kind: "odds", gameId: "nba-20240401-nyk-bkn" },
                {
                  kind: "injuries",
                  team: "nyk",
                  list: [{ player: "Julius Randle", status: "Out" }],
                },
              ],
              sources: [
                {
                  provider: "mock",
                  endpoint: "odds",
                  ids: ["nba-20240401-nyk-bkn"],
                  fetchedAt: new Date().toISOString(),
                },
              ],
              confidence: 0.6,
            } satisfies DeltaAnswer),
          },
        },
      ],
    });
  });

  it("returns grounded answer and trace", async () => {
    const result = await runDeltaConversation("Test prompt", {
      client,
      tools: {
        callOddsTool: async () => mockOdds,
        callStatsTool: async () => ({ id: "tool-3", ok: true, cacheHit: false, durationMs: 9, data: null }),
        callInjuriesTool: async () => mockInjuries,
      },
    });

    assert.ok(result.answer.widgets);
    assert.equal(result.answer.widgets?.length, 2);
    assert.ok(result.trace.length > 0);
  });

  it("persists assistant tool call message before next completion", async () => {
    await runDeltaConversation("Test prompt", {
      client,
      tools: {
        callOddsTool: async () => mockOdds,
        callStatsTool: async () => ({ id: "tool-3", ok: true, cacheHit: false, durationMs: 9, data: null }),
        callInjuriesTool: async () => mockInjuries,
      },
    });

    assert.ok(completions.calls.length >= 2);

    const latestCallArgs = completions.calls[completions.calls.length - 1];
    assert.ok(Array.isArray(latestCallArgs.messages));
    assert.equal(latestCallArgs.messages.length, 5);

    const [systemTurn, userTurn, assistantTurn, firstTool, secondTool] = latestCallArgs.messages;

    assert.equal(systemTurn.role, "system");
    assert.equal(userTurn.role, "user");

    assert.equal(assistantTurn.role, "assistant");
    assert.ok(Array.isArray(assistantTurn.tool_calls));
    assert.deepEqual(
      assistantTurn.tool_calls.map((call: any) => call.id),
      ["call-1", "call-2"],
    );

    assert.equal(firstTool.role, "tool");
    assert.equal(firstTool.tool_call_id, "call-1");
    assert.equal(firstTool.name, "getOdds");

    assert.equal(secondTool.role, "tool");
    assert.equal(secondTool.tool_call_id, "call-2");
    assert.equal(secondTool.name, "getInjuries");
  });
});
