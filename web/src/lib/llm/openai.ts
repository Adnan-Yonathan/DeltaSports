import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { MessageRole } from "@prisma/client";

export type IntentType =
  | "team_stats"
  | "player_stats"
  | "odds"
  | "injuries"
  | "schedule"
  | "lines_movement"
  | "parlay_eval";

export type Intent = {
  type: IntentType;
  league?: string;
  team?: string;
  player?: string;
  market?: string;
  timeframe?: string;
};

export function inferIntent(prompt: string): Intent {
  const lower = prompt.toLowerCase();
  if (lower.includes("injury")) {
    return { type: "injuries" };
  }
  if (lower.includes("line move") || lower.includes("movement")) {
    return { type: "lines_movement" };
  }
  if (lower.includes("schedule") || lower.includes("when do")) {
    return { type: "schedule" };
  }
  if (lower.includes("parlay")) {
    return { type: "parlay_eval" };
  }
  if (lower.includes("odds") || lower.includes("moneyline") || lower.includes("spread")) {
    return { type: "odds" };
  }
  if (lower.includes("game") || lower.includes("team")) {
    return { type: "team_stats" };
  }
  return { type: "player_stats" };
}

type StreamCallbacks = {
  onToken: (token: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
  onDone?: (payload: { usage?: { promptTokens?: number; completionTokens?: number } }) => void;
};

type StreamParams = {
  messages: Array<{ role: MessageRole | "tool" | "assistant" | "user" | "system"; content: string }>;
  model: string;
  temperature: number;
  tools?: ChatCompletionTool[];
  signal?: AbortSignal;
} & StreamCallbacks;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY || process.env.DELTA_OFFLINE === "1") {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function streamOpenAIChat(params: StreamParams) {
  const client = getOpenAIClient();

  if (!client) {
    const fallback =
      "Delta offline mode: Mock response summarizing requested sports intel. Data is illustrative only.";
    for (const token of fallback.split(" ")) {
      params.onToken(`${token} `);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    params.onDone?.({ usage: { completionTokens: fallback.length } });
    return;
  }

  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: params.temperature,
    stream: true,
    messages: params.messages.map((message) => ({
      role: message.role as ChatCompletionMessageParam["role"],
      content: message.content,
    })),
    tools: params.tools,
    stream_options: { include_usage: true },
  });

  for await (const chunk of completion) {
    const [choice] = chunk.choices;
    if (!choice) continue;
    const { delta, finish_reason: finishReason } = choice;
    if (delta?.content) {
      params.onToken(delta.content);
    }
    if (delta?.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        if (toolCall.function?.name && toolCall.function.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            params.onToolCall?.(toolCall.function.name, parsed);
          } catch (err) {
            params.onToolCall?.(toolCall.function.name, { raw: toolCall.function.arguments });
          }
        }
      }
    }
    if (finishReason && chunk.usage) {
      params.onDone?.({ usage: chunk.usage });
    }
  }
}

export function buildSystemPrompt() {
  return `You are Delta, an analytical assistant for responsible sports betting decisions.
- Cite every data source and include fetched timestamps.
- Provide concise answer, key stats, odds table (american, decimal, fractional, implied probability).
- Add assumptions and note sportsbook availability limitations.
- Include responsible betting reminder and never guarantee outcomes.`;
}
