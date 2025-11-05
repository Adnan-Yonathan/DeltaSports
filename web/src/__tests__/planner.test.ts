import { planSportsTool } from "@/lib/llm/openai";

describe("tool planner", () => {
  it("detects injuries", () => {
    expect(planSportsTool("Show me Lakers injuries" )?.intent).toBe("injuries");
  });

  it("detects odds", () => {
    expect(planSportsTool("Knicks moneyline odds" )?.intent).toBe("odds");
  });

  it("detects player stats", () => {
    expect(planSportsTool("Jokic last 10 games" )?.intent).toBe("player_stats");
  });
});
