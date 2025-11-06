import { summarizeOdds, type OddsComputation } from "@/lib/odds";

export type SportsDataSource = {
  id: string;
  label: string;
  href?: string;
  updatedAt: string;
};

export type SportsbookOdds = OddsComputation & {
  sportsbook: string;
  market: string;
  lastUpdated: string;
  sourceId: string;
};

export type InjuryNote = {
  player: string;
  status: string;
  note: string;
  updatedAt: string;
  sourceId: string;
};

export type PerformanceTrend = {
  label: string;
  value: string;
  updatedAt: string;
  sourceId: string;
};

export type SportsQuery = {
  query: string;
  sport?: string;
  league?: string;
  market?: string;
  timeframe?: string;
};

export type SportsDataResult = {
  query: SportsQuery;
  generatedAt: string;
  odds: readonly SportsbookOdds[];
  injuries: readonly InjuryNote[];
  trends: readonly PerformanceTrend[];
  sources: readonly SportsDataSource[];
};

type CacheEntry = {
  result: SportsDataResult;
  expiresAt: number;
};

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const cache = new Map<string, CacheEntry>();

const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const SPORTSBOOKS = [
  { id: "odds-api", label: "Odds API", href: "https://the-odds-api.com/" },
  { id: "gpt4o", label: "GPT-4o backfill", href: "https://openai.com/" },
  { id: "injury-feed", label: "League injury wire" },
] as const;

const deriveOdds = (hash: number, market: string): readonly SportsbookOdds[] => {
  return SPORTSBOOKS.map((source, index) => {
    const variance = (hash >> (index * 3)) % 70;
    const american = (hash % 2 === 0 ? 1 : -1) * (120 + variance + index * 15);
    const summary = summarizeOdds(american);
    const lastUpdated = new Date(Date.now() - index * 45_000).toISOString();

    return {
      ...summary,
      sportsbook: `${source.label} synthetic`,
      market,
      lastUpdated,
      sourceId: source.id,
    };
  });
};

const deriveInjuries = (hash: number): readonly InjuryNote[] => {
  const statusPool = ["Questionable", "Probable", "Out"];
  const notesPool = [
    "Monitoring minor ankle soreness.",
    "Limited minutes expected off the bench.",
    "Cleared from health and safety protocols.",
  ];

  return [0, 1].map((offset) => {
    const playerSeed = hash + offset * 97;
    const player = `Player ${String.fromCharCode(65 + (playerSeed % 26))}`;
    const status = statusPool[playerSeed % statusPool.length];
    const note = notesPool[playerSeed % notesPool.length];
    const updatedAt = new Date(Date.now() - offset * 30_000).toISOString();

    return {
      player,
      status,
      note,
      updatedAt,
      sourceId: "injury-feed",
    };
  });
};

const deriveTrends = (hash: number, entity?: string): readonly PerformanceTrend[] => {
  const baseline = 15 + (hash % 12);
  const rebounds = 5 + (hash % 6);
  const assists = 6 + (hash % 5);
  const label = entity ?? "Primary entity";
  const updatedAt = new Date(Date.now() - 60_000).toISOString();

  return [
    {
      label: `${label} points (last 10)`,
      value: `${baseline} PPG`,
      updatedAt,
      sourceId: "gpt4o",
    },
    {
      label: `${label} rebounds (last 10)`,
      value: `${rebounds} RPG`,
      updatedAt,
      sourceId: "gpt4o",
    },
    {
      label: `${label} assists (last 10)`,
      value: `${assists} APG`,
      updatedAt,
      sourceId: "gpt4o",
    },
  ];
};

const buildSources = (generatedAt: string): readonly SportsDataSource[] =>
  SPORTSBOOKS.map((source) => ({
    ...source,
    updatedAt: generatedAt,
  }));

export async function fetchSportsData(query: SportsQuery): Promise<SportsDataResult> {
  const cacheKey = JSON.stringify(query);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const generatedAt = new Date().toISOString();
  const hash = hashString(`${query.query}:${query.sport ?? "*"}:${query.league ?? "*"}:${query.market ?? "moneyline"}`);
  const market = query.market ?? "moneyline";

  const odds = deriveOdds(hash, market);
  const injuries = deriveInjuries(hash);
  const trends = deriveTrends(hash, query.league?.toUpperCase());
  const sources = buildSources(generatedAt);

  const result: SportsDataResult = {
    query,
    generatedAt,
    odds,
    injuries,
    trends,
    sources,
  };

  cache.set(cacheKey, {
    result,
    expiresAt: now + CACHE_TTL_MS,
  });

  return result;
}
