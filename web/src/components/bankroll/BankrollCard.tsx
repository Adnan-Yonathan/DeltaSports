/**
 * BankrollCard Component
 * Displays main bankroll summary with balance, ROI, and metrics
 */

import type { BankrollAccount, BankrollMetrics } from "@/lib/types/bankroll";
import { formatCurrency } from "@/lib/odds";

interface BankrollCardProps {
  account: BankrollAccount;
  metrics: BankrollMetrics;
}

export function BankrollCard({ account, metrics }: BankrollCardProps) {
  const profit = account.current_balance - account.starting_balance;
  const profitPercentage = (profit / account.starting_balance) * 100;
  const isProfit = profit > 0;

  // Calculate recommended unit size (2% of current balance)
  const unitSize = account.current_balance * 0.02;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-slate-400">{account.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {account.currency} Bankroll
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Started</p>
          <p className="text-sm text-slate-300">
            {formatCurrency(account.starting_balance, account.currency)}
          </p>
        </div>
      </div>

      {/* Current Balance - Large and Prominent */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <h2 className="text-4xl font-bold text-white">
            {formatCurrency(account.current_balance, account.currency)}
          </h2>
          <div
            className={`text-sm font-semibold ${
              isProfit ? "text-emerald-400" : profit < 0 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {isProfit && "+"}
            {formatCurrency(profit, account.currency)}
          </div>
        </div>

        {/* ROI Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              isProfit
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : profit < 0
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
            }`}
          >
            {isProfit && "+"}
            {profitPercentage.toFixed(1)}% ROI
          </span>

          {/* Streak Indicator */}
          {metrics.currentStreak.type !== "none" && (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                metrics.currentStreak.type === "win"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              }`}
            >
              {metrics.currentStreak.count}
              {metrics.currentStreak.type === "win" ? "W" : "L"} streak
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-xs text-slate-500">Unit Size (2%)</p>
          <p className="text-lg font-semibold text-white mt-1">
            {formatCurrency(unitSize, account.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Win Rate</p>
          <p className="text-lg font-semibold text-white mt-1">
            {(metrics.winRate * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Bets</p>
          <p className="text-lg font-semibold text-white mt-1">
            {metrics.totalBets}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-lg font-semibold text-white mt-1">
            {metrics.activeBets}
          </p>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Performance Breakdown</span>
          <span>
            {metrics.settledBets > 0
              ? `${((metrics.winRate || 0) * metrics.settledBets).toFixed(0)}W - ${(
                  ((1 - (metrics.winRate || 0)) * metrics.settledBets)
                ).toFixed(0)}L`
              : "No settled bets"}
          </span>
        </div>
        {metrics.settledBets > 0 && (
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(metrics.winRate || 0) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        <button className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-medium">
          Add Bet
        </button>
        <button className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">
          View All
        </button>
      </div>
    </div>
  );
}
