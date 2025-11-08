/**
 * PerformanceChart Component
 * Displays performance comparison across sports and markets
 */

"use client";

import { formatCurrency } from "@/lib/odds";

interface PerformanceData {
  label: string;
  roi: number;
  profit: number;
  bets: number;
  winRate: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title: string;
  subtitle?: string;
  currency?: string;
}

export function PerformanceChart({
  data,
  title,
  subtitle,
  currency = "USD",
}: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📊</span>
          <p className="text-sm text-slate-400">No data available yet</p>
        </div>
      </div>
    );
  }

  // Find max ROI for scaling bars
  const maxROI = Math.max(...data.map((d) => Math.abs(d.roi)));

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {/* Performance Bars */}
      <div className="space-y-3">
        {data.map((item) => {
          const barWidth = maxROI > 0 ? (Math.abs(item.roi) / maxROI) * 100 : 0;
          const isPositive = item.roi >= 0;

          return (
            <div key={item.label} className="space-y-2">
              {/* Label and Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white min-w-[120px]">
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {item.bets} {item.bets === 1 ? "bet" : "bets"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">
                    {(item.winRate * 100).toFixed(0)}% win
                  </span>
                  <span
                    className={`text-sm font-semibold min-w-[80px] text-right ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isPositive && "+"}
                    {item.roi.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* ROI Bar */}
              <div className="relative h-6 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive
                      ? "bg-gradient-to-r from-emerald-500/60 to-emerald-500/80"
                      : "bg-gradient-to-r from-red-500/60 to-red-500/80"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span
                    className={`text-xs font-semibold ${
                      barWidth > 30 ? "text-white" : "text-slate-400 ml-[calc(100%+8px)]"
                    }`}
                  >
                    {formatCurrency(item.profit, currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-xs text-slate-500">Total Bets</p>
          <p className="text-lg font-semibold text-white mt-1">
            {data.reduce((sum, d) => sum + d.bets, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg ROI</p>
          <p
            className={`text-lg font-semibold mt-1 ${
              data.reduce((sum, d) => sum + d.roi, 0) / data.length > 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {(data.reduce((sum, d) => sum + d.roi, 0) / data.length).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Profit</p>
          <p
            className={`text-lg font-semibold mt-1 ${
              data.reduce((sum, d) => sum + d.profit, 0) > 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {formatCurrency(
              data.reduce((sum, d) => sum + d.profit, 0),
              currency
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
