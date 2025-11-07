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

type Report = {
  period: string;
  startDate: Date;
  endDate: Date;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  totalWagered: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  avgWager: number;
  largestWin: number;
  largestLoss: number;
  mostProfitableMarket: string;
  leastProfitableMarket: string;
  negativeTags: number;
  positiveTags: number;
};

export default function ReportsPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [weeklyReport, setWeeklyReport] = useState<Report | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const generateReport = useCallback(
    async (startDate: Date, endDate: Date, period: string): Promise<Report | null> => {
      if (!userProfile?.id) {
        return null;
      }

      try {
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select('id, status, wager_amount, settled_payout, market, placed_at')
          .eq('user_id', userProfile.id)
          .gte('placed_at', startDate.toISOString())
          .lte('placed_at', endDate.toISOString());

        if (betsError) {
          console.error('Failed to fetch bets for report', betsError);
          return null;
        }

        const bets = (betsData as Bet[]) || [];

        if (bets.length === 0) {
          return null;
        }

        // Fetch tags
        const betIds = bets.map((b) => b.id);
        const { data: tagsData } = await supabase
          .from('bet_tags')
          .select('tag, bet_id')
          .in('bet_id', betIds);

        const betTags = (tagsData as BetTag[]) || [];

        // Calculate metrics
        const settledBets = bets.filter((b) => ['won', 'lost', 'push'].includes(b.status));
        const wins = bets.filter((b) => b.status === 'won').length;
        const losses = bets.filter((b) => b.status === 'lost').length;
        const pushes = bets.filter((b) => b.status === 'push').length;

        const totalWagered = bets.reduce((sum, b) => sum + b.wager_amount, 0);
        let totalProfit = 0;
        bets.forEach((b) => {
          if (b.status === 'won' && b.settled_payout) {
            totalProfit += b.settled_payout - b.wager_amount;
          } else if (b.status === 'lost') {
            totalProfit -= b.wager_amount;
          }
        });

        const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
        const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;
        const avgWager = bets.length > 0 ? totalWagered / bets.length : 0;

        // Find largest win/loss
        let largestWin = 0;
        let largestLoss = 0;
        bets.forEach((b) => {
          if (b.status === 'won' && b.settled_payout) {
            const profit = b.settled_payout - b.wager_amount;
            if (profit > largestWin) largestWin = profit;
          } else if (b.status === 'lost') {
            if (b.wager_amount > largestLoss) largestLoss = b.wager_amount;
          }
        });

        // Market performance
        const marketPerf = new Map<string, { profit: number; count: number }>();
        bets.forEach((b) => {
          if (!marketPerf.has(b.market)) {
            marketPerf.set(b.market, { profit: 0, count: 0 });
          }
          const perf = marketPerf.get(b.market)!;
          perf.count++;

          if (b.status === 'won' && b.settled_payout) {
            perf.profit += b.settled_payout - b.wager_amount;
          } else if (b.status === 'lost') {
            perf.profit -= b.wager_amount;
          }
        });

        let mostProfitableMarket = 'N/A';
        let leastProfitableMarket = 'N/A';
        let maxProfit = -Infinity;
        let minProfit = Infinity;

        marketPerf.forEach((perf, market) => {
          if (perf.profit > maxProfit) {
            maxProfit = perf.profit;
            mostProfitableMarket = market;
          }
          if (perf.profit < minProfit) {
            minProfit = perf.profit;
            leastProfitableMarket = market;
          }
        });

        // Tag analysis
        const negativeTags = betTags.filter((t) =>
          ['tilt', 'impulse', 'chasing_losses'].includes(t.tag)
        ).length;
        const positiveTags = betTags.filter((t) =>
          ['value_bet', 'research', 'sharp', 'system'].includes(t.tag)
        ).length;

        return {
          period,
          startDate,
          endDate,
          totalBets: bets.length,
          wins,
          losses,
          pushes,
          totalWagered,
          totalProfit,
          roi,
          winRate,
          avgWager,
          largestWin,
          largestLoss,
          mostProfitableMarket,
          leastProfitableMarket,
          negativeTags,
          positiveTags,
        };
      } catch (error) {
        console.error('Error generating report', error);
        return null;
      }
    },
    [userProfile, supabase]
  );

  const fetchReports = useCallback(async () => {
    setLoading(true);

    // Weekly report (last 7 days)
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weekly = await generateReport(weekStart, weekEnd, 'Last 7 Days');
    setWeeklyReport(weekly);

    // Monthly report (last 30 days)
    const monthEnd = new Date();
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const monthly = await generateReport(monthStart, monthEnd, 'Last 30 Days');
    setMonthlyReport(monthly);

    setLoading(false);
  }, [generateReport]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const ReportCard = ({ report }: { report: Report }) => (
    <div className="space-y-6 rounded-2xl border border-white/5 bg-black/40 p-6">
      <header>
        <h3 className="text-xl font-semibold text-white">{report.period}</h3>
        <p className="text-xs text-slate-400">
          {report.startDate.toLocaleDateString()} - {report.endDate.toLocaleDateString()}
        </p>
      </header>

      {/* Performance Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Profit</p>
          <p className={`mt-2 text-2xl font-bold ${report.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {report.totalProfit >= 0 ? '+' : ''}${report.totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">ROI</p>
          <p className={`mt-2 text-2xl font-bold ${report.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {report.roi >= 0 ? '+' : ''}
            {report.roi.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Win Rate</p>
          <p className="mt-2 text-2xl font-bold text-white">{report.winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Detailed Statistics</h4>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Total Bets</span>
            <span className="font-semibold text-white">{report.totalBets}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Record</span>
            <span className="font-semibold text-white">
              {report.wins}W - {report.losses}L - {report.pushes}P
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Total Wagered</span>
            <span className="font-semibold text-white">${report.totalWagered.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Avg Wager</span>
            <span className="font-semibold text-white">${report.avgWager.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Largest Win</span>
            <span className="font-semibold text-emerald-400">+${report.largestWin.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/60 p-3">
            <span className="text-slate-400">Largest Loss</span>
            <span className="font-semibold text-red-400">-${report.largestLoss.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Market Performance */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Market Performance</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Most Profitable</p>
            <p className="mt-1 text-sm font-semibold capitalize text-emerald-300">{report.mostProfitableMarket}</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Least Profitable</p>
            <p className="mt-1 text-sm font-semibold capitalize text-red-300">{report.leastProfitableMarket}</p>
          </div>
        </div>
      </div>

      {/* Behavioral Analysis */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Behavioral Analysis</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-black/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Positive Tags</p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              {report.positiveTags} (Value, Research, Sharp, System)
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Warning Tags</p>
            <p className="mt-1 text-sm font-semibold text-red-400">
              {report.negativeTags} (Tilt, Impulse, Chasing)
            </p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4">
        <p className="text-sm font-semibold text-blue-200">Key Insights</p>
        <ul className="mt-2 space-y-1 text-xs text-blue-300">
          {report.roi > 5 && <li>• Excellent ROI - you're beating the market</li>}
          {report.roi < -5 && <li>• Negative ROI - consider strategy review</li>}
          {report.winRate > 55 && <li>• Strong win rate - above typical sharp bettor baseline</li>}
          {report.winRate < 45 && <li>• Low win rate - focus on value betting</li>}
          {report.negativeTags > report.positiveTags && <li>• More emotional bets than analytical - review discipline</li>}
          {report.positiveTags > report.negativeTags * 2 && <li>• Excellent discipline - analytical approach showing</li>}
          {report.avgWager > report.totalWagered * 0.15 && <li>• High unit variance - consider more consistent sizing</li>}
        </ul>
      </div>
    </div>
  );

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-white">Accountability Reports</h3>
        <p className="mt-1 text-sm text-slate-300">
          Comprehensive performance summaries to track progress and identify patterns.
        </p>
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-black/40">
          <p className="text-sm text-slate-400">Generating reports...</p>
        </div>
      )}

      {!loading && !weeklyReport && !monthlyReport && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">
          <p className="text-lg font-semibold text-white">No Data Available</p>
          <p className="mt-2 text-sm text-slate-400">Log some bets to see your reports</p>
        </div>
      )}

      {!loading && weeklyReport && (
        <div>
          <ReportCard report={weeklyReport} />
        </div>
      )}

      {!loading && monthlyReport && (
        <div>
          <ReportCard report={monthlyReport} />
        </div>
      )}
    </div>
  );
}
