'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal';
import { LogBetModal } from '@/components/bankroll/LogBetModal';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type BankrollAccount = {
  id: string;
  user_id: string;
  label: string;
  currency: string;
  starting_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
};

type BankrollStats = {
  totalBalance: number;
  totalProfit: number;
  profitPercentage: number;
  accountCount: number;
};

export default function BankrollPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [bankrolls, setBankrolls] = useState<BankrollAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogBetModal, setShowLogBetModal] = useState(false);
  const [selectedBankrollId, setSelectedBankrollId] = useState<string | undefined>(undefined);

  const fetchBankrolls = useCallback(async () => {
    if (!userProfile?.id) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bankroll_accounts')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch bankrolls', error);
      } else {
        setBankrolls((data as BankrollAccount[]) || []);
      }
    } catch (error) {
      console.error('Error fetching bankrolls', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void fetchBankrolls();
  }, [fetchBankrolls]);

  const stats: BankrollStats = bankrolls.reduce(
    (acc, bankroll) => {
      const profit = bankroll.current_balance - bankroll.starting_balance;
      return {
        totalBalance: acc.totalBalance + bankroll.current_balance,
        totalProfit: acc.totalProfit + profit,
        profitPercentage: 0, // Will calculate after
        accountCount: acc.accountCount + 1,
      };
    },
    { totalBalance: 0, totalProfit: 0, profitPercentage: 0, accountCount: 0 }
  );

  const totalStarting = bankrolls.reduce((sum, b) => sum + b.starting_balance, 0);
  if (totalStarting > 0) {
    stats.profitPercentage = (stats.totalProfit / totalStarting) * 100;
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Bankroll Management</h3>
          <p className="mt-1 text-sm text-slate-300">
            Track your betting accounts and monitor performance across all bankrolls.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90"
        >
          + New Bankroll
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Balance</p>
          <p className="mt-2 text-2xl font-bold text-white">
            ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Profit/Loss</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {stats.totalProfit >= 0 ? '+' : ''}
            ${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">ROI</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              stats.profitPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {stats.profitPercentage >= 0 ? '+' : ''}
            {stats.profitPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Active Accounts</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.accountCount}</p>
        </div>
      </div>

      {/* Bankroll Accounts */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-black/40">
          <p className="text-sm text-slate-400">Loading bankrolls...</p>
        </div>
      ) : bankrolls.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">
          <p className="text-lg font-semibold text-white">No Bankrolls Yet</p>
          <p className="mt-2 text-sm text-slate-400">Create your first bankroll to start tracking bets</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-lg bg-brand-accent px-6 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90"
          >
            Create Bankroll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Your Bankrolls</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {bankrolls.map((bankroll) => {
              const profit = bankroll.current_balance - bankroll.starting_balance;
              const profitPercentage =
                bankroll.starting_balance > 0 ? (profit / bankroll.starting_balance) * 100 : 0;

              return (
                <div
                  key={bankroll.id}
                  className="rounded-2xl border border-white/5 bg-black/40 p-6 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-lg font-semibold text-white">{bankroll.label}</h5>
                      <p className="text-xs text-slate-400">{bankroll.currency}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Current Balance</span>
                      <span className="text-lg font-bold text-white">
                        ${bankroll.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Starting Balance</span>
                      <span className="text-sm text-slate-300">
                        ${bankroll.starting_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-sm text-slate-400">Profit/Loss</span>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}${Math.abs(profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${profit >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                          {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankrollId(bankroll.id);
                        setShowLogBetModal(true);
                      }}
                      className="flex-1 rounded-lg border border-brand-accent/40 bg-brand-accent/20 px-3 py-2 text-xs font-semibold text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30"
                    >
                      Log Bet
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                    >
                      View History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Bankroll Modal */}
      <CreateBankrollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchBankrolls}
      />

      {/* Log Bet Modal */}
      <LogBetModal
        isOpen={showLogBetModal}
        onClose={() => {
          setShowLogBetModal(false);
          setSelectedBankrollId(undefined);
        }}
        onSuccess={fetchBankrolls}
        selectedBankrollId={selectedBankrollId}
      />
    </div>
  );
}
