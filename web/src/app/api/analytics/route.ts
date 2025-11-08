/**
 * Analytics API Route
 * Aggregates data from bankroll, odds, and alerts for dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsSummary, ROIDataPoint, ActivityItem, TopOpportunity } from "@/lib/types/analytics";

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session
    // const session = await getServerSession();
    // const userId = session?.user?.id;

    // TODO: Aggregate data from Supabase
    // - Fetch bankroll data
    // - Fetch recent bets
    // - Fetch alerts
    // - Fetch odds opportunities
    // - Calculate performance metrics

    // Mock analytics summary for development
    const roiTimelineData: ROIDataPoint[] = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString(),
        roi: Math.random() * 20 - 5,
        profit: Math.random() * 100 - 20,
        bets: Math.floor(Math.random() * 5),
      };
    });

    const activityData: ActivityItem[] = [
      {
        id: "1",
        type: "bet_won",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        title: "Lakers vs Warriors",
        description: "Moneyline bet won",
        amount: 66.67,
      },
      {
        id: "2",
        type: "alert_triggered",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        title: "High EV Alert",
        description: "Chiefs vs Bills - Spread -3.5",
        evPercentage: 5.8,
      },
      {
        id: "3",
        type: "ev_opportunity",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        title: "New Opportunity Found",
        description: "Celtics vs Heat - Over 220.5",
        evPercentage: 7.5,
      },
      {
        id: "4",
        type: "bet_placed",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        title: "Bet Placed",
        description: "Nuggets ML $50",
        amount: -50,
      },
      {
        id: "5",
        type: "bet_lost",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        title: "Heat vs Bucks",
        description: "Spread bet lost",
        amount: -75,
      },
    ];

    const topOpportunities: TopOpportunity[] = [
      {
        eventName: "Lakers vs Warriors",
        market: "Moneyline",
        bookmaker: "DraftKings",
        odds: -150,
        evPercentage: 5.8,
        sport: "basketball_nba",
      },
      {
        eventName: "Chiefs vs Bills",
        market: "Spread -3.5",
        bookmaker: "FanDuel",
        odds: -105,
        evPercentage: 3.2,
        sport: "americanfootball_nfl",
      },
      {
        eventName: "Celtics vs Heat",
        market: "Over 220.5",
        bookmaker: "BetMGM",
        odds: -110,
        evPercentage: 7.5,
        sport: "basketball_nba",
      },
    ];

    const mockData: AnalyticsSummary = {
      // Overall stats
      totalProfit: 250,
      totalBets: 24,
      overallROI: 25.0,
      overallWinRate: 0.571,

      // Current status
      activeBets: 3,
      activeAlerts: 2,
      availableOpportunities: topOpportunities.length,

      // Trends
      profitTrend: "up",
      profitChange: 15.2,
      roiTrend: "up",
      roiChange: 8.5,

      // Best performers
      bestSport: {
        sport: "NBA",
        roi: 15.0,
        profit: 180,
      },
      bestMarket: {
        market: "Moneyline",
        roi: 15.0,
        profit: 150,
      },

      // Performance periods
      last7Days: {
        period: "7d",
        roi: 12.5,
        profit: 75,
        totalBets: 6,
        winRate: 0.667,
        averageOdds: -120,
        trend: "up",
      },
      last30Days: {
        period: "30d",
        roi: 25.0,
        profit: 250,
        totalBets: 24,
        winRate: 0.571,
        averageOdds: -115,
        trend: "up",
      },
      last90Days: {
        period: "90d",
        roi: 22.0,
        profit: 660,
        totalBets: 72,
        winRate: 0.556,
        averageOdds: -110,
        trend: "up",
      },
      allTime: {
        period: "all",
        roi: 25.0,
        profit: 250,
        totalBets: 24,
        winRate: 0.571,
        averageOdds: -115,
        trend: "stable",
      },

      // Timeline and activity
      roiTimeline: roiTimelineData,
      recentActivity: activityData,
      topOpportunities: topOpportunities,
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
