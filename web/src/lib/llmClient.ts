import { getServerEnv } from "@/lib/env";
import {
  callInjuriesTool,
  callOddsTool,
  callStatsTool,
  toTrace as defaultToTrace,
  type DeltaToolPayload,
  type ToolExecutionTrace,
} from "@/lib/tools/sportsTools";
import type { OddsRequest } from "@/lib/providers/sports";

type ChatCompletionToolCall = {
  id: string;
  function?: { name: string; arguments?: string };
};

export type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_calls?: ChatCompletionToolCall[];
  tool_call_id?: string;
};

type ChatCompletionsClient = {
  chat: {
    completions: {
      create: (args: {
        model: string;
        temperature: number;
        max_tokens: number;
        messages: ChatCompletionMessageParam[];
        tools: typeof tools;
        tool_choice: "auto";
      }) => Promise<{
        choices: Array<{
          message: {
            content?: string | null;
            tool_calls?: Array<{
              id: string;
              function?: { name: string; arguments?: string };
            }>;
          };
        }>;
      }>;
    };
  };
};

type CreateCompletionArgs = Parameters<ChatCompletionsClient["chat"]["completions"]["create"]>[0];

let cachedClient: ChatCompletionsClient | null = null;

const getDefaultClient = (): ChatCompletionsClient => {
  if (!cachedClient) {
    const env = getServerEnv();
    const baseUrl = env.openAiBaseUrl.endsWith("/") ? env.openAiBaseUrl.slice(0, -1) : env.openAiBaseUrl;
    const endpoint = `${baseUrl}/chat/completions`;

    cachedClient = {
      chat: {
        completions: {
          async create(args: CreateCompletionArgs) {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.openAiApiKey}`,
              },
              body: JSON.stringify({
                model: args.model,
                temperature: args.temperature,
                max_tokens: args.max_tokens,
                messages: args.messages,
                tools: args.tools,
                tool_choice: args.tool_choice,
              }),
            });

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`OpenAI request failed with status ${response.status}: ${text}`);
            }

            const payload = (await response.json()) as {
              choices: Array<{
                message: {
                  content?: string | null;
                  tool_calls?: ChatCompletionToolCall[];
                };
              }>;
            };

            return payload;
          },
        },
      },
    };
  }

  return cachedClient;
};

type ToolOverrides = {
  callOddsTool?: typeof callOddsTool;
  callStatsTool?: typeof callStatsTool;
  callInjuriesTool?: typeof callInjuriesTool;
  toTrace?: typeof defaultToTrace;
};

export type RunConversationOptions = {
  client?: ChatCompletionsClient;
  tools?: ToolOverrides;
};

type OddsWidget = {
  kind: "odds";
  gameId: string;
  moneyline?: { home?: number; away?: number };
  implied?: { home?: number; away?: number };
};

type PlayerFormWidget = {
  kind: "playerForm";
  playerId: string;
  stat: string;
  points: number[];
  summary: string;
};

type LineMovementWidget = {
  kind: "lineMovement";
  gameId: string;
  series: Array<{ t: number; value: number }>;
  notable?: string[];
};

type InjuriesWidget = {
  kind: "injuries";
  team: string;
  list: Array<{ player: string; status: string; impact?: string }>;
};

type DeltaWidget = OddsWidget | PlayerFormWidget | LineMovementWidget | InjuriesWidget;

type DeltaSource = {
  provider: string;
  endpoint: string;
  ids: string[];
  fetchedAt: string;
};

export type DeltaAnswer = {
  answer: string;
  widgets?: DeltaWidget[];
  sources: DeltaSource[];
  confidence: number;
  caveats?: string[];
};

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length === value.length ? strings : null;
};

const parseOddsWidget = (value: unknown): OddsWidget | null => {
  if (!isObject(value) || value.kind !== "odds") {
    return null;
  }
  const gameId = asString(value.gameId);
  if (!gameId) {
    return null;
  }

  const parseLine = (lineValue: unknown) => {
    if (!isObject(lineValue)) {
      return undefined;
    }
    const home = lineValue.home !== undefined ? asNumber(lineValue.home) ?? undefined : undefined;
    const away = lineValue.away !== undefined ? asNumber(lineValue.away) ?? undefined : undefined;
    return home === undefined && away === undefined ? undefined : { home, away };
  };

  return {
    kind: "odds",
    gameId,
    moneyline: parseLine(value.moneyline),
    implied: parseLine(value.implied),
  };
};

const parsePlayerFormWidget = (value: unknown): PlayerFormWidget | null => {
  if (!isObject(value) || value.kind !== "playerForm") {
    return null;
  }
  const playerId = asString(value.playerId);
  const stat = asString(value.stat);
  const summary = asString(value.summary);
  const points = Array.isArray(value.points)
    ? value.points.map((point) => asNumber(point) ?? 0)
    : null;

  if (!playerId || !stat || !summary || !points) {
    return null;
  }

  return {
    kind: "playerForm",
    playerId,
    stat,
    points,
    summary,
  };
};

const parseLineMovementWidget = (value: unknown): LineMovementWidget | null => {
  if (!isObject(value) || value.kind !== "lineMovement") {
    return null;
  }
  const gameId = asString(value.gameId);
  const series = Array.isArray(value.series)
    ? value.series
        .map((entry) =>
          isObject(entry)
            ? { t: asNumber(entry.t) ?? NaN, value: asNumber(entry.value) ?? NaN }
            : { t: NaN, value: NaN }
        )
        .filter((entry) => Number.isFinite(entry.t) && Number.isFinite(entry.value))
    : null;

  if (!gameId || !series || series.length === 0) {
    return null;
  }

  const notable = Array.isArray(value.notable)
    ? value.notable.filter((item): item is string => typeof item === "string")
    : undefined;

  return {
    kind: "lineMovement",
    gameId,
    series,
    notable: notable && notable.length > 0 ? notable : undefined,
  };
};

const parseInjuriesWidget = (value: unknown): InjuriesWidget | null => {
  if (!isObject(value) || value.kind !== "injuries") {
    return null;
  }
  const team = asString(value.team);
  const list = Array.isArray(value.list)
    ? value.list.reduce<Array<{ player: string; status: string; impact?: string }>>((acc, entry) => {
        if (!isObject(entry)) {
          return acc;
        }
        const player = asString(entry.player);
        const status = asString(entry.status);
        if (!player || !status) {
          return acc;
        }
        const impact = entry.impact !== undefined && typeof entry.impact === "string" ? entry.impact : undefined;
        acc.push({ player, status, impact });
        return acc;
      }, [])
    : null;

  if (!team || !list) {
    return null;
  }

  return {
    kind: "injuries",
    team,
    list,
  };
};

const parseWidget = (value: unknown): DeltaWidget | null => {
  if (!isObject(value) || typeof value.kind !== "string") {
    return null;
  }

  switch (value.kind) {
    case "odds":
      return parseOddsWidget(value);
    case "playerForm":
      return parsePlayerFormWidget(value);
    case "lineMovement":
      return parseLineMovementWidget(value);
    case "injuries":
      return parseInjuriesWidget(value);
    default:
      return null;
  }
};

const parseDeltaAnswer = (value: unknown): DeltaAnswer => {
  if (!isObject(value)) {
    throw new Error("Delta answer must be an object");
  }

  const answer = asString(value.answer);
  if (!answer) {
    throw new Error("Answer text missing");
  }

  const confidence = asNumber(value.confidence);
  if (confidence === null || confidence < 0 || confidence > 1) {
    throw new Error("Confidence must be between 0 and 1");
  }

  const widgets = Array.isArray(value.widgets)
    ? value.widgets
        .map((widget) => parseWidget(widget))
        .filter((widget): widget is DeltaWidget => widget !== null)
    : undefined;

  const sources = Array.isArray(value.sources)
    ? value.sources
        .map((source) => {
          if (!isObject(source)) {
            return null;
          }
          const provider = asString(source.provider);
          const endpoint = asString(source.endpoint);
          const ids = asStringArray(source.ids);
          const fetchedAt = asString(source.fetchedAt);
          if (!provider || !endpoint || !ids || ids.length === 0 || !fetchedAt) {
            return null;
          }
          return { provider, endpoint, ids, fetchedAt };
        })
        .filter((source): source is DeltaSource => source !== null)
    : null;

  if (!sources || sources.length === 0) {
    throw new Error("Sources are required");
  }

  const caveats = Array.isArray(value.caveats)
    ? value.caveats.filter((item): item is string => typeof item === "string")
    : undefined;

  return {
    answer,
    widgets: widgets && widgets.length > 0 ? widgets : undefined,
    sources,
    confidence,
    caveats: caveats && caveats.length > 0 ? caveats : undefined,
  };
};

export const deltaAnswerValidator = {
  safeParse(value: unknown): SafeParseResult<DeltaAnswer> {
    try {
      const data = parseDeltaAnswer(value);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Invalid delta answer") };
    }
  },
};

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

export async function runDeltaConversation(
  prompt: string,
  options?: RunConversationOptions
): Promise<{ answer: DeltaAnswer; trace: ToolCallTrace[]; tools: DeltaToolPayload[] }> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ];

  const trace: ToolCallTrace[] = [];
  const toolPayloads: DeltaToolPayload[] = [];

  const env = getServerEnv();
  const activeClient = options?.client ?? getDefaultClient();
  const activeCallOdds = options?.tools?.callOddsTool ?? callOddsTool;
  const activeCallStats = options?.tools?.callStatsTool ?? callStatsTool;
  const activeCallInjuries = options?.tools?.callInjuriesTool ?? callInjuriesTool;
  const activeToTrace = options?.tools?.toTrace ?? defaultToTrace;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const completion = await activeClient.chat.completions.create({
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

            const sanitizedTeams =
              teamsArg && teamsArg.home && teamsArg.away ? { home: teamsArg.home, away: teamsArg.away } : undefined;

            const market =
              typeof args.market === "string" &&
              ["moneyline", "spread", "total", "player_prop"].includes(args.market)
                ? (args.market as "moneyline" | "spread" | "total" | "player_prop")
                : "moneyline";

            const sanitized: OddsRequest = {
              market,
              ...(typeof args.gameId === "string" ? { gameId: args.gameId } : {}),
              ...(typeof args.sportsbook === "string" ? { sportsbook: args.sportsbook } : {}),
              ...(sanitizedTeams ? { teams: sanitizedTeams } : {}),
            };

            const result = await activeCallOdds(sanitized);
            payload = { name: "getOdds", args: sanitized, result };
            trace.push({ ...activeToTrace("getOdds", result), args: sanitized as Record<string, unknown> });
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
            const result = await activeCallStats(sanitized);
            payload = { name: "getStats", args: sanitized, result };
            trace.push({ ...activeToTrace("getStats", result), args: sanitized as Record<string, unknown> });
            break;
          }
          case "getInjuries": {
            const sanitized = {
              team: typeof args.team === "string" ? args.team : undefined,
              gameId: typeof args.gameId === "string" ? args.gameId : undefined,
            } as const;
            const result = await activeCallInjuries(sanitized);
            payload = { name: "getInjuries", args: sanitized, result };
            trace.push({ ...activeToTrace("getInjuries", result), args: sanitized as Record<string, unknown> });
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
}
