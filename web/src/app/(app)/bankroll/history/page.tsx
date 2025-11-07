'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type Bet = {
  id: string;
  user_id: string;
  bankroll_id: string | null;
  event_name: string;
  market: string;
  wager_amount: number;
  american_odds: number | null;
  decimal_odds: number | null;
  expected_value: number | null;
  status: 'pending' | 'won' | 'lost' | 'push' | 'void';
  settled_payout: number | null;
  notes: string | null;
  placed_at: string;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

type BankrollAccount = {
  id: string;
  label: string;
  currency: string;
};

type FilterOptions = {
  status: string;
  market: string;
  bankrollId: string;
  tag: string;
};

const BEHAVIORAL_TAG_OPTIONS = [
  { value: 'value_bet', label: 'Value Bet' },
  { value: 'research', label: 'Research-Based' },
  { value: 'sharp', label: 'Sharp Money' },
  { value: 'system', label: 'System Play' },
  { value: 'hedge', label: 'Hedge' },
  { value: 'confident', label: 'High Confidence' },
  { value: 'public_fade', label: 'Public Fade' },
  { value: 'impulse', label: 'Impulse' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'chasing_losses', label: 'Chasing Losses' },
] as const;

export default function BetHistoryPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [bets, setBets] = useState<Bet[]>([]);
  const [bankrolls, setBankrolls] = useState<BankrollAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    market: 'all',
    bankrollId: 'all',
    tag: 'all',
  });
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);

  const fetchBankrolls = useCallback(async () => {
    if (!userProfile?.id) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bankroll_accounts')
        .select('id, label, currency')
        .eq('user_id', userProfile.id)
        .order('label');

      if (error) {
        console.error('Failed to fetch bankrolls', error);
      } else {
        setBankrolls((data as BankrollAccount[]) || []);
      }
    } catch (error) {
      console.error('Error fetching bankrolls', error);
    }
  }, [userProfile, supabase]);

  const fetchBets = useCallback(async () => {
    if (!userProfile?.id) {
      return;
    }

    setLoading(true);
    try {
      // If filtering by tag, first fetch bet IDs with that tag
      let betIdsWithTag: string[] | null = null;
      if (filters.tag !== 'all') {
        const { data: tagData, error: tagError } = await supabase
          .from('bet_tags')
          .select('bet_id')
          .eq('tag', filters.tag);

        if (tagError) {
          console.error('Failed to fetch bet tags', tagError);
        } else {
          betIdsWithTag = tagData ? tagData.map((t) => t.bet_id) : [];
          // If no bets have this tag, set empty array to return no results
          if (betIdsWithTag.length === 0) {
            setBets([]);
            setLoading(false);
            return;
          }
        }
      }

      let query = supabase
        .from('bets')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('placed_at', { ascending: false });

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.market !== 'all') {
        query = query.eq('market', filters.market);
      }
      if (filters.bankrollId !== 'all') {
        query = query.eq('bankroll_id', filters.bankrollId);
      }
      if (betIdsWithTag !== null) {
        query = query.in('id', betIdsWithTag);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch bets', error);
      } else {
        setBets((data as Bet[]) || []);
      }
    } catch (error) {
      console.error('Error fetching bets', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase, filters]);

  useEffect(() => {
    void fetchBankrolls();
  }, [fetchBankrolls]);

  useEffect(() => {
    void fetchBets();
  }, [fetchBets]);

  const handleStatusUpdate = useCallback(
    async (betId: string, newStatus: Bet['status'], payout: number | null = null) => {
      if (!userProfile?.id) {
        return;
      }

      const bet = bets.find((b) => b.id === betId);
      if (!bet) {
        return;
      }

      try {
        // Update bet status
        const { error: betError } = await supabase
          .from('bets')
          .update({
            status: newStatus,
            settled_payout: payout,
            settled_at: new Date().toISOString(),
          })
          .eq('id', betId);

        if (betError) {
          console.error('Failed to update bet status', betError);
          alert('Failed to update bet status');
          return;
        }

        // Update bankroll balance if bet is settled and has a bankroll
        if (bet.bankroll_id && payout !== null) {
          const { data: bankrollData, error: fetchError } = await supabase
            .from('bankroll_accounts')
            .select('current_balance')
            .eq('id', bet.bankroll_id)
            .single();

          if (fetchError || !bankrollData) {
            console.error('Failed to fetch bankroll', fetchError);
          } else {
            const balanceChange = payout - bet.wager_amount;
            const newBalance = bankrollData.current_balance + balanceChange;

            const { error: updateError } = await supabase
              .from('bankroll_accounts')
              .update({ current_balance: newBalance })
              .eq('id', bet.bankroll_id);

            if (updateError) {
              console.error('Failed to update bankroll balance', updateError);
            }
          }
        }

        // Refresh bets
        await fetchBets();
        setSelectedBetId(null);
      } catch (error) {
        console.error('Error updating bet', error);
        alert('An error occurred while updating the bet');
      }
    },
    [userProfile, supabase, bets, fetchBets]
  );

  // Calculate analytics
  const analytics = bets.reduce(
    (acc, bet) => {
      acc.totalBets++;
      acc.totalWagered += bet.wager_amount;

      if (bet.status === 'won') {
        acc.wins++;
        acc.totalProfit += (bet.settled_payout || 0) - bet.wager_amount;
      } else if (bet.status === 'lost') {
        acc.losses++;
        acc.totalProfit -= bet.wager_amount;
      } else if (bet.status === 'push') {
        acc.pushes++;
      }

      return acc;
    },
    { totalBets: 0, wins: 0, losses: 0, pushes: 0, totalWagered: 0, totalProfit: 0 }
  );

  const settledBets = analytics.wins + analytics.losses + analytics.pushes;
  const winRate = settledBets > 0 ? (analytics.wins / settledBets) * 100 : 0;
  const roi = analytics.totalWagered > 0 ? (analytics.totalProfit / analytics.totalWagered) * 100 : 0;

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-semibold text-white">Bet History</h3>
        <p className="mt-1 text-sm text-slate-300">
          Review all your bets and update their outcomes.
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Bets</p>
          <p className="mt-1 text-xl font-bold text-white">{analytics.totalBets}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Win Rate</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{winRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">
            {analytics.wins}W - {analytics.losses}L - {analytics.pushes}P
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Profit</p>
          <p className={`mt-1 text-xl font-bold ${analytics.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {analytics.totalProfit >= 0 ? '+' : ''}${analytics.totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">ROI</p>
          <p className={`mt-1 text-xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Wagered</p>
          <p className="mt-1 text-xl font-bold text-white">${analytics.totalWagered.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-white/5 bg-black/40 p-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="push">Push</option>
            <option value="void">Void</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400">Market</label>
          <select
            value={filters.market}
            onChange={(e) => setFilters({ ...filters, market: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            <option value="all">All Markets</option>
            <option value="moneyline">Moneyline</option>
            <option value="spread">Spread</option>
            <option value="total">Total</option>
            <option value="prop">Player Prop</option>
            <option value="parlay">Parlay</option>
            <option value="futures">Futures</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400">Bankroll</label>
          <select
            value={filters.bankrollId}
            onChange={(e) => setFilters({ ...filters, bankrollId: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            <option value="all">All Bankrolls</option>
            {bankrolls.map((br) => (
              <option key={br.id} value={br.id}>
                {br.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400">Behavioral Tag</label>
          <select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            <option value="all">All Tags</option>
            {BEHAVIORAL_TAG_OPTIONS.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bet Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-black/40">
          <p className="text-sm text-slate-400">Loading bets...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">
          <p className="text-lg font-semibold text-white">No Bets Found</p>
          <p className="mt-2 text-sm text-slate-400">Start logging bets to see them here</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-black/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Market</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Wager</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Odds</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Result</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bets.map((bet) => {
                const isSelected = selectedBetId === bet.id;
                const profit = bet.settled_payout ? bet.settled_payout - bet.wager_amount : 0;

                return (
                  <tr key={bet.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{bet.event_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(bet.placed_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{bet.market}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      ${bet.wager_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {bet.american_odds ? (bet.american_odds > 0 ? `+${bet.american_odds}` : bet.american_odds) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          bet.status === 'won'
                            ? 'bg-emerald-400/20 text-emerald-400'
                            : bet.status === 'lost'
                            ? 'bg-red-400/20 text-red-400'
                            : bet.status === 'push'
                            ? 'bg-slate-400/20 text-slate-400'
                            : bet.status === 'void'
                            ? 'bg-slate-500/20 text-slate-500'
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}
                      >
                        {bet.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bet.status === 'won' ? (
                        <span className="font-semibold text-emerald-400">+${profit.toFixed(2)}</span>
                      ) : bet.status === 'lost' ? (
                        <span className="font-semibold text-red-400">-${bet.wager_amount.toFixed(2)}</span>
                      ) : bet.status === 'push' ? (
                        <span className="text-slate-400">Push</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bet.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBetId(isSelected ? null : bet.id)}
                          className="rounded-lg border border-brand-accent/40 bg-brand-accent/20 px-3 py-1 text-xs font-semibold text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30"
                        >
                          {isSelected ? 'Cancel' : 'Settle'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Settle Bet Panel */}
          {selectedBetId && (() => {
            const bet = bets.find((b) => b.id === selectedBetId);
            if (!bet) return null;

            const potentialWin = bet.decimal_odds ? bet.wager_amount * bet.decimal_odds : bet.wager_amount * 2;

            return (
              <div className="border-t border-white/10 bg-black/60 p-4">
                <p className="text-sm font-semibold text-white">Settle: {bet.event_name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(bet.id, 'won', potentialWin)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Won (+${(potentialWin - bet.wager_amount).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(bet.id, 'lost', 0)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Lost (-${bet.wager_amount.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(bet.id, 'push', bet.wager_amount)}
                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Push (Return ${bet.wager_amount.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(bet.id, 'void', bet.wager_amount)}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Void
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
