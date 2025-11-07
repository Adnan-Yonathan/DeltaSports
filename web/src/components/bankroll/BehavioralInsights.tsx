'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type Bet = {
  id: string;
  status: string;
  wager_amount: number;
  settled_payout: number | null;
};

type BetTag = {
  tag: string;
  bet_id: string;
};

type TagMetrics = {
  tag: string;
  label: string;
  count: number;
  wonCount: number;
  lostCount: number;
  totalWagered: number;
  totalProfit: number;
  winRate: number;
  roi: number;
  avgWager: number;
  category: 'positive' | 'neutral' | 'negative';
};

const TAG_LABELS: Record<string, { label: string; category: 'positive' | 'neutral' | 'negative' }> = {
  value_bet: { label: 'Value Bet', category: 'positive' },
  research: { label: 'Research-Based', category: 'positive' },
  sharp: { label: 'Sharp Money', category: 'positive' },
  system: { label: 'System Play', category: 'positive' },
  hedge: { label: 'Hedge', category: 'neutral' },
  confident: { label: 'High Confidence', category: 'neutral' },
  public_fade: { label: 'Public Fade', category: 'neutral' },
  impulse: { label: 'Impulse', category: 'negative' },
  tilt: { label: 'Tilt', category: 'negative' },
  chasing_losses: { label: 'Chasing Losses', category: 'negative' },
};

export function BehavioralInsights() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [tagMetrics, setTagMetrics] = useState<TagMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBehavioralData = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all bets with their tags
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('id, status, wager_amount, settled_payout')
        .eq('user_id', userProfile.id);

      if (betsError) {
        console.error('Failed to fetch bets for behavioral analysis', betsError);
        setLoading(false);
        return;
      }

      const bets = (betsData as Bet[]) || [];

      // Fetch all bet tags
      const betIds = bets.map((b) => b.id);
      if (betIds.length === 0) {
        setTagMetrics([]);
        setLoading(false);
        return;
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from('bet_tags')
        .select('tag, bet_id')
        .in('bet_id', betIds);

      if (tagsError) {
        console.error('Failed to fetch bet tags', tagsError);
        setLoading(false);
        return;
      }

      const betTags = (tagsData as BetTag[]) || [];

      // Build a map of bet_id to bet
      const betMap = new Map<string, Bet>();
      bets.forEach((bet) => {
        betMap.set(bet.id, bet);
      });

      // Build metrics per tag
      const metricsMap = new Map<string, {
        count: number;
        wonCount: number;
        lostCount: number;
        totalWagered: number;
        totalProfit: number;
        betIds: Set<string>;
      }>();

      betTags.forEach((betTag) => {
        const bet = betMap.get(betTag.bet_id);
        if (!bet) return;

        if (!metricsMap.has(betTag.tag)) {
          metricsMap.set(betTag.tag, {
            count: 0,
            wonCount: 0,
            lostCount: 0,
            totalWagered: 0,
            totalProfit: 0,
            betIds: new Set(),
          });
        }

        const metrics = metricsMap.get(betTag.tag)!;

        // Only count each bet once per tag
        if (!metrics.betIds.has(bet.id)) {
          metrics.betIds.add(bet.id);
          metrics.count++;
          metrics.totalWagered += bet.wager_amount;

          if (bet.status === 'won' && bet.settled_payout) {
            metrics.wonCount++;
            metrics.totalProfit += bet.settled_payout - bet.wager_amount;
          } else if (bet.status === 'lost') {
            metrics.lostCount++;
            metrics.totalProfit -= bet.wager_amount;
          }
        }
      });

      // Convert to array and calculate rates
      const metricsArray: TagMetrics[] = Array.from(metricsMap.entries()).map(([tag, data]) => {
        const settledCount = data.wonCount + data.lostCount;
        const winRate = settledCount > 0 ? (data.wonCount / settledCount) * 100 : 0;
        const roi = data.totalWagered > 0 ? (data.totalProfit / data.totalWagered) * 100 : 0;
        const avgWager = data.count > 0 ? data.totalWagered / data.count : 0;
        const tagInfo = TAG_LABELS[tag] || { label: tag, category: 'neutral' as const };

        return {
          tag,
          label: tagInfo.label,
          count: data.count,
          wonCount: data.wonCount,
          lostCount: data.lostCount,
          totalWagered: data.totalWagered,
          totalProfit: data.totalProfit,
          winRate,
          roi,
          avgWager,
          category: tagInfo.category,
        };
      });

      // Sort by count descending
      metricsArray.sort((a, b) => b.count - a.count);

      setTagMetrics(metricsArray);
    } catch (error) {
      console.error('Error fetching behavioral data', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void fetchBehavioralData();
  }, [fetchBehavioralData]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <header>
          <h3 className="text-lg font-semibold text-white">Behavioral Insights</h3>
          <p className="text-xs text-slate-300">Loading your betting psychology...</p>
        </header>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || tagMetrics.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <header>
          <h3 className="text-lg font-semibold text-white">Behavioral Insights</h3>
          <p className="text-xs text-slate-300">Track patterns and improve your betting psychology.</p>
        </header>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">No behavioral tags yet. Start tagging your bets!</p>
        </div>
      </div>
    );
  }

  const positivePatterns = tagMetrics.filter((m) => m.category === 'positive');
  const negativePatterns = tagMetrics.filter((m) => m.category === 'negative');
  const neutralPatterns = tagMetrics.filter((m) => m.category === 'neutral');

  const totalTaggedBets = tagMetrics.reduce((sum, m) => sum + m.count, 0);
  const avgROI = tagMetrics.reduce((sum, m) => sum + m.roi, 0) / tagMetrics.length;

  return (
    <div className="space-y-6 rounded-2xl border border-white/5 bg-black/30 p-6">
      <header>
        <h3 className="text-lg font-semibold text-white">Behavioral Insights</h3>
        <p className="text-xs text-slate-300">
          Analyze your betting psychology and identify patterns that impact performance.
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Tagged Bets</p>
          <p className="mt-2 text-xl font-semibold text-white">{totalTaggedBets}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unique Tags</p>
          <p className="mt-2 text-xl font-semibold text-white">{tagMetrics.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Avg ROI</p>
          <p
            className={`mt-2 text-xl font-semibold ${
              avgROI >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {avgROI >= 0 ? '+' : ''}
            {avgROI.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Negative Patterns Alert */}
      {negativePatterns.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/20 p-2">
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
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-200">Negative Patterns Detected</p>
              <p className="mt-1 text-xs text-red-300">
                You've logged {negativePatterns.reduce((sum, p) => sum + p.count, 0)} bets with negative behavioral tags.
                Consider reviewing these patterns:
              </p>
              <ul className="mt-2 space-y-1">
                {negativePatterns.map((pattern) => (
                  <li key={pattern.tag} className="text-xs text-red-200">
                    • {pattern.label}: {pattern.count} bet{pattern.count !== 1 ? 's' : ''} (
                    {pattern.roi >= 0 ? '+' : ''}
                    {pattern.roi.toFixed(1)}% ROI)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Performance Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Performance by Pattern</h4>
        <div className="space-y-2">
          {tagMetrics.map((metric) => {
            const settledCount = metric.wonCount + metric.lostCount;
            return (
              <div
                key={metric.tag}
                className={`rounded-xl border p-4 ${
                  metric.category === 'positive'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : metric.category === 'negative'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-white/5 bg-black/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{metric.label}</p>
                    <p className="text-xs text-slate-400">
                      {metric.count} bet{metric.count !== 1 ? 's' : ''} • $
                      {metric.avgWager.toFixed(0)} avg wager
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        metric.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {metric.roi >= 0 ? '+' : ''}
                      {metric.roi.toFixed(1)}% ROI
                    </p>
                    <p className="text-xs text-slate-400">
                      {settledCount > 0 ? `${metric.winRate.toFixed(0)}% win rate` : 'No settled bets'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    {metric.wonCount} W • {metric.lostCount} L
                  </span>
                  <span>
                    {metric.totalProfit >= 0 ? '+' : ''}$
                    {Math.abs(metric.totalProfit).toFixed(2)} profit
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {positivePatterns.length > 0 && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
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
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-200">Positive Patterns</p>
              <p className="mt-1 text-xs text-emerald-300">
                You're using disciplined betting strategies. Keep it up!
              </p>
              <ul className="mt-2 space-y-1">
                {positivePatterns.slice(0, 3).map((pattern) => (
                  <li key={pattern.tag} className="text-xs text-emerald-200">
                    • {pattern.label}: {pattern.count} bet{pattern.count !== 1 ? 's' : ''} (
                    {pattern.roi >= 0 ? '+' : ''}
                    {pattern.roi.toFixed(1)}% ROI)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
