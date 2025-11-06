import type {
  ComposeOverrides,
  PlannerResult,
} from "@/lib/chat/server/orchestrator";
import type { SportsDataResult } from "@/lib/sports-data";

const formatTimestamp = (iso?: string | null) => {
  if (!iso) {
    return "recently";
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
    return "recently";
  }
};

const formatAmerican = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const buildIntro = (plan: PlannerResult, data: SportsDataResult | null): string => {
  const focus =
    plan.slots.entity ?? plan.slots.league?.toUpperCase() ?? plan.slots.sport ?? "this matchup";
  const timeframe = plan.slots.timeframe?.replace(/-/g, " ") ?? "the current window";
  const market = plan.slots.market ?? "moneyline";

  const primaryOdds = data?.odds?.[0];
  if (primaryOdds) {
    const impliedPercent = Math.round(primaryOdds.impliedProbability * 1000) / 10;
    return `${focus} ${market} odds for ${timeframe}: ${primaryOdds.sportsbook} lists ${formatAmerican(primaryOdds.american)} (${primaryOdds.decimal.toFixed(2)} decimal, ${impliedPercent}% implied).`;
  }

  return `${focus} ${market} outlook for ${timeframe}: no verified book price surfaced, so treat lines as provisional and check your sportsbook before wagering.`;
};

const buildDetails = (data: SportsDataResult | null): string => {
  const fragments: string[] = [];

  if (data?.trends?.length) {
    const trend = data.trends[0];
    fragments.push(
      `${trend.label} sits at ${trend.value} as of ${formatTimestamp(trend.updatedAt)} ET.`
    );
  }

  if (data?.injuries?.length) {
    const injury = data.injuries[0];
    fragments.push(
      `${injury.player} is listed as ${injury.status.toLowerCase()} (${injury.note}) from the ${formatTimestamp(
        injury.updatedAt
      )} ET report.`
    );
  }

  if (!fragments.length && data?.odds?.length) {
    const odds = data.odds[0];
    fragments.push(
      `Lines last refreshed ${formatTimestamp(odds.lastUpdated)} ET; shop around as books may move quickly.`
    );
  }

  fragments.push("Always verify lines and stick to disciplined bankroll management.");

  return fragments.join(" ");
};

export type NarrativeGenerationResult =
  | {
      status: "generated";
      overrides: ComposeOverrides;
    }
  | {
      status: "skipped";
      reason: "insufficient-data";
    };

export const maybeGenerateNarrative = async ({
  plan,
  primaryResult,
}: {
  prompt: string;
  plan: PlannerResult;
  primaryResult?: SportsDataResult | null;
}): Promise<NarrativeGenerationResult> => {
  const data = primaryResult ?? null;

  if (!data) {
    return { status: "skipped", reason: "insufficient-data" };
  }

  const intro = buildIntro(plan, data);
  const details = buildDetails(data);

  return {
    status: "generated",
    overrides: {
      intro,
      details,
    },
  };
};
