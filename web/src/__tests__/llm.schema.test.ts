import { before, describe, it } from "node:test";
import assert from "node:assert/strict";

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

let deltaAnswerValidator: typeof import("../lib/llmClient").deltaAnswerValidator;

before(() => {
  ensureTestEnv();
  ({ deltaAnswerValidator } = require("../lib/llmClient"));
});

describe("deltaAnswerValidator", () => {
  it("validates a minimal grounded answer", () => {
    const result = deltaAnswerValidator.safeParse({
      answer: "Sample",
      widgets: [
        {
          kind: "odds",
          gameId: "game-1",
          moneyline: { home: -120, away: 110 },
        },
      ],
      sources: [
        {
          provider: "mock",
          endpoint: "odds",
          ids: ["game-1"],
          fetchedAt: new Date().toISOString(),
        },
      ],
      confidence: 0.6,
    });

    assert.equal(result.success, true);
  });

  it("rejects missing sources", () => {
    const result = deltaAnswerValidator.safeParse({
      answer: "Missing sources",
      widgets: [],
      confidence: 0.5,
    });

    assert.equal(result.success, false);
  });
});
