/**
 * Bankroll Tracker Page
 * Main interface for bankroll management and bet tracking
 */

"use client";

import { useState } from "react";
import { BankrollCard } from "@/components/bankroll/BankrollCard";
import { QuickBetEntry } from "@/components/bankroll/QuickBetEntry";
import { PerformanceMetrics } from "@/components/bankroll/PerformanceMetrics";
import { RecentBets } from "@/components/bankroll/RecentBets";
import type { QuickBetInput, BetStatus } from "@/lib/types/bankroll";

export default function BankrollPage() {
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  // Mock data for development (will be replaced with real API data)
  const mockAccount = {
    id: "1",
    user_id: "user-1",
    label: "Main Bankroll",
    currency: "USD",
    starting_balance: 1000,
    current_balance: 1250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockMetrics = {
    totalBets: 24,
    activeBets: 3,
    settledBets: 21,
    winRate: 0.571,
    roi30d: 25.0,
    profit: 250,
    averageWager: 50,
    largestWin: 125,
    largestLoss: 50,
    currentStreak: {
      type: "win" as const,
      count: 3,
    },
  };

  const mockRecentBets = [
    {
      id: "1",
      user_id: "user-1",
      bankroll_id: "1",
      event_name: "Lakers vs Warriors",
      market: "Moneyline",
      wager_amount: 100,
      american_odds: -150,
      decimal_odds: 1.67,
      expected_value: 2.5,
      status: "won" as BetStatus,
      settled_payout: 166.67,
      notes: "Strong value on Lakers at home",
      placed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      settled_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ["sharp", "nba"],
    },
    {
      id: "2",
      user_id: "user-1",
      bankroll_id: "1",
      event_name: "Chiefs vs Bills",
      market: "Spread -3.5",
      wager_amount: 50,
      american_odds: -110,
      decimal_odds: 1.91,
      expected_value: 1.2,
      status: "pending" as BetStatus,
      settled_payout: null,
      notes: null,
      placed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      settled_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ["nfl"],
    },
    {
      id: "3",
      user_id: "user-1",
      bankroll_id: "1",
      event_name: "Celtics vs Heat",
      market: "Over 220.5",
      wager_amount: 75,
      american_odds: -105,
      decimal_odds: 1.95,
      expected_value: 0.8,
      status: "lost" as BetStatus,
      settled_payout: 0,
      notes: "Weather impacted scoring",
      placed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      settled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ["nba", "live_bet"],
    },
  ];

  const mockPerformanceBySport = [
    {
      category: "NBA",
      bets: 12,
      wins: 8,
      losses: 4,
      winRate: 0.667,
      profit: 180,
      roi: 15.0,
      avgOdds: -120,
    },
    {
      category: "NFL",
      bets: 8,
      wins: 4,
      losses: 4,
      winRate: 0.5,
      profit: 50,
      roi: 6.25,
      avgOdds: -110,
    },
    {
      category: "MLB",
      bets: 4,
      wins: 2,
      losses: 2,
      winRate: 0.5,
      profit: 20,
      roi: 5.0,
      avgOdds: +150,
    },
  ];

  const mockPerformanceByMarket = [
    {
      category: "Moneyline",
      bets: 10,
      wins: 7,
      losses: 3,
      winRate: 0.7,
      profit: 150,
      roi: 15.0,
      avgOdds: -140,
    },
    {
      category: "Spread",
      bets: 8,
      wins: 4,
      losses: 4,
      winRate: 0.5,
      profit: 60,
      roi: 7.5,
      avgOdds: -110,
    },
    {
      category: "Over/Under",
      bets: 6,
      wins: 3,
      losses: 3,
      winRate: 0.5,
      profit: 40,
      roi: 6.67,
      avgOdds: -105,
    },
  ];

  const mockTopTags = [
    { tag: "sharp", count: 8 },
    { tag: "nba", count: 12 },
    { tag: "nfl", count: 8 },
    { tag: "live_bet", count: 5 },
  ];

  const handleSubmitBet = async (bet: QuickBetInput) => {
    console.log("Submitting bet:", bet);
    // TODO: Implement API call to create bet
    // await createBet(bet);
    setShowQuickEntry(false);
  };

  const handleUpdateBet = async (betId: string, status: BetStatus, payout?: number) => {
    console.log("Updating bet:", betId, status, payout);
    // TODO: Implement API call to update bet
    // await updateBet(betId, { status, settled_payout: payout });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bankroll Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track your betting performance and manage your bankroll
            </p>
          </div>
          <button
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-semibold shadow-lg shadow-blue-500/25"
          >
            {showQuickEntry ? "Cancel" : "+ Add Bet"}
          </button>
        </div>

        {/* Quick Bet Entry (Conditional) */}
        {showQuickEntry && (
          <QuickBetEntry
            bankrollId={mockAccount.id}
            onSubmit={handleSubmitBet}
            onCancel={() => setShowQuickEntry(false)}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Bankroll Card + Performance Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <BankrollCard account={mockAccount} metrics={mockMetrics} />

            {/* Quick Stats */}
            <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Avg Wager</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    ${mockMetrics.averageWager.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">30d ROI</p>
                  <p className="text-lg font-semibold text-emerald-400 mt-1">
                    +{mockMetrics.roi30d.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Largest Win</p>
                  <p className="text-lg font-semibold text-emerald-400 mt-1">
                    +${mockMetrics.largestWin.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Largest Loss</p>
                  <p className="text-lg font-semibold text-red-400 mt-1">
                    -${mockMetrics.largestLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Bets + Performance Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <RecentBets
              bets={mockRecentBets}
              currency={mockAccount.currency}
              onUpdateBet={handleUpdateBet}
            />
            <PerformanceMetrics
              performanceBySport={mockPerformanceBySport}
              performanceByMarket={mockPerformanceByMarket}
              topTags={mockTopTags}
              currency={mockAccount.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
