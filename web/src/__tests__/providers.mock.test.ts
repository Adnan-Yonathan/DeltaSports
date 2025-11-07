import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createMockProvider } from "../lib/providers/sports/mock";

describe("mock sports provider", () => {
  it("returns odds for Knicks vs Nets", async () => {
    const provider = createMockProvider();
    const result = await provider.getOdds({
      gameId: "nba-20240401-nyk-bkn",
      market: "moneyline",
    });

    assert.ok(result);
    assert.equal(result?.moneyline?.home, -120);
    assert.equal(result?.provider, "mock");
  });

  it("returns player stats for Jokic", async () => {
    const provider = createMockProvider();
    const result = await provider.getStats({
      player: { name: "Nikola Jokic" },
      stat: "rebounds",
      range: { lastNGames: 5 },
    });

    assert.ok(result);
    assert.ok((result?.average ?? 0) > 10);
    assert.equal(result?.series?.length, 5);
  });
});
