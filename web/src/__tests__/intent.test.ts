import { inferIntent } from "@/lib/llm/openai";

describe("intent inference", () => {
  it("detects injuries intent", () => {
    expect(inferIntent("Who is injured tonight?").type).toBe("injuries");
  });

  it("defaults to player stats", () => {
    expect(inferIntent("How many points for Jokic?").type).toBe("player_stats");
  });
});
