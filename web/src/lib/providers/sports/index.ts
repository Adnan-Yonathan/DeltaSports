import type { AxiosInstance } from "axios";
import axios from "axios";

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

export const createHttpClient = (): AxiosInstance => {
  const env = getServerEnv();
  return axios.create({
    baseURL: env.sportsApiBase,
    headers: {
      Authorization: env.sportsApiKey ? `Bearer ${env.sportsApiKey}` : undefined,
    },
    timeout: 8000,
  });
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
