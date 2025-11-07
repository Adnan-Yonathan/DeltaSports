import { getServerEnv } from "@/lib/env";
import { getLogger } from "@/lib/telemetry/logger";

import { createMockProvider } from "./mock";
import { createSportsdataProvider } from "./sportsdata";

export type OddsRequest = {
  gameId?: string;
  teams?: { home: string; away: string };
  market: "moneyline" | "spread" | "total" | "player_prop";
  sportsbook?: string;
};

export type OddsResult = {
  gameId: string;
  market: OddsRequest["market"];
  moneyline?: { home?: number; away?: number };
  implied?: { home?: number; away?: number };
  fetchedAt: string;
  provider: string;
  endpoint: string;
  ids: string[];
};

export type StatsRequest = {
  player: { id?: string; name?: string };
  stat: string;
  range: { lastNGames?: number; since?: string };
};

export type StatsResult = {
  playerId: string;
  playerName?: string;
  stat: string;
  series: number[];
  average: number;
  fetchedAt: string;
  provider: string;
  endpoint: string;
  ids: string[];
};

export type InjuryRequest = {
  team?: string;
  gameId?: string;
};

export type InjuryResult = {
  team: string;
  list: Array<{ player: string; status: string; impact?: string }>;
  fetchedAt: string;
  provider: string;
  endpoint: string;
  ids: string[];
};

export interface SportsProvider {
  readonly name: string;
  getOdds(request: OddsRequest): Promise<OddsResult | null>;
  getStats(request: StatsRequest): Promise<StatsResult | null>;
  getInjuries(request: InjuryRequest): Promise<InjuryResult | null>;
}

export type HttpClient = {
  get: (path: string, options?: { params?: Record<string, unknown> }) => Promise<{ data: unknown }>;
};

const buildUrl = (base: string, path: string, params?: Record<string, unknown>): string => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

export const createHttpClient = (): HttpClient => {
  const env = getServerEnv();
  const baseUrl = env.sportsApiBase;
  const headers: Record<string, string> = {};
  if (env.sportsApiKey) {
    headers.Authorization = `Bearer ${env.sportsApiKey}`;
  }

  return {
    async get(path, options) {
      const url = buildUrl(baseUrl, path, options?.params);
      const response = await fetch(url, {
        method: "GET",
        headers,
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as unknown;
      return { data };
    },
  };
};

export const createSportsProvider = (): SportsProvider => {
  const env = getServerEnv();
  const logger = getLogger();

  switch (env.sportsVendor) {
    case "sportsdata":
      return createSportsdataProvider(createHttpClient(), logger);
    case "mock":
      return createMockProvider();
    case "theodds":
    case "sportradar":
      logger.warn({ vendor: env.sportsVendor }, "Vendor not yet implemented, falling back to mock provider");
      return createMockProvider();
    default:
      logger.warn({ vendor: env.sportsVendor }, "Unknown vendor requested, falling back to mock provider");
      return createMockProvider();
  }
};
