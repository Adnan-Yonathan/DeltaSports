'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type BankrollAccount = {
  id: string;
  starting_balance: number;
  current_balance: number;
};

type Bet = {
  id: string;
  wager_amount: number;
  status: string;
  settled_payout: number | null;
  placed_at: string;
};

type BankrollMetrics = {
  totalBankroll: number;
  totalStarting: number;
  roi: number;
  hitRate: number;
};

export const BankrollPreview = () => {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [metrics, setMetrics] = useState<BankrollMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch bankroll data
      const { data: bankrollData, error: bankrollError } = await supabase
        .from('bankroll_accounts')
        .select('id, starting_balance, current_balance')
        .eq('user_id', userProfile.id);

      if (bankrollError) {
        console.error('Failed to fetch bankrolls', bankrollError);
        setLoading(false);
        return;
      }

      const bankrolls = (bankrollData as BankrollAccount[]) || [];
      const totalBankroll = bankrolls.reduce((sum, b) => sum + b.current_balance, 0);
      const totalStarting = bankrolls.reduce((sum, b) => sum + b.starting_balance, 0);
      const roiValue = totalStarting > 0 ? ((totalBankroll - totalStarting) / totalStarting) * 100 : 0;

      // Fetch bet data for hit rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: betData, error: betError } = await supabase
        .from('bets')
        .select('id, wager_amount, status, settled_payout, placed_at')
        .eq('user_id', userProfile.id)
        .gte('placed_at', thirtyDaysAgo.toISOString());

      if (betError) {
        console.error('Failed to fetch bets', betError);
      }

      const bets = (betData as Bet[]) || [];
      const settledBets = bets.filter((b) => ['won', 'lost', 'push'].includes(b.status));
      const wonBets = bets.filter((b) => b.status === 'won').length;
      const hitRateValue = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0;

      setMetrics({
        totalBankroll,
        totalStarting,
        roi: roiValue,
        hitRate: hitRateValue,
      });
    } catch (error) {
      console.error('Error fetching bankroll metrics', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <header>
          <h3 className="text-lg font-semibold text-white">Bankroll Intelligence</h3>
          <p className="text-xs text-slate-300">Loading your betting analytics...</p>
        </header>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !metrics) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
        <header>
          <h3 className="text-lg font-semibold text-white">Bankroll Intelligence</h3>
          <p className="text-xs text-slate-300">Track your betting performance and behavior patterns.</p>
        </header>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  const bankrollChange = metrics.totalBankroll - metrics.totalStarting;
  const bankrollChangePercent = metrics.roi;

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Bankroll Intelligence</h3>
          <p className="text-xs text-slate-300">Real-time performance analytics from your betting activity.</p>
        </div>
        <Link
          href="/bankroll"
          className="text-xs font-semibold text-brand-accent transition hover:text-brand-accent/80"
        >
          View All →
        </Link>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Bankroll</p>
          <p className="mt-2 text-xl font-semibold text-white">
            ${metrics.totalBankroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs ${bankrollChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {bankrollChange >= 0 ? '+' : ''}${Math.abs(bankrollChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">ROI (All Time)</p>
          <p className={`mt-2 text-xl font-semibold ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">
            vs starting balance
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Hit Rate (30d)</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {metrics.hitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">
            settled bets
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4">
        <div>
          <p className="text-sm font-medium text-white">Ready to track more bets?</p>
          <p className="text-xs text-slate-400">Log your latest wagers and monitor performance</p>
        </div>
        <Link
          href="/bankroll"
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90"
        >
          Manage Bankroll
        </Link>
      </div>
    </div>
  );
};
