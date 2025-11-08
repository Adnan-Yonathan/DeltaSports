/**
 * QuickStats Component
 * Displays key performance metrics at a glance
 */

"use client";

import { formatCurrency } from "@/lib/odds";

interface QuickStatsProps {
  totalProfit: number;
  totalBets: number;
  overallROI: number;
  overallWinRate: number;
  activeBets: number;
  activeAlerts: number;
  profitTrend: "up" | "down" | "stable";
  profitChange: number;
  roiTrend: "up" | "down" | "stable";
  roiChange: number;
  currency?: string;
}

export function QuickStats({
  totalProfit,
  totalBets,
  overallROI,
  overallWinRate,
  activeBets,
  activeAlerts,
  profitTrend,
  profitChange,
  roiTrend,
  roiChange,
  currency = "USD",
}: QuickStatsProps) {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      case "stable":
        return "→";
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-emerald-400";
      case "down":
        return "text-red-400";
      case "stable":
        return "text-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Profit */}
      <div className="rounded-xl border border-white/5 bg-black/30 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Profit</p>
          <span className="text-2xl">💰</span>
        </div>
        <p
          className={`text-3xl font-bold ${
            totalProfit > 0
              ? "text-emerald-400"
              : totalProfit < 0
              ? "text-red-400"
              : "text-slate-400"
          }`}
        >
          {totalProfit > 0 && "+"}
          {formatCurrency(totalProfit, currency)}
        </p>
        {profitTrend !== "stable" && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor(profitTrend)}`}>
            <span>{getTrendIcon(profitTrend)}</span>
            <span>
              {Math.abs(profitChange).toFixed(1)}% vs last 30d
            </span>
          </div>
        )}
      </div>

      {/* Overall ROI */}
      <div className="rounded-xl border border-white/5 bg-black/30 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Overall ROI</p>
          <span className="text-2xl">📈</span>
        </div>
        <p
          className={`text-3xl font-bold ${
            overallROI > 0
              ? "text-emerald-400"
              : overallROI < 0
              ? "text-red-400"
              : "text-slate-400"
          }`}
        >
          {overallROI > 0 && "+"}
          {overallROI.toFixed(1)}%
        </p>
        {roiTrend !== "stable" && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor(roiTrend)}`}>
            <span>{getTrendIcon(roiTrend)}</span>
            <span>
              {Math.abs(roiChange).toFixed(1)}% vs last 30d
            </span>
          </div>
        )}
      </div>

      {/* Win Rate */}
      <div className="rounded-xl border border-white/5 bg-black/30 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Win Rate</p>
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-3xl font-bold text-white">
          {(overallWinRate * 100).toFixed(1)}%
        </p>
        <div className="text-sm text-slate-400">
          {totalBets} total {totalBets === 1 ? "bet" : "bets"}
        </div>
      </div>

      {/* Active Status */}
      <div className="rounded-xl border border-white/5 bg-black/30 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
          <span className="text-2xl">⚡</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Bets</span>
            <span className="text-2xl font-bold text-blue-400">{activeBets}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Alerts</span>
            <span className="text-2xl font-bold text-orange-400">{activeAlerts}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
