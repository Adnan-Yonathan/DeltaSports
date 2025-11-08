/**
 * TypeScript types for The Odds API
 * Documentation: https://the-odds-api.com/liveapi/guides/v4/
 */

// Sports list response
export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

// Market outcomes
export interface Outcome {
  name: string;
  price: number; // American odds (e.g., -110, +150)
  point?: number; // For spreads/totals
}

// Market data
export interface Market {
  key: string; // e.g., "h2h", "spreads", "totals"
  last_update: string; // ISO 8601 timestamp
  outcomes: Outcome[];
}

// Bookmaker data
export interface Bookmaker {
  key: string; // e.g., "fanduel", "draftkings"
  title: string; // Display name
  last_update: string;
  markets: Market[];
}

// Event (game) data
export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO 8601 timestamp
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

// API request parameters
export interface OddsAPIParams {
  apiKey: string;
  sport: string; // Sport key (e.g., "basketball_nba")
  regions?: string; // Comma-separated (e.g., "us,us2")
  markets?: string; // Comma-separated (e.g., "h2h,spreads,totals")
  oddsFormat?: "american" | "decimal";
  dateFormat?: "iso" | "unix";
  bookmakers?: string; // Comma-separated (e.g., "fanduel,draftkings")
}

// Processed odds for UI consumption
export interface ProcessedOdds {
  eventId: string;
  sport: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
  markets: ProcessedMarket[];
}

export interface ProcessedMarket {
  type: "moneyline" | "spread" | "total";
  bookmakers: ProcessedBookmaker[];
}

export interface ProcessedBookmaker {
  name: string;
  displayName: string;
  outcomes: ProcessedOutcome[];
  lastUpdate: Date;
}

export interface ProcessedOutcome {
  team: string;
  odds: number; // American odds
  point?: number; // Spread or total line
  impliedProbability: number;
  evPercentage?: number; // Expected value vs consensus
}

// EV calculation helpers
export interface EVAnalysis {
  eventId: string;
  market: string;
  selection: string;
  bestOdds: number;
  bestBook: string;
  consensusOdds: number;
  evPercentage: number;
  arbitrageOpportunity: boolean;
}

// Error response from API
export interface OddsAPIError {
  success: false;
  message: string;
}
