import { describe, expect, it } from "vitest";

import { deltaAnswerValidator } from "@/lib/llmClient";

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

    expect(result.success).toBe(true);
  });

  it("rejects missing sources", () => {
    const result = deltaAnswerValidator.safeParse({
      answer: "Missing sources",
      widgets: [],
      confidence: 0.5,
    });

    expect(result.success).toBe(false);
  });
});
