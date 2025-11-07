import type {
  InjuryRequest,
  InjuryResult,
  OddsRequest,
  OddsResult,
  SportsProvider,
  StatsRequest,
  StatsResult,
} from "./index";

const nowIso = () => new Date().toISOString();

const mockOdds: OddsResult = {
  gameId: "nba-20240401-nyk-bkn",
  market: "moneyline",
  moneyline: {
    home: -120,
    away: 110,
  },
  implied: {
    home: 0.545,
    away: 0.476,
  },
  fetchedAt: nowIso(),
  provider: "mock",
  endpoint: "odds",
  ids: ["nba", "nyk", "bkn"],
};

const mockStats: StatsResult = {
  playerId: "jokic-nikola",
  playerName: "Nikola Jokic",
  stat: "rebounds",
  series: [15, 13, 11, 16, 14],
  average: 13.8,
  fetchedAt: nowIso(),
  provider: "mock",
  endpoint: "player-stats",
  ids: ["den", "jokic"],
};

const mockInjuries: InjuryResult = {
  team: "nyk",
  list: [
    { player: "Julius Randle", status: "Out", impact: "High" },
    { player: "Jalen Brunson", status: "Questionable", impact: "Medium" },
  ],
  fetchedAt: nowIso(),
  provider: "mock",
  endpoint: "injuries",
  ids: ["nyk"],
};

export const createMockProvider = (): SportsProvider => ({
  name: "mock",
  async getOdds(request: OddsRequest) {
    if (request.gameId && request.gameId !== mockOdds.gameId) {
      return null;
    }

    if (request.teams) {
      const home = request.teams.home.toLowerCase();
      const away = request.teams.away.toLowerCase();
      if (!(home.includes("knick") && away.includes("net"))) {
        return null;
      }
    }

    return { ...mockOdds, fetchedAt: nowIso() };
  },
  async getStats(request: StatsRequest) {
    const name = request.player.name?.toLowerCase();
    if (name && !name.includes("jokic")) {
      return null;
    }
    return { ...mockStats, fetchedAt: nowIso() };
  },
  async getInjuries(request: InjuryRequest) {
    const team = request.team?.toLowerCase();
    if (team && !team.includes("nyk") && !team.includes("knick")) {
      return null;
    }
    return { ...mockInjuries, fetchedAt: nowIso() };
  },
});
