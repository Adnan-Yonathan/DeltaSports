'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type UserStats = {
  totalBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  pushes: number;
  pendingBets: number;
  winRate: number;
  roi: number;
  totalWagered: number;
  totalProfit: number;
  avgWager: number;
  totalBankrolls: number;
  totalBankrollBalance: number;
  accountAge: number; // days
  recentActivity: Array<{
    date: string;
    type: string;
    description: string;
  }>;
};

export default function ProfilePage() {
  const { session, userProfile, refreshUserProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    preferred_timezone: '',
    favorite_sports: [] as string[],
    bankroll_goal: 0,
  });

  const calculateUserStats = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all bets
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('status, wager_amount, settled_payout, placed_at')
        .eq('user_id', userProfile.id);

      if (betsError) {
        console.error('Failed to fetch bets', betsError);
        setLoading(false);
        return;
      }

      const bets = betsData || [];

      // Fetch bankrolls
      const { data: bankrollsData, error: bankrollsError } = await supabase
        .from('bankroll_accounts')
        .select('current_balance')
        .eq('user_id', userProfile.id);

      if (bankrollsError) {
        console.error('Failed to fetch bankrolls', bankrollsError);
      }

      const bankrolls = bankrollsData || [];

      // Calculate statistics
      const settledBets = bets.filter((b) => ['won', 'lost', 'push'].includes(b.status));
      const wins = bets.filter((b) => b.status === 'won').length;
      const losses = bets.filter((b) => b.status === 'lost').length;
      const pushes = bets.filter((b) => b.status === 'push').length;
      const pendingBets = bets.filter((b) => b.status === 'pending').length;

      const totalWagered = bets.reduce((sum, b) => sum + b.wager_amount, 0);
      let totalProfit = 0;

      bets.forEach((b) => {
        if (b.status === 'won' && b.settled_payout) {
          totalProfit += b.settled_payout - b.wager_amount;
        } else if (b.status === 'lost') {
          totalProfit -= b.wager_amount;
        }
      });

      const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;
      const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
      const avgWager = bets.length > 0 ? totalWagered / bets.length : 0;

      const totalBankrollBalance = bankrolls.reduce((sum, b) => sum + b.current_balance, 0);

      // Calculate account age
      const createdDate = new Date(userProfile.created_at);
      const now = new Date();
      const accountAge = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      // Recent activity (last 5 bets)
      const recentBets = bets
        .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())
        .slice(0, 5);

      const recentActivity = recentBets.map((bet) => ({
        date: new Date(bet.placed_at).toLocaleDateString(),
        type: 'bet',
        description: `${bet.status.charAt(0).toUpperCase() + bet.status.slice(1)} - $${bet.wager_amount.toFixed(2)}`,
      }));

      setStats({
        totalBets: bets.length,
        settledBets: settledBets.length,
        wins,
        losses,
        pushes,
        pendingBets,
        winRate,
        roi,
        totalWagered,
        totalProfit,
        avgWager,
        totalBankrolls: bankrolls.length,
        totalBankrollBalance,
        accountAge,
        recentActivity,
      });
    } catch (error) {
      console.error('Error calculating stats', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, supabase]);

  useEffect(() => {
    void calculateUserStats();
  }, [calculateUserStats]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        preferred_timezone: userProfile.preferred_timezone,
        favorite_sports: userProfile.favorite_sports || [],
        bankroll_goal: userProfile.bankroll_goal || 0,
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferred_timezone: formData.preferred_timezone,
          favorite_sports: formData.favorite_sports,
          bankroll_goal: formData.bankroll_goal,
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Failed to update profile', error);
        alert('Failed to update profile');
      } else {
        await refreshUserProfile();
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile', error);
      alert('An error occurred while updating profile');
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-semibold text-white">My Profile</h3>
        <p className="mt-1 text-sm text-slate-300">
          Manage your account settings and view your performance analytics
        </p>
      </div>

      {/* Account Information */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Account Information</h4>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-brand-accent/40 bg-brand-accent/20 px-4 py-2 text-sm font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-lg border border-brand-accent/40 bg-brand-accent/20 px-4 py-2 text-sm font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/30"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">Email</label>
            <p className="mt-1 text-sm text-white">{session?.user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Member Since
            </label>
            <p className="mt-1 text-sm text-white">
              {new Date(userProfile.created_at).toLocaleDateString()} ({stats?.accountAge} days ago)
            </p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Timezone
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.preferred_timezone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, preferred_timezone: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
            ) : (
              <p className="mt-1 text-sm text-white">{userProfile.preferred_timezone}</p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400">
              Bankroll Goal
            </label>
            {editing ? (
              <input
                type="number"
                value={formData.bankroll_goal}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bankroll_goal: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
            ) : (
              <p className="mt-1 text-sm text-white">
                ${userProfile.bankroll_goal?.toFixed(2) || '0.00'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
        <h4 className="mb-4 text-lg font-semibold text-white">Performance Overview</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Bets</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats?.totalBets}</p>
            <p className="mt-1 text-xs text-slate-500">
              {stats?.settledBets} settled, {stats?.pendingBets} pending
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Win Rate</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {stats?.winRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats?.wins}W - {stats?.losses}L - {stats?.pushes}P
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Profit</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                (stats?.totalProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {(stats?.totalProfit ?? 0) >= 0 ? '+' : ''}${stats?.totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">ROI</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                (stats?.roi ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {(stats?.roi ?? 0) >= 0 ? '+' : ''}
              {stats?.roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Bankroll Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
          <h4 className="mb-4 text-lg font-semibold text-white">Bankroll Summary</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Accounts</span>
              <span className="text-sm font-medium text-white">{stats?.totalBankrolls}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Balance</span>
              <span className="text-sm font-medium text-white">
                ${stats?.totalBankrollBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Wagered</span>
              <span className="text-sm font-medium text-white">
                ${stats?.totalWagered.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Avg. Wager</span>
              <span className="text-sm font-medium text-white">
                ${stats?.avgWager.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
          <h4 className="mb-4 text-lg font-semibold text-white">Recent Activity</h4>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-white/5 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-slate-400">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
