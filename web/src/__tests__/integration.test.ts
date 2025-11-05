import { streamDeltaResponse, type DeltaChatMessage } from "@/lib/llm/openai";
import { fetchSportsData } from "@/lib/tools/sports";

describe("integration", () => {
  beforeAll(() => {
    process.env.DELTA_OFFLINE = "1";
  });

  it("streams summary with citations", async () => {
    const messages: DeltaChatMessage[] = [
      { role: "user", content: "Knicks moneyline odds tonight" },
    ];
    const sports = await fetchSportsData({ intent: "odds", query: messages[0].content });
    const events: string[] = [];
    for await (const event of streamDeltaResponse(messages, {
      model: "gpt-4o-mini",
      sportsData: sports.data,
    })) {
      events.push(event.type);
    }
    expect(events).toContain("token");
    expect(events).toContain("metadata");
    expect(events).toContain("end");
  });
});
