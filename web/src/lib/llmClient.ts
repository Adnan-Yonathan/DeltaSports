import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import {
  callInjuriesTool,
  callOddsTool,
  callStatsTool,
  toTrace,
  type DeltaToolPayload,
  type ToolExecutionTrace,
} from "@/lib/tools/sportsTools";

const env = getServerEnv();
const client = new OpenAI({ apiKey: env.openAiApiKey, baseURL: env.openAiBaseUrl });

const oddsWidgetSchema = z.object({
  kind: z.literal("odds"),
  gameId: z.string(),
  moneyline: z.object({ home: z.number().optional(), away: z.number().optional() }).optional(),
  implied: z.object({ home: z.number().optional(), away: z.number().optional() }).optional(),
});

const playerFormWidgetSchema = z.object({
  kind: z.literal("playerForm"),
  playerId: z.string(),
  stat: z.string(),
  points: z.array(z.number()),
  summary: z.string(),
});

const lineMovementWidgetSchema = z.object({
  kind: z.literal("lineMovement"),
  gameId: z.string(),
  series: z.array(z.object({ t: z.number(), value: z.number() })),
  notable: z.array(z.string()).optional(),
});

const injuriesWidgetSchema = z.object({
  kind: z.literal("injuries"),
  team: z.string(),
  list: z.array(z.object({ player: z.string(), status: z.string(), impact: z.string().optional() })),
});

const widgetSchema = z.discriminatedUnion("kind", [
  oddsWidgetSchema,
  playerFormWidgetSchema,
  lineMovementWidgetSchema,
  injuriesWidgetSchema,
]);

export const deltaAnswerValidator = z.object({
  answer: z.string(),
  widgets: z.array(widgetSchema).optional(),
  sources: z.array(
    z.object({
      provider: z.string(),
      endpoint: z.string(),
      ids: z.array(z.string()),
      fetchedAt: z.string(),
    })
  ),
  confidence: z.number().min(0).max(1),
  caveats: z.array(z.string()).optional(),
});

export type DeltaAnswer = z.infer<typeof deltaAnswerValidator>;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "getOdds",
      description: "Retrieve current odds and implied probability for a given game.",
      parameters: {
        type: "object",
        properties: {
          gameId: { type: "string" },
          teams: {
            type: "object",
            properties: {
              home: { type: "string" },
              away: { type: "string" },
            },
            required: [],
          },
          market: {
            type: "string",
            enum: ["moneyline", "spread", "total", "player_prop"],
          },
          sportsbook: { type: "string" },
        },
        required: ["market"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getStats",
      description: "Get recent player statistics for grounding a response.",
      parameters: {
        type: "object",
        properties: {
          player: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: [],
          },
          stat: { type: "string" },
          range: {
            type: "object",
            properties: {
              lastNGames: { type: "number" },
              since: { type: "string" },
            },
            required: [],
          },
        },
        required: ["player", "stat", "range"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getInjuries",
      description: "Fetch injury reports for a team or game to inform answers.",
      parameters: {
        type: "object",
        properties: {
          team: { type: "string" },
          gameId: { type: "string" },
        },
        required: [],
      },
    },
  },
];

const systemMessage = `You are Delta's grounded sports assistant. Always call tools before answering. Summaries must cite sources with provider, endpoint, ids, and fetchedAt. Express uncertainty via confidence (0-1) and optional caveats. Never provide wagering guarantees; remind users to bet responsibly.`;

export type ToolCallTrace = ToolExecutionTrace & { args: Record<string, unknown> };

export const runDeltaConversation = async (
  prompt: string
): Promise<{ answer: DeltaAnswer; trace: ToolCallTrace[]; tools: DeltaToolPayload[] }> => {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ];

  const trace: ToolCallTrace[] = [];
  const toolPayloads: DeltaToolPayload[] = [];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      temperature: 0.2,
      max_tokens: 700,
      messages,
      tools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: typeof message.content === "string" ? message.content : "",
        tool_calls: message.tool_calls,
      });

      for (const toolCall of message.tool_calls) {
        if (!toolCall.function) continue;
        const args = JSON.parse(toolCall.function.arguments ?? "{}") as Record<string, unknown>;
        let payload: DeltaToolPayload | null = null;

        switch (toolCall.function.name) {
          case "getOdds": {
            const teamsArg =
              args.teams && typeof args.teams === "object"
                ? {
                    home:
                      typeof (args.teams as Record<string, unknown>).home === "string"
                        ? ((args.teams as Record<string, unknown>).home as string)
                        : undefined,
                    away:
                      typeof (args.teams as Record<string, unknown>).away === "string"
                        ? ((args.teams as Record<string, unknown>).away as string)
                        : undefined,
                  }
                : undefined;
            const sanitizedTeams = teamsArg && (teamsArg.home || teamsArg.away) ? teamsArg : undefined;
            const sanitized = {
              gameId: typeof args.gameId === "string" ? args.gameId : undefined,
              teams: sanitizedTeams,
              market:
                typeof args.market === "string" &&
                ["moneyline", "spread", "total", "player_prop"].includes(args.market)
                  ? (args.market as "moneyline" | "spread" | "total" | "player_prop")
                  : "moneyline",
              sportsbook: typeof args.sportsbook === "string" ? args.sportsbook : undefined,
            } as const;
            const result = await callOddsTool(sanitized);
            payload = { name: "getOdds", args: sanitized, result };
            trace.push({ ...toTrace("getOdds", result), args: sanitized as Record<string, unknown> });
            break;
          }
          case "getStats": {
            const playerArg =
              args.player && typeof args.player === "object"
                ? {
                    id:
                      typeof (args.player as Record<string, unknown>).id === "string"
                        ? ((args.player as Record<string, unknown>).id as string)
                        : undefined,
                    name:
                      typeof (args.player as Record<string, unknown>).name === "string"
                        ? ((args.player as Record<string, unknown>).name as string)
                        : undefined,
                  }
                : { id: undefined, name: undefined };
            const rangeArg =
              args.range && typeof args.range === "object"
                ? {
                    lastNGames:
                      typeof (args.range as Record<string, unknown>).lastNGames === "number"
                        ? ((args.range as Record<string, unknown>).lastNGames as number)
                        : undefined,
                    since:
                      typeof (args.range as Record<string, unknown>).since === "string"
                        ? ((args.range as Record<string, unknown>).since as string)
                        : undefined,
                  }
                : { lastNGames: undefined, since: undefined };
            const sanitized = {
              player: playerArg,
              stat: typeof args.stat === "string" ? args.stat : "points",
              range: rangeArg,
            } as const;
            const result = await callStatsTool(sanitized);
            payload = { name: "getStats", args: sanitized, result };
            trace.push({ ...toTrace("getStats", result), args: sanitized as Record<string, unknown> });
            break;
          }
          case "getInjuries": {
            const sanitized = {
              team: typeof args.team === "string" ? args.team : undefined,
              gameId: typeof args.gameId === "string" ? args.gameId : undefined,
            } as const;
            const result = await callInjuriesTool(sanitized);
            payload = { name: "getInjuries", args: sanitized, result };
            trace.push({ ...toTrace("getInjuries", result), args: sanitized as Record<string, unknown> });
            break;
          }
          default:
            continue;
        }

        if (payload) {
          toolPayloads.push(payload);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(payload.result.data ?? { ok: false }),
          });
        }
      }
      continue;
    }

    const content = message.content ?? "";
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch (error) {
      throw new Error(`Assistant returned non-JSON payload: ${content}`);
    }
    const parsed = deltaAnswerValidator.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Failed to parse assistant response: ${parsed.error.message}`);
    }

    return { answer: parsed.data, trace, tools: toolPayloads };
  }

  throw new Error("Assistant did not complete after tool calls");
};
