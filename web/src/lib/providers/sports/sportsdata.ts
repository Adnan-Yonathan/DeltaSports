import type { AxiosInstance } from "axios";

import type {
  InjuryRequest,
  InjuryResult,
  OddsRequest,
  OddsResult,
  SportsProvider,
  StatsRequest,
  StatsResult,
} from "./index";

const toMoneyline = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toSeries = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return entry;
      }
      if (typeof entry === "string") {
        const parsed = Number(entry);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })
    .filter((entry): entry is number => entry !== null);
};

const toInjuries = (value: unknown): InjuryResult["list"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const player = typeof record.player === "string" ? record.player : undefined;
      const status = typeof record.status === "string" ? record.status : undefined;
      const impact = typeof record.impact === "string" ? record.impact : undefined;
      if (!player || !status) {
        return null;
      }
      return { player, status, impact };
    })
    .filter((entry): entry is { player: string; status: string; impact?: string } => Boolean(entry));
};

export const createSportsdataProvider = (
  client: AxiosInstance,
  logger: import("pino").Logger
): SportsProvider => ({
  name: "sportsdata",
  async getOdds(request: OddsRequest) {
    try {
      const params: Record<string, string> = { market: request.market };
      if (request.gameId) params.gameId = request.gameId;
      if (request.teams) {
        params.home = request.teams.home;
        params.away = request.teams.away;
      }
      if (request.sportsbook) params.sportsbook = request.sportsbook;

      const response = await client.get("/odds", { params });
      const data = response.data as Record<string, unknown>;
      const gameId = typeof data.gameId === "string" ? data.gameId : request.gameId ?? "unknown";
      const moneyline = data.moneyline && typeof data.moneyline === "object" ? data.moneyline : {};
      const implied = data.implied && typeof data.implied === "object" ? data.implied : {};

      return {
        gameId,
        market: request.market,
        moneyline: {
          home: toMoneyline((moneyline as Record<string, unknown>).home),
          away: toMoneyline((moneyline as Record<string, unknown>).away),
        },
        implied: {
          home: toMoneyline((implied as Record<string, unknown>).home),
          away: toMoneyline((implied as Record<string, unknown>).away),
        },
        fetchedAt: new Date().toISOString(),
        provider: "sportsdata",
        endpoint: "GET /odds",
        ids: [gameId],
      } satisfies OddsResult;
    } catch (error) {
      logger.error({ err: error, tool: "getOdds" }, "Sportsdata getOdds failed");
      return null;
    }
  },

  async getStats(request: StatsRequest) {
    try {
      const response = await client.get("/player-stats", {
        params: {
          id: request.player.id,
          name: request.player.name,
          stat: request.stat,
          lastNGames: request.range.lastNGames,
          since: request.range.since,
        },
      });
      const data = response.data as Record<string, unknown>;
      const playerId = typeof data.playerId === "string" ? data.playerId : request.player.id ?? "unknown";
      const series = toSeries(data.series);
      const average = typeof data.average === "number" ? data.average : series.length
        ? Number((series.reduce((sum, value) => sum + value, 0) / series.length).toFixed(2))
        : 0;

      return {
        playerId,
        playerName: typeof data.playerName === "string" ? data.playerName : request.player.name,
        stat: request.stat,
        series,
        average,
        fetchedAt: new Date().toISOString(),
        provider: "sportsdata",
        endpoint: "GET /player-stats",
        ids: [playerId],
      } satisfies StatsResult;
    } catch (error) {
      logger.error({ err: error, tool: "getStats" }, "Sportsdata getStats failed");
      return null;
    }
  },

  async getInjuries(request: InjuryRequest) {
    try {
      const response = await client.get("/injuries", {
        params: { team: request.team, gameId: request.gameId },
      });
      const data = response.data as Record<string, unknown>;
      const team = typeof data.team === "string" ? data.team : request.team ?? "unknown";
      return {
        team,
        list: toInjuries(data.list),
        fetchedAt: new Date().toISOString(),
        provider: "sportsdata",
        endpoint: "GET /injuries",
        ids: [team],
      } satisfies InjuryResult;
    } catch (error) {
      logger.error({ err: error, tool: "getInjuries" }, "Sportsdata getInjuries failed");
      return null;
    }
  },
});
