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
  placed_at: string;
};

type BetTag = {
  tag: string;
  bet_id: string;
};

type Nudge = {
  id: string;
  type: 'warning' | 'tip' | 'celebration';
  title: string;
  message: string;
  action?: string;
  actionHref?: string;
};

export function SmartNudges() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

  const analyzeAndGenerateNudges = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch recent bets (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('id, status, wager_amount, settled_payout, market, placed_at')
        .eq('user_id', userProfile.id)
        .gte('placed_at', thirtyDaysAgo.toISOString())
        .order('placed_at', { ascending: false });

      if (betsError) {
        console.error('Failed to fetch bets for nudges', betsError);
        setLoading(false);
        return;
      }

      const bets = (betsData as Bet[]) || [];

      // Fetch bet tags
      const betIds = bets.map((b) => b.id);
      let betTags: BetTag[] = [];
      if (betIds.length > 0) {
        const { data: tagsData } = await supabase
          .from('bet_tags')
          .select('tag, bet_id')
          .in('bet_id', betIds);
        betTags = (tagsData as BetTag[]) || [];
      }

      const generatedNudges: Nudge[] = [];

      // Analysis 1: Check for negative behavioral patterns
      const negativeTags = betTags.filter((t) => ['tilt', 'impulse', 'chasing_losses'].includes(t.tag));
      if (negativeTags.length >= 3) {
        const uniqueBets = new Set(negativeTags.map((t) => t.bet_id)).size;
        generatedNudges.push({
          id: 'negative-patterns',
          type: 'warning',
          title: 'Negative Pattern Detected',
          message: `You've logged ${uniqueBets} bet${uniqueBets !== 1 ? 's' : ''} with emotional tags (tilt, impulse, chasing losses) in the last 30 days. Consider taking a break or reviewing your bet sizing strategy.`,
          action: 'Review Patterns',
          actionHref: '/bankroll/history?tag=tilt',
        });
      }

      // Analysis 2: Check for losing streaks
      const recentSettled = bets.filter((b) => ['won', 'lost'].includes(b.status)).slice(0, 10);
      if (recentSettled.length >= 5) {
        const lastFive = recentSettled.slice(0, 5);
        const losses = lastFive.filter((b) => b.status === 'lost').length;
        if (losses >= 4) {
          generatedNudges.push({
            id: 'losing-streak',
            type: 'warning',
            title: 'Rough Stretch',
            message: `You've lost ${losses} of your last 5 bets. Consider reducing your unit size by 25-50% until you find your rhythm again.`,
            action: 'View History',
            actionHref: '/bankroll/history',
          });
        }
      }

      // Analysis 3: Check unit sizing consistency
      const avgWager = bets.reduce((sum, b) => sum + b.wager_amount, 0) / bets.length;
      const largeWagers = bets.filter((b) => b.wager_amount > avgWager * 2);
      if (largeWagers.length >= 3) {
        generatedNudges.push({
          id: 'unit-sizing',
          type: 'tip',
          title: 'Unit Sizing Alert',
          message: `You've placed ${largeWagers.length} bets over 2x your average unit size. Consistent unit sizing is key to long-term bankroll management.`,
          action: 'Review Bets',
          actionHref: '/bankroll/history',
        });
      }

      // Analysis 4: Check parlay dependency
      const parlays = bets.filter((b) => b.market === 'parlay');
      if (parlays.length > bets.length * 0.3 && bets.length >= 10) {
        const parlayWins = parlays.filter((b) => b.status === 'won').length;
        const parlayRate = parlays.length > 0 ? (parlayWins / parlays.length) * 100 : 0;
        generatedNudges.push({
          id: 'parlay-dependency',
          type: 'tip',
          title: 'Parlay Frequency',
          message: `${((parlays.length / bets.length) * 100).toFixed(0)}% of your bets are parlays with a ${parlayRate.toFixed(0)}% win rate. Single bets often offer better long-term value.`,
          action: 'Review Performance',
          actionHref: '/bankroll/history?market=parlay',
        });
      }

      // Analysis 5: Positive reinforcement for good patterns
      const valueBetTags = betTags.filter((t) => t.tag === 'value_bet');
      if (valueBetTags.length >= 5) {
        const valueBetIds = new Set(valueBetTags.map((t) => t.bet_id));
        const valueBets = bets.filter((b) => valueBetIds.has(b.id) && ['won', 'lost'].includes(b.status));
        const valueWins = valueBets.filter((b) => b.status === 'won').length;
        const valueWinRate = valueBets.length > 0 ? (valueWins / valueBets.length) * 100 : 0;

        if (valueWinRate > 50) {
          generatedNudges.push({
            id: 'value-betting-success',
            type: 'celebration',
            title: 'Sharp Betting',
            message: `Your value bets are hitting at ${valueWinRate.toFixed(0)}%. Keep identifying market inefficiencies and betting with discipline.`,
            action: 'View Value Bets',
            actionHref: '/bankroll/history?tag=value_bet',
          });
        }
      }

      // Analysis 6: Winning streak encouragement
      if (recentSettled.length >= 5) {
        const lastFive = recentSettled.slice(0, 5);
        const wins = lastFive.filter((b) => b.status === 'won').length;
        if (wins >= 4) {
          generatedNudges.push({
            id: 'winning-streak',
            type: 'celebration',
            title: 'Hot Streak',
            message: `You've won ${wins} of your last 5 bets! Stay disciplined—don't increase unit sizes during hot streaks.`,
          });
        }
      }

      // Analysis 7: ROI performance
      const settledBets = bets.filter((b) => ['won', 'lost'].includes(b.status));
      if (settledBets.length >= 10) {
        const totalWagered = settledBets.reduce((sum, b) => sum + b.wager_amount, 0);
        let totalProfit = 0;
        settledBets.forEach((b) => {
          if (b.status === 'won' && b.settled_payout) {
            totalProfit += b.settled_payout - b.wager_amount;
          } else if (b.status === 'lost') {
            totalProfit -= b.wager_amount;
          }
        });
        const roi = (totalProfit / totalWagered) * 100;

        if (roi > 5) {
          generatedNudges.push({
            id: 'positive-roi',
            type: 'celebration',
            title: 'Profitable Period',
            message: `You're up ${roi.toFixed(1)}% ROI over your last ${settledBets.length} settled bets. This puts you ahead of most recreational bettors.`,
          });
        } else if (roi < -10) {
          generatedNudges.push({
            id: 'negative-roi',
            type: 'warning',
            title: 'Tough Stretch',
            message: `You're down ${Math.abs(roi).toFixed(1)}% ROI over your last ${settledBets.length} bets. Consider reviewing your strategy or taking a break.`,
            action: 'View Behavioral Insights',
            actionHref: '/bankroll',
          });
        }
      }

      setNudges(generatedNudges.slice(0, 3)); // Show top 3 nudges
    } catch (error) {
      console.error('Error generating nudges', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void analyzeAndGenerateNudges();
  }, [analyzeAndGenerateNudges]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
        <div className="flex h-20 items-center justify-center">
          <p className="text-sm text-slate-400">Analyzing your betting patterns...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || nudges.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
        <div className="flex h-20 items-center justify-center">
          <p className="text-sm text-slate-400">Keep logging bets to receive personalized insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
      <header>
        <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
        <p className="text-xs text-slate-300">
          AI-powered nudges based on your betting behavior
        </p>
      </header>

      <div className="space-y-3">
        {nudges.map((nudge) => (
          <div
            key={nudge.id}
            className={`rounded-xl border p-4 ${
              nudge.type === 'warning'
                ? 'border-red-500/40 bg-red-500/10'
                : nudge.type === 'celebration'
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-blue-500/40 bg-blue-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${
                  nudge.type === 'warning'
                    ? 'bg-red-500/20'
                    : nudge.type === 'celebration'
                    ? 'bg-emerald-500/20'
                    : 'bg-blue-500/20'
                }`}
              >
                {nudge.type === 'warning' && (
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {nudge.type === 'celebration' && (
                  <svg
                    className="h-5 w-5 text-emerald-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {nudge.type === 'tip' && (
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    nudge.type === 'warning'
                      ? 'text-red-200'
                      : nudge.type === 'celebration'
                      ? 'text-emerald-200'
                      : 'text-blue-200'
                  }`}
                >
                  {nudge.title}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    nudge.type === 'warning'
                      ? 'text-red-300'
                      : nudge.type === 'celebration'
                      ? 'text-emerald-300'
                      : 'text-blue-300'
                  }`}
                >
                  {nudge.message}
                </p>
                {nudge.action && nudge.actionHref && (
                  <a
                    href={nudge.actionHref}
                    className={`mt-2 inline-block text-xs font-semibold underline ${
                      nudge.type === 'warning'
                        ? 'text-red-200 hover:text-red-100'
                        : nudge.type === 'celebration'
                        ? 'text-emerald-200 hover:text-emerald-100'
                        : 'text-blue-200 hover:text-blue-100'
                    }`}
                  >
                    {nudge.action} →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
