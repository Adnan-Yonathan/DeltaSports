import OpenAI from "openai";
import type { NormalizedSportsData, SportsQuery } from "../tools/sports";

export interface DeltaChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}

export type DeltaStreamEvent =
  | { type: "token"; value: string }
  | { type: "metadata"; value: Record<string, unknown> }
  | { type: "tool"; value: { id: string; name: string; args: any } }
  | { type: "end"; value: { text: string; json?: any } };

export interface DeltaStreamOptions {
  model: string;
  temperature?: number;
  sportsData?: NormalizedSportsData;
}

export interface PlannedToolCall {
  intent: SportsQuery["intent"];
  league?: string;
  market?: string;
  team?: string;
  player?: string;
}

export function planSportsTool(prompt: string): PlannedToolCall | null {
  const lowered = prompt.toLowerCase();
  if (lowered.includes("injur")) {
    return { intent: "injuries" };
  }
  if (lowered.includes("odds") || lowered.includes("moneyline")) {
    return { intent: "odds" };
  }
  if (lowered.includes("last") && lowered.includes("games")) {
    return { intent: "player_stats" };
  }
  return null;
}

export async function* streamDeltaResponse(
  messages: DeltaChatMessage[],
  options: DeltaStreamOptions,
): AsyncGenerator<DeltaStreamEvent> {
  if (process.env.DELTA_OFFLINE === "1") {
    const summary = buildOfflineSummary(messages, options.sportsData);
    for (const token of summary.split(" ")) {
      yield { type: "token", value: `${token} ` };
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    yield {
      type: "metadata",
      value: {
        citations: options.sportsData
          ? [
              {
                label: options.sportsData.source,
                url: options.sportsData.sourceUrl,
                fetchedAt: options.sportsData.fetchedAt,
              },
            ]
          : [],
      },
    };
    yield {
      type: "end",
      value: {
        text: summary,
        json: buildJsonSidecar(options.sportsData),
      },
    };
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stream = await openai.chat.completions.create({
    model: options.model,
    temperature: options.temperature,
    stream: true,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "fetchSportsData",
          description: "Retrieve normalized sports data from Delta's proxy",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
              league: { type: "string" },
              market: { type: "string" },
              team: { type: "string" },
              player: { type: "string" },
              dateRange: { type: "string" },
              sportsbook: { type: "string" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "convertOdds",
          description: "Convert odds between formats",
          parameters: {
            type: "object",
            properties: {
              value: { type: "number" },
              fromFormat: {
                type: "string",
                enum: ["american", "decimal", "fractional"],
              },
              toFormat: {
                type: "string",
                enum: ["american", "decimal", "fractional"],
              },
            },
          },
        },
      },
    ],
  });

  let accumulatedText = "";

  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;
    if (choice.delta?.content) {
      const token = choice.delta.content;
      accumulatedText += token;
      yield { type: "token", value: token };
    }
    if (choice.delta?.tool_calls?.length) {
      for (const call of choice.delta.tool_calls) {
        yield {
          type: "tool",
          value: {
            id: call.id,
            name: call.function.name,
            args: call.function.arguments,
          },
        };
      }
    }
    if (choice.finish_reason === "stop") {
      yield {
        type: "end",
        value: { text: accumulatedText },
      };
    }
  }
}

function buildOfflineSummary(
  messages: DeltaChatMessage[],
  sportsData?: NormalizedSportsData,
): string {
  const last = messages.filter((m) => m.role === "user").pop();
  const pieces = [
    "Delta summary:",
    last?.content ?? "",
  ];
  if (sportsData) {
    pieces.push(
      `Key market: ${sportsData.markets?.[0]?.name ?? "moneyline"} ${sportsData.markets?.[0]?.odds.american ?? "-"} (${sportsData.markets?.[0]?.odds.decimal ?? ""})`,
    );
    pieces.push(`Data source: ${sportsData.source}`);
  }
  pieces.push("Delta is informational only; not betting advice.");
  return pieces.join(" \n");
}

function buildJsonSidecar(data?: NormalizedSportsData) {
  if (!data) return null;
  return {
    markets: data.markets ?? [],
    injuries: data.injuries ?? [],
    events: data.events ?? [],
    fetchedAt: data.fetchedAt,
  };
}
