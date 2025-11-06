import type {
  ComposeOverrides,
  PlannerResult,
} from "@/lib/chat/server/orchestrator";
import type { SportsDataResult } from "@/lib/sports-data";

import type { InstrumentedOpenAI } from "./instrumentation";

const SYSTEM_PROMPT = `You are DeltaSports' responsible betting co-pilot. Craft concise, hedged summaries for sports bettors.
- Never guarantee outcomes; use language such as "appears", "suggests", or "could".
- Encourage readers to verify lines and stay disciplined with bankroll management.
- Respond ONLY with valid JSON matching the schema: { "intro": string, "details": string }.
- Keep each field to at most two sentences.
- Intro should highlight the most actionable odds context and timeframe.
- Details should weave in injuries or trends and end with a responsible betting reminder.
- Reference times in Eastern Time (ET) when possible.
- Do not include markdown, newlines outside the JSON strings, or additional keys.`;

const DEFAULT_MODEL = "gpt-4o-mini";

const formatTimestamp = (iso?: string) => {
  if (!iso) {
    return "unknown";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to format timestamp", error);
    }
    return iso;
  }
};

const describeSlots = (plan: PlannerResult) => {
  const { slots } = plan;
  const parts = [
    slots.sport ? `sport=${slots.sport}` : null,
    slots.league ? `league=${slots.league}` : null,
    slots.market ? `market=${slots.market}` : null,
    slots.timeframe ? `timeframe=${slots.timeframe}` : null,
    slots.entity ? `entity=${slots.entity}` : null,
  ].filter(Boolean);

  const rationale = slots.rationale.length
    ? `Rationale: ${slots.rationale.join(" | ")}`
    : "Rationale: none.";

  return `Slots → ${parts.join(", ") || "unspecified"}. ${rationale}`;
};

const formatAmerican = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const summarizeOdds = (data?: SportsDataResult | null) => {
  if (!data?.odds?.length) {
    return ["No odds snapshot available."];
  }

  return data.odds.slice(0, 3).map((odds) => {
    const impliedPercent = (odds.impliedProbability * 100).toFixed(1);
    return `${odds.sportsbook} ${formatAmerican(odds.american)} (${odds.decimal.toFixed(2)} decimal, ${impliedPercent}% implied) • ${odds.market} • refreshed ${formatTimestamp(odds.lastUpdated)} ET`;
  });
};

const summarizeTrends = (data?: SportsDataResult | null) => {
  if (!data?.trends?.length) {
    return ["No recent trend data supplied."];
  }

  return data.trends.slice(0, 3).map((trend) => `${trend.label}: ${trend.value} (updated ${formatTimestamp(trend.updatedAt)} ET)`);
};

const summarizeInjuries = (data?: SportsDataResult | null) => {
  if (!data?.injuries?.length) {
    return ["No injuries reported in the latest wire."];
  }

  return data.injuries.slice(0, 3).map(
    (injury) =>
      `${injury.player} – ${injury.status} (${injury.note}, checked ${formatTimestamp(injury.updatedAt)} ET)`
  );
};

const buildUserMessage = ({
  prompt,
  plan,
  primaryResult,
}: {
  prompt: string;
  plan: PlannerResult;
  primaryResult?: SportsDataResult | null;
}) => {
  const lines = [
    `User prompt: ${prompt}`,
    describeSlots(plan),
    `Primary odds:`,
    ...summarizeOdds(primaryResult).map((line) => `- ${line}`),
    `Performance trends:`,
    ...summarizeTrends(primaryResult).map((line) => `- ${line}`),
    `Injury notes:`,
    ...summarizeInjuries(primaryResult).map((line) => `- ${line}`),
  ];

  if (primaryResult?.generatedAt) {
    lines.push(`Dataset generated: ${formatTimestamp(primaryResult.generatedAt)} ET`);
  }

  lines.push(
    "Task: Produce intro + details in JSON. Acknowledge odds volatility and encourage bankroll discipline."
  );

  return lines.join("\n");
};

const extractResponseText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    output_text?: unknown;
    output?: unknown;
  };

  if (Array.isArray(candidate.output_text)) {
    const text = candidate.output_text.filter((value): value is string => typeof value === "string").join("\n").trim();
    if (text) {
      return text;
    }
  }

  if (Array.isArray((candidate as { output?: unknown[] }).output)) {
    for (const block of (candidate as { output?: unknown[] }).output ?? []) {
      if (!block || typeof block !== "object") {
        continue;
      }

      const content = (block as { content?: unknown }).content;
      if (!Array.isArray(content)) {
        continue;
      }

      for (const fragment of content) {
        if (!fragment || typeof fragment !== "object") {
          continue;
        }

        const value =
          typeof (fragment as { text?: { value?: string } }).text?.value === "string"
            ? (fragment as { text: { value: string } }).text.value
            : typeof (fragment as { value?: string }).value === "string"
              ? (fragment as { value: string }).value
              : undefined;

        if (value?.trim()) {
          return value.trim();
        }
      }
    }
  }

  return null;
};

const parseOverrides = (raw: string): ComposeOverrides | null => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const intro = typeof (parsed as { intro?: unknown }).intro === "string"
      ? (parsed as { intro: string }).intro.trim()
      : undefined;
    const details = typeof (parsed as { details?: unknown }).details === "string"
      ? (parsed as { details: string }).details.trim()
      : undefined;

    if (!intro && !details) {
      return null;
    }

    return {
      intro,
      details,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to parse LLM narrative payload", error);
    }
    return null;
  }
};

export type NarrativeGenerationResult =
  | {
      status: "generated";
      overrides: ComposeOverrides;
      metadata: {
        model?: string;
        promptTokens?: number;
        responseTokens?: number;
        totalTokens?: number;
        durationMs: number;
      };
    }
  | {
      status: "skipped";
      reason: "missing-client" | "missing-method" | "empty-response" | "invalid-payload" | "request-error";
      errorMessage?: string;
    };

export const maybeGenerateNarrative = async (
  openai: InstrumentedOpenAI | null,
  {
    prompt,
    plan,
    primaryResult,
  }: {
    prompt: string;
    plan: PlannerResult;
    primaryResult?: SportsDataResult | null;
  },
  { model = DEFAULT_MODEL, debug = process.env.NODE_ENV === "development" }: { model?: string; debug?: boolean } = {}
): Promise<NarrativeGenerationResult> => {
  if (!openai) {
    return { status: "skipped", reason: "missing-client" };
  }

  const creator = openai.responses?.create;
  if (typeof creator !== "function") {
    return { status: "skipped", reason: "missing-method" };
  }

  const startedAt = Date.now();

  try {
    const response = await creator({
      model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage({ prompt, plan, primaryResult }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "DeltaSportsNarrative",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              intro: { type: "string" },
              details: { type: "string" },
            },
            required: ["intro", "details"],
          },
        },
      },
    });

    const durationMs = Date.now() - startedAt;
    const text = extractResponseText(response);

    if (!text) {
      return { status: "skipped", reason: "empty-response" };
    }

    const overrides = parseOverrides(text);
    if (!overrides) {
      return { status: "skipped", reason: "invalid-payload" };
    }

    const usage = (response as { usage?: Record<string, unknown> }).usage ?? {};
    const promptTokens =
      typeof (usage as { prompt_tokens?: number }).prompt_tokens === "number"
        ? (usage as { prompt_tokens: number }).prompt_tokens
        : typeof (usage as { input_tokens?: number }).input_tokens === "number"
          ? (usage as { input_tokens: number }).input_tokens
          : undefined;
    const responseTokens =
      typeof (usage as { completion_tokens?: number }).completion_tokens === "number"
        ? (usage as { completion_tokens: number }).completion_tokens
        : typeof (usage as { output_tokens?: number }).output_tokens === "number"
          ? (usage as { output_tokens: number }).output_tokens
          : undefined;
    const totalTokens =
      typeof (usage as { total_tokens?: number }).total_tokens === "number"
        ? (usage as { total_tokens: number }).total_tokens
        : typeof promptTokens === "number" && typeof responseTokens === "number"
          ? promptTokens + responseTokens
          : undefined;

    const metadata = {
      model: typeof (response as { model?: string }).model === "string" ? (response as { model: string }).model : model,
      promptTokens,
      responseTokens,
      totalTokens,
      durationMs,
    };

    return { status: "generated", overrides, metadata };
  } catch (error) {
    if (debug) {
      console.warn("LLM narrative generation failed", error);
    }
    return {
      status: "skipped",
      reason: "request-error",
      errorMessage: error instanceof Error ? error.message : undefined,
    };
  }
};
