/**
 * Analytics Dashboard Page
 * Comprehensive performance overview and insights
 */

"use client";

import { QuickStats } from "@/components/analytics/QuickStats";
import { ROITimeline } from "@/components/analytics/ROITimeline";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";
import { TopOpportunities } from "@/components/analytics/TopOpportunities";
import type { ROIDataPoint, ActivityItem, TopOpportunity } from "@/lib/types/analytics";

export default function AnalyticsPage() {
  // Mock data for development (will be replaced with real API data)
  const currency = "USD";

  // Quick Stats Data
  const quickStatsData = {
    totalProfit: 250,
    totalBets: 24,
    overallROI: 25.0,
    overallWinRate: 0.571,
    activeBets: 3,
    activeAlerts: 2,
    profitTrend: "up" as const,
    profitChange: 15.2,
    roiTrend: "up" as const,
    roiChange: 8.5,
  };

  // ROI Timeline Data (last 30 days)
  const roiTimelineData: ROIDataPoint[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString(),
      roi: Math.random() * 20 - 5, // Random ROI between -5% and 15%
      profit: Math.random() * 100 - 20,
      bets: Math.floor(Math.random() * 5),
    };
  });

  // Activity Feed Data
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

  // Performance by Sport
  const sportPerformanceData = [
    {
      label: "NBA",
      roi: 15.0,
      profit: 180,
      bets: 12,
      winRate: 0.667,
    },
    {
      label: "NFL",
      roi: 6.25,
      profit: 50,
      bets: 8,
      winRate: 0.5,
    },
    {
      label: "MLB",
      roi: 5.0,
      profit: 20,
      bets: 4,
      winRate: 0.5,
    },
  ];

  // Performance by Market
  const marketPerformanceData = [
    {
      label: "Moneyline",
      roi: 15.0,
      profit: 150,
      bets: 10,
      winRate: 0.7,
    },
    {
      label: "Spread",
      roi: 7.5,
      profit: 60,
      bets: 8,
      winRate: 0.5,
    },
    {
      label: "Over/Under",
      roi: 6.67,
      profit: 40,
      bets: 6,
      winRate: 0.5,
    },
  ];

  // Top Opportunities
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive performance insights and trends
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats {...quickStatsData} currency={currency} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ROI Timeline */}
            <ROITimeline data={roiTimelineData} currency={currency} />

            {/* Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PerformanceChart
                data={sportPerformanceData}
                title="Performance by Sport"
                subtitle="ROI breakdown across different sports"
                currency={currency}
              />
              <PerformanceChart
                data={marketPerformanceData}
                title="Performance by Market"
                subtitle="ROI breakdown by bet type"
                currency={currency}
              />
            </div>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Top Opportunities */}
            <TopOpportunities opportunities={topOpportunities} />

            {/* Activity Feed */}
            <ActivityFeed activities={activityData} currency={currency} />
          </div>
        </div>

        {/* Insights Section */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">
                AI-Powered Insights
              </h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>
                  • Your NBA betting is performing exceptionally well (+15% ROI) - consider increasing unit size
                </li>
                <li>
                  • Moneyline bets have your highest win rate (70%) - focus on these markets
                </li>
                <li>
                  • You&apos;re on a 3-bet winning streak - maintain discipline and stick to your strategy
                </li>
                <li>
                  • {topOpportunities.length} high-value opportunities available in Odds Scanner
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
