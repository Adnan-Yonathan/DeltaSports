import { fetchSportsData } from "@/lib/tools/sports";

describe("sports tool normalizer", () => {
  const originalEnv = process.env.DELTA_OFFLINE;
  beforeAll(() => {
    process.env.DELTA_OFFLINE = "1";
  });
  afterAll(() => {
    process.env.DELTA_OFFLINE = originalEnv;
  });

  it("returns normalized mock data in offline mode", async () => {
    const result = await fetchSportsData({ query: "Knicks moneyline", league: "NBA", market: "moneyline" });
    expect(result.data.source).toBe("mock-offline");
    expect(result.data.markets?.[0]?.odds.american).toBe(-110);
  });
});
