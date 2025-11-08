/**
 * TypeScript types for Bankroll Tracking
 * Matches Supabase schema from sql-prompts.md
 */

// Bet status enum (matches database type)
export type BetStatus = "pending" | "won" | "lost" | "push" | "void";

// Bankroll Account
export interface BankrollAccount {
  id: string;
  user_id: string;
  label: string;
  currency: string;
  starting_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

// Individual Bet
export interface Bet {
  id: string;
  user_id: string;
  bankroll_id: string | null;
  event_name: string;
  market: string;
  wager_amount: number;
  american_odds: number | null;
  decimal_odds: number | null;
  expected_value: number | null;
  status: BetStatus;
  settled_payout: number | null;
  notes: string | null;
  placed_at: string;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Bet with tags included
export interface BetWithTags extends Bet {
  tags: string[];
}

// Bet Tag
export interface BetTag {
  bet_id: string;
  tag: string;
  tagged_at: string;
}

// Common bet tags
export const BET_TAGS = {
  TILT: "tilt",
  CHASE: "chase",
  SHARP: "sharp",
  LINE_SHOPPER: "line_shopper",
  LIVE: "live_bet",
  PARLAY: "parlay",
  HEDGE: "hedge",
} as const;

// Bankroll metrics (calculated from bets)
export interface BankrollMetrics {
  totalBets: number;
  activeBets: number;
  settledBets: number;
  winRate: number; // 0-1 (e.g., 0.58 = 58%)
  roi30d: number; // ROI over last 30 days
  profit: number; // Total profit/loss
  averageWager: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: {
    type: "win" | "loss" | "none";
    count: number;
  };
}

// Performance by category
export interface PerformanceByCategory {
  category: string; // Sport, market, or tag
  bets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  roi: number;
  avgOdds: number;
}

// Quick bet entry form data
export interface QuickBetInput {
  bankroll_id?: string;
  event_name: string;
  market: string;
  wager_amount: number;
  odds: number; // American odds
  notes?: string;
}

// NLP parsed bet (from natural language)
export interface ParsedBet {
  wager_amount: number;
  event_name: string;
  market: string;
  odds: number;
  confidence: number; // 0-1
}

// Bankroll dashboard summary
export interface BankrollSummary {
  account: BankrollAccount;
  metrics: BankrollMetrics;
  recentBets: BetWithTags[];
  performanceBySport: PerformanceByCategory[];
  performanceByMarket: PerformanceByCategory[];
  topTags: Array<{ tag: string; count: number }>;
}

// Bet creation request
export interface CreateBetRequest {
  user_id: string;
  bankroll_id: string;
  event_name: string;
  market: string;
  wager_amount: number;
  american_odds?: number;
  decimal_odds?: number;
  expected_value?: number;
  notes?: string;
  tags?: string[];
}

// Bet update request
export interface UpdateBetRequest {
  status?: BetStatus;
  settled_payout?: number;
  settled_at?: string;
  notes?: string;
}

// API responses
export interface BankrollResponse {
  success: boolean;
  data?: BankrollSummary;
  error?: string;
}

export interface BetsResponse {
  success: boolean;
  data?: BetWithTags[];
  error?: string;
}

export interface CreateBetResponse {
  success: boolean;
  data?: Bet;
  error?: string;
}
