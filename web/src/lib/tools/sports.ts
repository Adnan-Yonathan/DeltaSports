import { addSeconds } from "date-fns";
import type { NextRequest } from "next/server";
import { convertAll } from "../odds/convert";

export type SportsIntent =
  | "team_stats"
  | "player_stats"
  | "odds"
  | "injuries"
  | "schedule"
  | "lines_movement"
  | "parlay_eval";

export interface SportsQuery {
  intent: SportsIntent;
  query: string;
  league?: string;
  market?: string;
  team?: string;
  player?: string;
  dateRange?: string;
  location?: string;
  sportsbook?: string;
}

export interface NormalizedOdds {
  american: number;
  decimal: number;
  fractional: string;
  impliedProb: number;
  sportsbook?: string;
}

export interface SportsData {
  source: string;
  sourceUrl?: string;
  fetchedAt: string;
  league?: string;
  teams?: string[];
  players?: string[];
  markets?: Array<{
    name: string;
    odds: NormalizedOdds;
    sampleSize?: number;
  }>;
  injuries?: Array<{
    player: string;
    status: string;
    note?: string;
  }>;
  events?: Array<{
    name: string;
    startTime: string;
    venue?: string;
  }>;
  assumptions?: string[];
}

export interface SportsResponse {
  data: SportsData;
  cacheTtl: number;
}

function buildMockResponse(query: SportsQuery): SportsData {
  const now = new Date();
  const baseOdds = convertAll(-135);
  return {
    source: "mock",
    sourceUrl: "https://example.com/mock-sports",
    fetchedAt: now.toISOString(),
    league: query.league ?? "NBA",
    teams: query.team ? [query.team] : ["New York Knicks", "Boston Celtics"],
    players: query.player ? [query.player] : ["Jalen Brunson"],
    markets: [
      {
        name: query.market ?? "moneyline",
        odds: {
          american: baseOdds.american,
          decimal: baseOdds.decimal,
          fractional: baseOdds.fractional,
          impliedProb: baseOdds.impliedProbability,
          sportsbook: query.sportsbook ?? "Mockbook",
        },
        sampleSize: 12,
      },
    ],
    injuries: [
      {
        player: "Julius Randle",
        status: "Out",
        note: "Shoulder rehab - reevaluation in 2 weeks",
      },
    ],
    events: [
      {
        name: "Knicks @ Celtics",
        startTime: addSeconds(now, 7200).toISOString(),
        venue: "TD Garden",
      },
    ],
    assumptions: [
      "Mock data used because DELTA_OFFLINE=1",
      `Query: ${query.query}`,
    ],
  };
}

async function fetchSportsProvider(query: SportsQuery): Promise<SportsResponse> {
  const offline = process.env.DELTA_OFFLINE === "1";
  if (offline) {
    return {
      data: buildMockResponse(query),
      cacheTtl: Number(process.env.DELTA_CACHE_TTL ?? 30),
    };
  }

  const providerUrl = new URL(
    process.env.SPORTS_API_BASE_URL ?? "https://api.example.com/sports",
  );
  providerUrl.searchParams.set("q", query.query);
  if (query.league) providerUrl.searchParams.set("league", query.league);
  if (query.market) providerUrl.searchParams.set("market", query.market);
  if (query.team) providerUrl.searchParams.set("team", query.team);
  if (query.player) providerUrl.searchParams.set("player", query.player);
  if (query.dateRange)
    providerUrl.searchParams.set("dateRange", query.dateRange);

  const start = performance.now();
  const response = await fetch(providerUrl.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.SPORTS_API_KEY ?? ""}`,
    },
    cache: "no-store",
  });
  const latency = performance.now() - start;

  if (!response.ok) {
    throw new Error(`Sports provider error: ${response.status}`);
  }
  const payload = await response.json();
  return normalizeProviderPayload(payload, query, latency);
}

function normalizeProviderPayload(
  payload: any,
  query: SportsQuery,
  latencyMs: number,
): SportsResponse {
  const data: SportsData = {
    source: payload.source ?? "provider",
    sourceUrl: payload.sourceUrl,
    fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
    league: payload.league ?? query.league,
    teams: payload.teams ?? payload.team ? [payload.team] : undefined,
    players: payload.players ?? payload.player ? [payload.player] : undefined,
    markets: Array.isArray(payload.markets)
      ? payload.markets.map((market: any) => ({
          name: market.name ?? query.market ?? "moneyline",
          odds: {
            american: market.odds?.american ?? -110,
            decimal: market.odds?.decimal ?? convertAll(-110).decimal,
            fractional: market.odds?.fractional ?? convertAll(-110).fractional,
            impliedProb:
              market.odds?.impliedProb ?? convertAll(-110).impliedProbability,
            sportsbook: market.odds?.sportsbook ?? query.sportsbook,
          },
          sampleSize: market.sampleSize,
        }))
      : undefined,
    injuries: payload.injuries,
    events: payload.events,
    assumptions: payload.assumptions ?? [
      `Provider latency ${latencyMs.toFixed(0)}ms`,
    ],
  };

  return {
    data,
    cacheTtl: payload.cacheTtl ?? Number(process.env.DELTA_CACHE_TTL ?? 45),
  };
}

export async function handleSportsRequest(
  req: NextRequest,
): Promise<Response> {
  const queryParam = req.nextUrl.searchParams.get("q");
  if (!queryParam) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
    });
  }

  const intent = (req.nextUrl.searchParams.get("intent") ?? "odds") as SportsIntent;

  const query: SportsQuery = {
    intent,
    query: queryParam,
    league: req.nextUrl.searchParams.get("league") ?? undefined,
    market: req.nextUrl.searchParams.get("market") ?? undefined,
    team: req.nextUrl.searchParams.get("team") ?? undefined,
    player: req.nextUrl.searchParams.get("player") ?? undefined,
    dateRange: req.nextUrl.searchParams.get("dateRange") ?? undefined,
    location: req.nextUrl.searchParams.get("location") ?? undefined,
    sportsbook: req.nextUrl.searchParams.get("sportsbook") ?? undefined,
  };

  const response = await fetchSportsProvider(query);
  const ttl = response.cacheTtl;
  const headers: Record<string, string> = {
    "Cache-Control": `public, max-age=${ttl}`,
    ETag: `W/\"${Buffer.from(JSON.stringify(response.data)).toString("base64")}\"`,
  };

  return new Response(JSON.stringify(response), {
    headers,
  });
}

export type { SportsData as NormalizedSportsData };

export async function fetchSportsData(query: SportsQuery) {
  return fetchSportsProvider(query);
}

export type { SportsQuery };
