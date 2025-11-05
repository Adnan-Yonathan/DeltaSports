import { fetchSportsData } from "@/lib/tools/sports";

describe("sports normalizer", () => {
  beforeAll(() => {
    process.env.DELTA_OFFLINE = "1";
  });

  it("returns normalized odds and injuries", async () => {
    const response = await fetchSportsData({
      intent: "odds",
      query: "Knicks moneyline tonight",
    });
    expect(response.data.markets?.[0].odds.american).toBeDefined();
    expect(response.data.injuries?.[0].player).toEqual("Julius Randle");
  });
});
