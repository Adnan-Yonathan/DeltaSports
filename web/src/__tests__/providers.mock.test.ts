import { describe, expect, it } from "vitest";

import { createMockProvider } from "@/lib/providers/sports/mock";

describe("mock sports provider", () => {
  it("returns odds for Knicks vs Nets", async () => {
    const provider = createMockProvider();
    const result = await provider.getOdds({
      gameId: "nba-20240401-nyk-bkn",
      market: "moneyline",
    });

    expect(result).toBeTruthy();
    expect(result?.moneyline?.home).toBe(-120);
    expect(result?.provider).toBe("mock");
  });

  it("returns player stats for Jokic", async () => {
    const provider = createMockProvider();
    const result = await provider.getStats({
      player: { name: "Nikola Jokic" },
      stat: "rebounds",
      range: { lastNGames: 5 },
    });

    expect(result?.average).toBeGreaterThan(10);
    expect(result?.series).toHaveLength(5);
  });
});
