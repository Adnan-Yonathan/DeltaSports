import { describe, expect, it, vi } from "vitest";

import { LlmClient } from "@/lib/llmClient";

describe("LLM orchestrator", () => {
  it("stores assistant tool calls before requesting the next completion", async () => {
    const toolCall = {
      id: "tool-call-id",
      type: "function" as const,
      function: {
        name: "fetchWeather",
        arguments: JSON.stringify({ city: "New York" }),
      },
    };

    const callModel = vi
      .fn()
      .mockResolvedValueOnce({
        message: {
          role: "assistant" as const,
          content: "I'll check the weather.",
          tool_calls: [toolCall],
        },
      })
      .mockResolvedValueOnce({
        message: {
          role: "assistant" as const,
          content: "It's sunny and 75°F.",
        },
      });

    const toolHandler = vi.fn().mockResolvedValue("Sunny with 75°F highs.");

    const client = new LlmClient({
      callModel: async (messages) => callModel(messages),
      tools: { fetchWeather: toolHandler },
    });

    const finalMessage = await client.send("What's the weather?");

    expect(finalMessage.content).toBe("It's sunny and 75°F.");
    expect(callModel).toHaveBeenCalledTimes(2);
    expect(toolHandler).toHaveBeenCalledWith({
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: toolCall.function.arguments,
      message: toolCall.function,
    });

    const secondCallHistory = callModel.mock.calls[1][0];
    expect(secondCallHistory).toEqual([
      { role: "user", content: "What's the weather?" },
      {
        role: "assistant",
        content: "I'll check the weather.",
        tool_calls: [toolCall],
      },
      {
        role: "tool",
        content: "Sunny with 75°F highs.",
        tool_call_id: toolCall.id,
      },
    ]);

    expect(client.history).toEqual([
      { role: "user", content: "What's the weather?" },
      {
        role: "assistant",
        content: "I'll check the weather.",
        tool_calls: [toolCall],
      },
      {
        role: "tool",
        content: "Sunny with 75°F highs.",
        tool_call_id: toolCall.id,
      },
      {
        role: "assistant",
        content: "It's sunny and 75°F.",
        tool_calls: undefined,
      },
    ]);
  });
});
