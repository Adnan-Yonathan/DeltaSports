import { createSseResponse } from "@/lib/stream/sse";

describe("SSE helper", () => {
  it("streams events", async () => {
    const response = createSseResponse(async ({ send, close }) => {
      send("token", { value: "Hello" });
      close();
    });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const { value } = await reader!.read();
    const text = decoder.decode(value);
    expect(text).toContain("event: token");
    expect(text).toContain("Hello");
  });
});
