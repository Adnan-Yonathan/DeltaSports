
export type NormalizedSportsData = {
  source: string;
  fetchedAt: string;
  league?: string;
  teams?: string[];
  players?: string[];
  markets?: Array<{
    market: string;
    sportsbook?: string;
    odds: {
      american?: number;
      decimal?: number;
      fractional?: string;
      impliedProb?: number;
    };
    label?: string;
  }>;
  injuries?: Array<{ team: string; player: string; status: string; detail?: string }>;
  events?: Array<{ id: string; name: string; startTime: string; venue?: string }>;
  meta?: Record<string, unknown>;
};

type FetchSportsDataArgs = {
  query: string;
  league?: string;
  market?: string;
  team?: string;
  player?: string;
  dateRange?: string;
  location?: string;
  sportsbook?: string;
};

type SportsToolResponse = {
  data: NormalizedSportsData;
  cache: { hit: boolean; ttl: number };
};

export async function fetchSportsData(args: FetchSportsDataArgs): Promise<SportsToolResponse> {
  if (process.env.DELTA_OFFLINE === "1") {
    const now = new Date().toISOString();
    return {
      cache: { hit: false, ttl: 0 },
      data: {
        source: "mock-offline",
        fetchedAt: now,
        league: args.league,
        teams: args.team ? [args.team] : undefined,
        players: args.player ? [args.player] : undefined,
        markets: args.market
          ? [
              {
                market: args.market,
                sportsbook: args.sportsbook ?? "MockBook",
                odds: { american: -110, decimal: 1.91, fractional: "10/11", impliedProb: 0.5238 },
                label: "Mock line (offline mode)",
              },
            ]
          : undefined,
        meta: {
          query: args.query,
          offline: true,
        },
      },
    };
  }

  const params = new URLSearchParams({ q: args.query });
  if (args.league) params.set("league", args.league);
  if (args.market) params.set("market", args.market);
  if (args.team) params.set("team", args.team);
  if (args.player) params.set("player", args.player);
  if (args.dateRange) params.set("dateRange", args.dateRange);
  if (args.location) params.set("location", args.location);
  if (args.sportsbook) params.set("sportsbook", args.sportsbook);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/tools/sports?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Sports tool request failed with status ${res.status}`);
  }

  return res.json();
}
