import { createSSEStream } from "@/lib/stream/sse";

describe("SSE helper", () => {
  it("emits events", async () => {
    const { stream, emitter } = createSSEStream({ keepAliveMs: 0 });
    const reader = stream.getReader();
    emitter.send("token", { delta: "hello" });
    emitter.close();
    const chunks: string[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
    expect(chunks.join("")).toContain("token");
  });
});
