/**
 * The Odds API Client
 * Fetches live odds data from The Odds API
 */

import type {
  OddsAPIParams,
  OddsEvent,
  Sport,
  ProcessedOdds,
  ProcessedMarket,
  ProcessedBookmaker,
  ProcessedOutcome,
  EVAnalysis,
} from "@/lib/types/odds-api";
import { toImpliedProbability } from "@/lib/odds";

const BASE_URL = "https://api.the-odds-api.com/v4";

/**
 * Fetch available sports
 */
export async function fetchSports(apiKey: string): Promise<Sport[]> {
  const url = `${BASE_URL}/sports/?apiKey=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sports: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch odds for a specific sport
 */
export async function fetchOdds(params: OddsAPIParams): Promise<OddsEvent[]> {
  const {
    apiKey,
    sport,
    regions = "us,us2",
    markets = "h2h,spreads,totals",
    oddsFormat = "american",
    dateFormat = "iso",
    bookmakers,
  } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    apiKey,
    regions,
    markets,
    oddsFormat,
    dateFormat,
  });

  if (bookmakers) {
    queryParams.append("bookmakers", bookmakers);
  }

  const url = `${BASE_URL}/sports/${sport}/odds?${queryParams.toString()}`;

  const response = await fetch(url, {
    // Cache for 30 seconds to avoid hitting rate limits
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch odds: ${response.statusText}`);
  }

  // Log remaining requests (useful for monitoring API usage)
  const remainingRequests = response.headers.get("x-requests-remaining");
  const usedRequests = response.headers.get("x-requests-used");

  if (remainingRequests && usedRequests) {
    console.log(`[Odds API] Requests: ${usedRequests} used, ${remainingRequests} remaining`);
  }

  return response.json();
}

/**
 * Process raw odds data into UI-friendly format
 */
export function processOdds(events: OddsEvent[]): ProcessedOdds[] {
  return events.map((event) => {
    const markets: ProcessedMarket[] = [];

    // Group bookmakers by market type
    const marketTypes = ["h2h", "spreads", "totals"] as const;
    const marketTypeMap: Record<string, "moneyline" | "spread" | "total"> = {
      h2h: "moneyline",
      spreads: "spread",
      totals: "total",
    };

    for (const marketKey of marketTypes) {
      const marketType = marketTypeMap[marketKey];
      const bookmakers: ProcessedBookmaker[] = [];

      for (const bookmaker of event.bookmakers) {
        const market = bookmaker.markets.find((m) => m.key === marketKey);
        if (!market) continue;

        const outcomes: ProcessedOutcome[] = market.outcomes.map((outcome) => ({
          team: outcome.name,
          odds: outcome.price,
          point: outcome.point,
          impliedProbability: toImpliedProbability(outcome.price),
        }));

        bookmakers.push({
          name: bookmaker.key,
          displayName: bookmaker.title,
          outcomes,
          lastUpdate: new Date(market.last_update),
        });
      }

      if (bookmakers.length > 0) {
        markets.push({
          type: marketType,
          bookmakers,
        });
      }
    }

    return {
      eventId: event.id,
      sport: event.sport_key,
      sportTitle: event.sport_title,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: new Date(event.commence_time),
      markets,
    };
  });
}

/**
 * Calculate expected value (EV) by comparing odds across bookmakers
 */
export function calculateEV(processedOdds: ProcessedOdds[]): EVAnalysis[] {
  const evOpportunities: EVAnalysis[] = [];

  for (const event of processedOdds) {
    for (const market of event.markets) {
      // Group outcomes by team/selection
      const outcomesByTeam = new Map<string, Array<{ book: string; odds: number; point?: number }>>();

      for (const bookmaker of market.bookmakers) {
        for (const outcome of bookmaker.outcomes) {
          const key = outcome.point !== undefined
            ? `${outcome.team}:${outcome.point}`
            : outcome.team;

          if (!outcomesByTeam.has(key)) {
            outcomesByTeam.set(key, []);
          }

          outcomesByTeam.get(key)!.push({
            book: bookmaker.displayName,
            odds: outcome.odds,
            point: outcome.point,
          });
        }
      }

      // Calculate EV for each team/selection
      for (const [selection, oddsArray] of outcomesByTeam.entries()) {
        if (oddsArray.length < 2) continue; // Need at least 2 books to compare

        // Find best odds
        const bestOdds = Math.max(...oddsArray.map((o) => o.odds));
        const bestBook = oddsArray.find((o) => o.odds === bestOdds)!.book;

        // Calculate consensus (average) odds
        const consensusOdds = oddsArray.reduce((sum, o) => sum + o.odds, 0) / oddsArray.length;

        // Calculate EV percentage
        const bestImplied = toImpliedProbability(bestOdds);
        const consensusImplied = toImpliedProbability(consensusOdds);
        const evPercentage = ((1 / consensusImplied) - (1 / bestImplied)) * 100;

        // Check for arbitrage opportunity
        const worstOdds = Math.min(...oddsArray.map((o) => o.odds));
        const totalImplied = toImpliedProbability(bestOdds) + toImpliedProbability(worstOdds);
        const arbitrageOpportunity = totalImplied < 1;

        evOpportunities.push({
          eventId: event.eventId,
          market: market.type,
          selection,
          bestOdds,
          bestBook,
          consensusOdds,
          evPercentage,
          arbitrageOpportunity,
        });
      }
    }
  }

  // Sort by EV percentage (highest first)
  return evOpportunities.sort((a, b) => b.evPercentage - a.evPercentage);
}

/**
 * Filter EV opportunities by minimum threshold
 */
export function filterByEV(evAnalysis: EVAnalysis[], minEvPercentage: number): EVAnalysis[] {
  return evAnalysis.filter((ev) => ev.evPercentage >= minEvPercentage);
}

/**
 * Get best odds for a specific market across all bookmakers
 */
export function getBestOdds(
  processedOdds: ProcessedOdds,
  marketType: "moneyline" | "spread" | "total",
  team: string
): { book: string; odds: number; point?: number } | null {
  const market = processedOdds.markets.find((m) => m.type === marketType);
  if (!market) return null;

  let bestOdds = -Infinity;
  let bestBook = "";
  let bestPoint: number | undefined;

  for (const bookmaker of market.bookmakers) {
    const outcome = bookmaker.outcomes.find((o) => o.team === team);
    if (outcome && outcome.odds > bestOdds) {
      bestOdds = outcome.odds;
      bestBook = bookmaker.displayName;
      bestPoint = outcome.point;
    }
  }

  if (bestOdds === -Infinity) return null;

  return { book: bestBook, odds: bestOdds, point: bestPoint };
}
