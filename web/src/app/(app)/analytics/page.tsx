'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type Bet = {
  id: string;
  status: string;
  wager_amount: number;
  settled_payout: number | null;
  market: string;
  american_odds: number | null;
  placed_at: string;
};

type Analytics = {
  totalBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  totalWagered: number;
  totalProfit: number;
  avgWager: number;
  avgOdds: number;
  unitConsistency: number;
  profitFactor: number;
  sharpeRatio: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  marketBreakdown: Array<{
    market: string;
    bets: number;
    winRate: number;
    roi: number;
    profit: number;
  }>;
  oddsRangePerformance: Array<{
    range: string;
    bets: number;
    winRate: number;
    roi: number;
  }>;
  weekdayPerformance: Array<{
    day: string;
    bets: number;
    winRate: number;
    profit: number;
  }>;
};

export default function AnalyticsPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateAnalytics = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: betsData, error } = await supabase
        .from('bets')
        .select('id, status, wager_amount, settled_payout, market, american_odds, placed_at')
        .eq('user_id', userProfile.id)
        .order('placed_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch bets for analytics', error);
        setLoading(false);
        return;
      }

      const bets = (betsData as Bet[]) || [];

      if (bets.length === 0) {
        setLoading(false);
        return;
      }

      const settledBets = bets.filter((b) => ['won', 'lost', 'push'].includes(b.status));
      const wins = bets.filter((b) => b.status === 'won').length;
      const losses = bets.filter((b) => b.status === 'lost').length;
      const pushes = bets.filter((b) => b.status === 'push').length;

      const totalWagered = bets.reduce((sum, b) => sum + b.wager_amount, 0);
      let totalProfit = 0;
      let totalWinnings = 0;
      let totalLosses = 0;

      bets.forEach((b) => {
        if (b.status === 'won' && b.settled_payout) {
          const profit = b.settled_payout - b.wager_amount;
          totalProfit += profit;
          totalWinnings += profit;
        } else if (b.status === 'lost') {
          totalProfit -= b.wager_amount;
          totalLosses += b.wager_amount;
        }
      });

      const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;
      const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
      const avgWager = bets.length > 0 ? totalWagered / bets.length : 0;

      // Average odds
      const oddsSum = bets.reduce((sum, b) => sum + (b.american_odds || 0), 0);
      const avgOdds = bets.length > 0 ? oddsSum / bets.length : 0;

      // Unit consistency (coefficient of variation)
      const wagers = bets.map((b) => b.wager_amount);
      const variance =
        wagers.reduce((sum, w) => sum + Math.pow(w - avgWager, 2), 0) / wagers.length;
      const stdDev = Math.sqrt(variance);
      const unitConsistency = avgWager > 0 ? (1 - stdDev / avgWager) * 100 : 0;

      // Profit factor
      const profitFactor = totalLosses > 0 ? totalWinnings / totalLosses : 0;

      // Sharpe ratio (simplified)
      const returns = bets
        .filter((b) => ['won', 'lost'].includes(b.status))
        .map((b) => {
          if (b.status === 'won' && b.settled_payout) {
            return ((b.settled_payout - b.wager_amount) / b.wager_amount) * 100;
          } else {
            return -100;
          }
        });
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const returnVariance =
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const returnStdDev = Math.sqrt(returnVariance);
      const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

      // Streaks
      let longestWinStreak = 0;
      let longestLoseStreak = 0;
      let currentWinStreak = 0;
      let currentLoseStreak = 0;

      bets
        .filter((b) => ['won', 'lost'].includes(b.status))
        .forEach((b) => {
          if (b.status === 'won') {
            currentWinStreak++;
            currentLoseStreak = 0;
            if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
          } else {
            currentLoseStreak++;
            currentWinStreak = 0;
            if (currentLoseStreak > longestLoseStreak) longestLoseStreak = currentLoseStreak;
          }
        });

      const currentStreak: { type: 'win' | 'loss' | 'none'; count: number } =
        currentWinStreak > 0
          ? { type: 'win', count: currentWinStreak }
          : currentLoseStreak > 0
          ? { type: 'loss', count: currentLoseStreak }
          : { type: 'none', count: 0 };

      // Market breakdown
      const marketMap = new Map<
        string,
        { bets: number; wins: number; totalWagered: number; profit: number }
      >();

      bets.forEach((b) => {
        if (!marketMap.has(b.market)) {
          marketMap.set(b.market, { bets: 0, wins: 0, totalWagered: 0, profit: 0 });
        }
        const market = marketMap.get(b.market)!;
        market.bets++;
        market.totalWagered += b.wager_amount;

        if (b.status === 'won') {
          market.wins++;
          if (b.settled_payout) market.profit += b.settled_payout - b.wager_amount;
        } else if (b.status === 'lost') {
          market.profit -= b.wager_amount;
        }
      });

      const marketBreakdown = Array.from(marketMap.entries())
        .map(([market, data]) => ({
          market,
          bets: data.bets,
          winRate: (data.wins / data.bets) * 100,
          roi: (data.profit / data.totalWagered) * 100,
          profit: data.profit,
        }))
        .sort((a, b) => b.profit - a.profit);

      // Odds range performance
      const oddsRanges = [
        { range: 'Heavy Favorite (-300+)', min: -Infinity, max: -300 },
        { range: 'Favorite (-200 to -300)', min: -300, max: -200 },
        { range: 'Slight Favorite (-110 to -199)', min: -199, max: -110 },
        { range: 'Pick Em (-109 to +109)', min: -109, max: 109 },
        { range: 'Underdog (+110 to +199)', min: 110, max: 199 },
        { range: 'Big Underdog (+200 to +399)', min: 200, max: 399 },
        { range: 'Long Shot (+400+)', min: 400, max: Infinity },
      ];

      const oddsRangePerformance = oddsRanges.map((range) => {
        const rangeBets = bets.filter(
          (b) => b.american_odds && b.american_odds >= range.min && b.american_odds <= range.max
        );
        const rangeWins = rangeBets.filter((b) => b.status === 'won').length;
        const rangeWagered = rangeBets.reduce((sum, b) => sum + b.wager_amount, 0);
        let rangeProfit = 0;
        rangeBets.forEach((b) => {
          if (b.status === 'won' && b.settled_payout) {
            rangeProfit += b.settled_payout - b.wager_amount;
          } else if (b.status === 'lost') {
            rangeProfit -= b.wager_amount;
          }
        });

        return {
          range: range.range,
          bets: rangeBets.length,
          winRate: rangeBets.length > 0 ? (rangeWins / rangeBets.length) * 100 : 0,
          roi: rangeWagered > 0 ? (rangeProfit / rangeWagered) * 100 : 0,
        };
      }).filter((r) => r.bets > 0);

      // Weekday performance
      const weekdayMap = new Map<
        string,
        { bets: number; wins: number; totalWagered: number; profit: number }
      >();
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      bets.forEach((b) => {
        const day = weekdays[new Date(b.placed_at).getDay()];
        if (!weekdayMap.has(day)) {
          weekdayMap.set(day, { bets: 0, wins: 0, totalWagered: 0, profit: 0 });
        }
        const dayData = weekdayMap.get(day)!;
        dayData.bets++;
        dayData.totalWagered += b.wager_amount;

        if (b.status === 'won') {
          dayData.wins++;
          if (b.settled_payout) dayData.profit += b.settled_payout - b.wager_amount;
        } else if (b.status === 'lost') {
          dayData.profit -= b.wager_amount;
        }
      });

      const weekdayPerformance = weekdays
        .map((day) => {
          const data = weekdayMap.get(day) || { bets: 0, wins: 0, totalWagered: 0, profit: 0 };
          return {
            day,
            bets: data.bets,
            winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
            profit: data.profit,
          };
        })
        .filter((d) => d.bets > 0);

      setAnalytics({
        totalBets: bets.length,
        settledBets: settledBets.length,
        wins,
        losses,
        pushes,
        winRate,
        roi,
        totalWagered,
        totalProfit,
        avgWager,
        avgOdds,
        unitConsistency,
        profitFactor,
        sharpeRatio,
        longestWinStreak,
        longestLoseStreak,
        currentStreak,
        marketBreakdown,
        oddsRangePerformance,
        weekdayPerformance,
      });
    } catch (error) {
      console.error('Error calculating analytics', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void calculateAnalytics();
  }, [calculateAnalytics]);

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Analyzing betting data...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg font-semibold text-white">No Data Available</p>
        <p className="mt-2 text-sm text-slate-400">Log some bets to see advanced analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-white">Advanced Analytics</h3>
        <p className="mt-1 text-sm text-slate-300">
          Deep dive into your betting performance with advanced metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Profit Factor</p>
          <p className={`mt-2 text-2xl font-bold ${analytics.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
            {analytics.profitFactor.toFixed(2)}x
          </p>
          <p className="text-xs text-slate-500">Total wins / Total losses</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Sharpe Ratio</p>
          <p className="mt-2 text-2xl font-bold text-white">{analytics.sharpeRatio.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Risk-adjusted returns</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unit Consistency</p>
          <p className="mt-2 text-2xl font-bold text-white">{analytics.unitConsistency.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Bet sizing discipline</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Avg Odds</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {analytics.avgOdds > 0 ? '+' : ''}
            {Math.round(analytics.avgOdds)}
          </p>
          <p className="text-xs text-slate-500">Average American odds</p>
        </div>
      </div>

      {/* Streaks */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="text-lg font-semibold text-white">Streak Analysis</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Longest Win Streak</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{analytics.longestWinStreak}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Longest Lose Streak</p>
            <p className="mt-2 text-2xl font-bold text-red-400">{analytics.longestLoseStreak}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current Streak</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                analytics.currentStreak.type === 'win'
                  ? 'text-emerald-400'
                  : analytics.currentStreak.type === 'loss'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            >
              {analytics.currentStreak.count > 0
                ? `${analytics.currentStreak.count} ${analytics.currentStreak.type}`
                : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Market Breakdown */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="text-lg font-semibold text-white">Market Performance</h4>
        <div className="mt-4 space-y-2">
          {analytics.marketBreakdown.map((market) => (
            <div
              key={market.market}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold capitalize text-white">{market.market}</p>
                <p className="text-xs text-slate-400">
                  {market.bets} bets • {market.winRate.toFixed(0)}% win rate
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${market.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {market.profit >= 0 ? '+' : ''}${market.profit.toFixed(2)}
                </p>
                <p className={`text-xs ${market.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {market.roi >= 0 ? '+' : ''}
                  {market.roi.toFixed(1)}% ROI
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Odds Range Performance */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="text-lg font-semibold text-white">Performance by Odds Range</h4>
        <div className="mt-4 space-y-2">
          {analytics.oddsRangePerformance.map((range) => (
            <div
              key={range.range}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{range.range}</p>
                <p className="text-xs text-slate-400">{range.bets} bets</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{range.winRate.toFixed(0)}% win rate</p>
                <p className={`text-xs ${range.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {range.roi >= 0 ? '+' : ''}
                  {range.roi.toFixed(1)}% ROI
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekday Performance */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="text-lg font-semibold text-white">Performance by Day of Week</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {analytics.weekdayPerformance.map((day) => (
            <div key={day.day} className="rounded-lg border border-white/5 bg-black/60 p-3">
              <p className="text-sm font-semibold text-white">{day.day}</p>
              <p className="mt-1 text-xs text-slate-400">
                {day.bets} bets • {day.winRate.toFixed(0)}% win rate
              </p>
              <p className={`mt-2 text-lg font-bold ${day.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {day.profit >= 0 ? '+' : ''}${day.profit.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
