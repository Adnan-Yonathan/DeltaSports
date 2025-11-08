/**
 * TypeScript types for Analytics Dashboard
 * Aggregates data from odds, bankroll, and alerts
 */

// Time period for analytics
export type TimePeriod = "7d" | "30d" | "90d" | "all";

// ROI data point for timeline chart
export interface ROIDataPoint {
  date: string;
  roi: number;
  profit: number;
  bets: number;
}

// Performance trend
export interface PerformanceTrend {
  period: TimePeriod;
  roi: number;
  profit: number;
  totalBets: number;
  winRate: number;
  averageOdds: number;
  trend: "up" | "down" | "stable";
}

// Activity item for feed
export interface ActivityItem {
  id: string;
  type: "bet_placed" | "bet_won" | "bet_lost" | "alert_triggered" | "ev_opportunity";
  timestamp: string;
  title: string;
  description: string;
  amount?: number;
  evPercentage?: number;
  metadata?: Record<string, unknown>;
}

// Top opportunity
export interface TopOpportunity {
  eventName: string;
  market: string;
  bookmaker: string;
  odds: number;
  evPercentage: number;
  sport: string;
}

// Analytics summary
export interface AnalyticsSummary {
  // Overall stats
  totalProfit: number;
  totalBets: number;
  overallROI: number;
  overallWinRate: number;

  // Current status
  activeBets: number;
  activeAlerts: number;
  availableOpportunities: number;

  // Trends (30 day)
  profitTrend: "up" | "down" | "stable";
  profitChange: number; // percentage
  roiTrend: "up" | "down" | "stable";
  roiChange: number; // percentage

  // Best/worst
  bestSport: {
    sport: string;
    roi: number;
    profit: number;
  } | null;
  bestMarket: {
    market: string;
    roi: number;
    profit: number;
  } | null;

  // Recent performance
  last7Days: PerformanceTrend;
  last30Days: PerformanceTrend;
  last90Days: PerformanceTrend;
  allTime: PerformanceTrend;

  // Timeline data
  roiTimeline: ROIDataPoint[];

  // Recent activity
  recentActivity: ActivityItem[];

  // Top opportunities
  topOpportunities: TopOpportunity[];
}

// API Response
export interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsSummary;
  error?: string;
}

// Helper to determine trend
export function determineTrend(current: number, previous: number): "up" | "down" | "stable" {
  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(change) < 1) return "stable";
  return change > 0 ? "up" : "down";
}

// Helper to calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
