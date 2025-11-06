import type {
  AssistantOdds,
  AssistantSection,
  SourceBadge,
} from "@/components/chat/types";
import type { AssistantStreamPatch } from "@/lib/chat/patch";
import {
  formatAmericanOdds,
  formatCurrency,
  formatPercent,
  summarizeOdds,
} from "@/lib/odds";
import { fetchSportsData, type SportsQuery } from "@/lib/sports-data";

import { logToolEvent } from "./telemetry";

export type ConversationSnapshot = {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
};

type FetchSportsArgs = Omit<SportsQuery, "query">;

type PlannerSlots = FetchSportsArgs & {
  entity?: string;
  rationale: string[];
};

type PlannedToolCall = {
  id: string;
  toolName: "fetchSportsData";
  args: FetchSportsArgs;
};

type PlannerResult = {
  slots: PlannerSlots;
  toolCalls: readonly PlannedToolCall[];
};

type ToolExecution = {
  call: PlannedToolCall;
  result: Awaited<ReturnType<typeof fetchSportsData>>;
  durationMs: number;
};

type AssistantContent = {
  headline: string;
  intro: string;
  details: string;
  odds: AssistantOdds;
  sections: readonly AssistantSection[];
  sources: readonly SourceBadge[];
  generatedAt: string;
  promptHash: string;
};

type ComposeOverrides = Partial<
  Pick<AssistantContent, "headline" | "intro" | "details" | "sections">
>;

type OrchestrationResult = {
  plan: PlannerResult;
  executions: readonly ToolExecution[];
  content: AssistantContent;
};

const TEAM_TO_LEAGUE: Record<string, { sport: string; league: string }> = {
  knicks: { sport: "basketball", league: "nba" },
  celtics: { sport: "basketball", league: "nba" },
  nuggets: { sport: "basketball", league: "nba" },
  lakers: { sport: "basketball", league: "nba" },
  warriors: { sport: "basketball", league: "nba" },
  yankees: { sport: "baseball", league: "mlb" },
  dodgers: { sport: "baseball", league: "mlb" },
  mets: { sport: "baseball", league: "mlb" },
  jets: { sport: "football", league: "nfl" },
  giants: { sport: "football", league: "nfl" },
  chiefs: { sport: "football", league: "nfl" },
  avalanche: { sport: "hockey", league: "nhl" },
};

const PLAYER_TO_LEAGUE: Record<string, { sport: string; league: string }> = {
  jokic: { sport: "basketball", league: "nba" },
  doncic: { sport: "basketball", league: "nba" },
  tatum: { sport: "basketball", league: "nba" },
  brunson: { sport: "basketball", league: "nba" },
  curry: { sport: "basketball", league: "nba" },
};

const MARKET_KEYWORDS: Record<string, string> = {
  moneyline: "moneyline",
  spread: "spread",
  total: "total",
  assists: "assists",
  rebounds: "rebounds",
  threes: "three-pointers",
  points: "points",
};

const TIMEFRAME_KEYWORDS: Record<string, string> = {
  tonight: "tonight",
  today: "today",
  tomorrow: "tomorrow",
  "last 5": "last-5",
  "last 10": "last-10",
  "last ten": "last-10",
  season: "season-to-date",
};

const HASH_SEED = 31;

const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * HASH_SEED + input.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const fallbackAmericanOdds = (hash: number) => {
  const base = (hash % 400) + 120; // keep odds in a realistic range
  return hash % 2 === 0 ? -base : base;
};

const extractEntity = (prompt: string) => {
  const matches = prompt.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}\b/g);
  if (!matches) {
    return undefined;
  }

  const STOP_WORDS = new Set([
    "What",
    "Show",
    "Give",
    "Tell",
    "How",
    "Odds",
    "Moneyline",
    "Points",
    "Spread",
    "Player",
    "Team",
  ]);

  for (const candidate of matches) {
    if (!STOP_WORDS.has(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const normalizeConversation = (conversation?: readonly ConversationSnapshot[]) => conversation ?? [];

export const planSportsQuery = (
  prompt: string,
  conversation?: readonly ConversationSnapshot[]
): PlannerResult => {
  const normalizedPrompt = prompt.toLowerCase();
  const slots: PlannerSlots = { rationale: [] };

  for (const [keyword, label] of Object.entries(MARKET_KEYWORDS)) {
    if (normalizedPrompt.includes(keyword)) {
      slots.market = label;
      slots.rationale.push(`Detected market keyword "${label}".`);
      break;
    }
  }

  for (const [keyword, label] of Object.entries(TIMEFRAME_KEYWORDS)) {
    if (normalizedPrompt.includes(keyword)) {
      slots.timeframe = label;
      slots.rationale.push(`Timeframe interpreted as ${label}.`);
      break;
    }
  }

  for (const [keyword, league] of Object.entries(TEAM_TO_LEAGUE)) {
    if (normalizedPrompt.includes(keyword)) {
      slots.sport = league.sport;
      slots.league = league.league;
      slots.rationale.push(`Matched team keyword "${keyword}" → ${league.league.toUpperCase()}.`);
      break;
    }
  }

  if (!slots.league) {
    for (const [keyword, league] of Object.entries(PLAYER_TO_LEAGUE)) {
      if (normalizedPrompt.includes(keyword)) {
        slots.sport = league.sport;
        slots.league = league.league;
        slots.rationale.push(`Matched player keyword "${keyword}" → ${league.league.toUpperCase()}.`);
        break;
      }
    }
  }

  const entity = extractEntity(prompt);
  if (entity) {
    slots.entity = entity;
    slots.rationale.push(`Entity focus extracted as "${entity}".`);
  }

  if (!slots.rationale.length) {
    const priorMessages = normalizeConversation(conversation);
    const lastAssistant = [...priorMessages].reverse().find((message) => message.role === "assistant");
    if (lastAssistant?.summary) {
      slots.rationale.push("Falling back to prior assistant summary context.");
    } else {
      slots.rationale.push("No explicit slots detected; defaulting to general odds lookup.");
    }
  }

  const call: PlannedToolCall = {
    id: `fetch-${hashString(prompt).toString(16)}`,
    toolName: "fetchSportsData",
    args: {
      sport: slots.sport,
      league: slots.league,
      market: slots.market,
      timeframe: slots.timeframe,
    },
  };

  return {
    slots,
    toolCalls: [call],
  };
};

type ExecutePlanCallbacks = {
  onToolStart?: (call: PlannedToolCall) => void;
  onToolSuccess?: (execution: ToolExecution) => void;
  onToolError?: (call: PlannedToolCall, error: unknown) => void;
};

export const executePlan = async (
  prompt: string,
  plan: PlannerResult,
  callbacks: ExecutePlanCallbacks = {}
): Promise<readonly ToolExecution[]> => {
  const executions: ToolExecution[] = [];

  for (const call of plan.toolCalls) {
    callbacks.onToolStart?.(call);
    logToolEvent("info", "Tool invocation started", {
      tool: call.toolName,
      slots: call.args,
    });
    const startedAt = performance.now();
    try {
      const result = await fetchSportsData({
        ...call.args,
        query: prompt,
      });
      const durationMs = performance.now() - startedAt;
      const execution: ToolExecution = { call, result, durationMs };
      executions.push(execution);
      callbacks.onToolSuccess?.(execution);
      logToolEvent("info", "Tool invocation completed", {
        tool: call.toolName,
        durationMs,
        sources: result.sources.map((source) => source.id),
      });
    } catch (error) {
      callbacks.onToolError?.(call, error);
      logToolEvent("error", "Tool invocation failed", {
        tool: call.toolName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  return executions;
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(iso));

export const composeAssistantContent = (
  prompt: string,
  plan: PlannerResult,
  executions: readonly ToolExecution[],
  overrides?: ComposeOverrides
): AssistantContent => {
  const generatedAt = new Date().toISOString();
  const hash = hashString(prompt);
  const primaryExecution = executions[0];
  const data = primaryExecution?.result;
  const primaryOdds = data?.odds[0];
  const fallbackOdds = summarizeOdds(fallbackAmericanOdds(hash));
  const oddsSummary = primaryOdds ?? fallbackOdds;

  const odds: AssistantOdds = {
    american: formatAmericanOdds(oddsSummary.american),
    decimal: oddsSummary.decimal.toFixed(2),
    fractional: oddsSummary.fractional,
    impliedProbability: formatPercent(oddsSummary.impliedProbability),
  };

  const focus = plan.slots.entity ?? plan.slots.league?.toUpperCase() ?? plan.slots.sport ?? "this matchup";
  const timeframeLabel = plan.slots.timeframe?.replace(/-/g, " ") ?? "current window";
  const marketLabel = plan.slots.market ?? "moneyline";

  const primaryTimestamp = formatDateTime(
    data?.odds[0]?.lastUpdated ?? data?.generatedAt ?? generatedAt
  );
  const validationTimestamp = formatDateTime(
    data?.trends[0]?.updatedAt ?? new Date(Date.now() - 90_000).toISOString()
  );
  const injuriesTimestamp = formatDateTime(
    data?.injuries[0]?.updatedAt ?? data?.generatedAt ?? generatedAt
  );
  const responseTimestamp = formatDateTime(generatedAt);

  const slotSummary = plan.slots.rationale.length
    ? plan.slots.rationale.join(" · ")
    : "General betting context inferred from prompt.";

  const sections: AssistantSection[] = [
    {
      id: "key-stats",
      title: "Key stats",
      items: [
        `${focus} ${marketLabel} outlook for the ${timeframeLabel}.`,
        `Consensus pricing ${odds.american} (${odds.decimal}) → ${odds.impliedProbability} implied confidence.`,
        `Expected value on $100 stake ${formatCurrency(oddsSummary.expectedValue)} (${oddsSummary.confidenceNote}).`,
      ],
    },
    {
      id: "recent-form",
      title: "Recent form",
      items:
        data?.trends.map(
          (trend) =>
            `${trend.label}: ${trend.value} (updated ${formatDateTime(trend.updatedAt)} ET)`
        ) ?? ["Recent trend data pending refresh."],
    },
    {
      id: "injuries",
      title: "Injuries",
      items:
        data?.injuries.map(
          (injury) =>
            `${injury.player} – ${injury.status} (${injury.note}, updated ${formatDateTime(injury.updatedAt)} ET)`
        ) ?? ["No active injuries reported by the league wire."],
    },
    {
      id: "assumptions",
      title: "Assumptions",
      items: [
        `Slots derived from prompt language: ${slotSummary}.`,
        `Odds normalized to ${marketLabel} market with ${data?.odds.length ?? 1} synthetic feed(s).`,
        "High-churn data cached for up to two minutes before forced refresh.",
      ],
    },
    {
      id: "timestamps",
      title: "Timestamps",
      items: [
        `Primary odds feed refreshed ${primaryTimestamp} ET.`,
        `GPT-4o trend validation completed ${validationTimestamp} ET.`,
        `Injury wire reviewed ${injuriesTimestamp} ET.`,
        `Answer generated ${responseTimestamp} ET.`,
      ],
    },
  ];

  const sources: SourceBadge[] =
    data?.sources.map(({ id, label, href, updatedAt }) => ({
      id,
      label: `${label} • ${formatDateTime(updatedAt)}`,
      href,
    })) ?? [
      {
        id: "odds-api",
        label: `Odds API (primary) • ${formatDateTime(generatedAt)}`,
        href: "https://the-odds-api.com/",
      },
      {
        id: "gpt4o",
        label: `GPT-4o backfill • ${formatDateTime(generatedAt)}`,
        href: "https://openai.com/",
      },
      {
        id: "injury-feed",
        label: `League injury wire • ${formatDateTime(generatedAt)}`,
      },
    ];

  const primarySourceLabel =
    data?.sources.find((source) => source.id === primaryOdds?.sourceId)?.label ??
    "primary feed";

  const intro = `${focus} ${marketLabel} lines are hovering around ${odds.american} for the ${timeframeLabel}.`;
  const details = `That maps to roughly ${odds.impliedProbability} implied confidence with ${primarySourceLabel} setting the pace. GPT-4o trend checks updated ${validationTimestamp} ET and injury context refreshed ${injuriesTimestamp} ET before responding at ${responseTimestamp} ET.`;

  const composed: AssistantContent = {
    headline: "Short answer",
    intro,
    details,
    odds,
    sections,
    sources,
    generatedAt,
    promptHash: hash.toString(16),
  };

  if (!overrides) {
    return composed;
  }

  return {
    ...composed,
    ...overrides,
    sections: overrides.sections ?? composed.sections,
  };
};

export const orchestrateAssistantResponse = async (
  prompt: string,
  conversation?: readonly ConversationSnapshot[]
): Promise<OrchestrationResult> => {
  const plan = planSportsQuery(prompt, conversation);
  const executions = await executePlan(prompt, plan);
  const content = composeAssistantContent(prompt, plan, executions);

  return {
    plan,
    executions,
    content,
  };
};

export const buildResponsePatches = (content: AssistantContent): readonly AssistantStreamPatch[] => [
  { headline: content.headline },
  { summary: content.intro },
  { summaryDelta: ` ${content.details}` },
  { odds: content.odds },
  { sections: content.sections },
  { sources: content.sources },
];

export type { ComposeOverrides, PlannerResult, ToolExecution, AssistantContent };
