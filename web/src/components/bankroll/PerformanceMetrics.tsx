/**
 * PerformanceMetrics Component
 * Displays performance breakdown by sport, market, and tags
 */

"use client";

import { useState } from "react";
import type { PerformanceByCategory } from "@/lib/types/bankroll";
import { formatCurrency } from "@/lib/odds";

interface PerformanceMetricsProps {
  performanceBySport: PerformanceByCategory[];
  performanceByMarket: PerformanceByCategory[];
  topTags: Array<{ tag: string; count: number }>;
  currency?: string;
}

type ViewMode = "sport" | "market" | "tags";

export function PerformanceMetrics({
  performanceBySport,
  performanceByMarket,
  topTags,
  currency = "USD",
}: PerformanceMetricsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("sport");

  const currentData =
    viewMode === "sport"
      ? performanceBySport
      : viewMode === "market"
      ? performanceByMarket
      : [];

  const getROIColor = (roi: number) => {
    if (roi >= 5) return "text-emerald-400";
    if (roi > 0) return "text-blue-400";
    if (roi > -5) return "text-orange-400";
    return "text-red-400";
  };

  const getROIBgColor = (roi: number) => {
    if (roi >= 5) return "bg-emerald-500/20";
    if (roi > 0) return "bg-blue-500/20";
    if (roi > -5) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Performance Breakdown</h3>
        <p className="text-sm text-slate-400 mt-1">
          Analyze your betting performance by category
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("sport")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "sport"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
          }`}
        >
          By Sport
        </button>
        <button
          onClick={() => setViewMode("market")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "market"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
          }`}
        >
          By Market
        </button>
        <button
          onClick={() => setViewMode("tags")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "tags"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
          }`}
        >
          By Tags
        </button>
      </div>

      {/* Performance Data */}
      {viewMode !== "tags" ? (
        <div className="space-y-3">
          {currentData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No data available yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Start placing bets to see performance analytics
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-3 px-3 pb-2 border-b border-white/5 text-xs text-slate-500 font-medium">
                <div className="col-span-2">Category</div>
                <div className="text-center">Bets</div>
                <div className="text-center">Win Rate</div>
                <div className="text-right">Profit</div>
                <div className="text-right">ROI</div>
                <div className="text-right">Avg Odds</div>
              </div>

              {/* Table Rows */}
              {currentData.map((item) => (
                <div
                  key={item.category}
                  className="grid grid-cols-7 gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {/* Category Name */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium text-white truncate">
                      {item.category}
                    </span>
                  </div>

                  {/* Bets Count */}
                  <div className="text-center text-sm text-slate-300">
                    {item.bets}
                  </div>

                  {/* Win Rate */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-medium text-white">
                        {(item.winRate * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        ({item.wins}-{item.losses})
                      </span>
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold ${
                        item.profit > 0
                          ? "text-emerald-400"
                          : item.profit < 0
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {item.profit > 0 && "+"}
                      {formatCurrency(item.profit, currency)}
                    </span>
                  </div>

                  {/* ROI */}
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getROIBgColor(
                        item.roi
                      )} ${getROIColor(item.roi)}`}
                    >
                      {item.roi > 0 && "+"}
                      {item.roi.toFixed(1)}%
                    </span>
                  </div>

                  {/* Avg Odds */}
                  <div className="text-right text-sm text-slate-300">
                    {item.avgOdds > 0 && "+"}
                    {item.avgOdds.toFixed(0)}
                  </div>
                </div>
              ))}

              {/* Summary Row */}
              <div className="grid grid-cols-7 gap-3 px-3 py-3 mt-2 border-t border-white/5 bg-white/5 rounded-lg">
                <div className="col-span-2 flex items-center">
                  <span className="text-sm font-bold text-white">Total</span>
                </div>
                <div className="text-center text-sm font-semibold text-white">
                  {currentData.reduce((sum, item) => sum + item.bets, 0)}
                </div>
                <div className="text-center text-sm font-semibold text-white">
                  {(
                    (currentData.reduce((sum, item) => sum + item.wins, 0) /
                      currentData.reduce((sum, item) => sum + item.bets, 0)) *
                    100
                  ).toFixed(0)}%
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${
                      currentData.reduce((sum, item) => sum + item.profit, 0) > 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {currentData.reduce((sum, item) => sum + item.profit, 0) > 0 && "+"}
                    {formatCurrency(
                      currentData.reduce((sum, item) => sum + item.profit, 0),
                      currency
                    )}
                  </span>
                </div>
                <div className="col-span-2"></div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Tags View */
        <div className="space-y-3">
          {topTags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No tags used yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Tag your bets to track patterns like &apos;tilt&apos;, &apos;sharp&apos;, &apos;live_bet&apos;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {topTags.map((tag) => (
                <div
                  key={tag.tag}
                  className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">#{tag.tag}</span>
                    <span className="text-xs text-slate-400">{tag.count} bets</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {currentData.length > 0 && viewMode !== "tags" && (
        <div className="pt-4 border-t border-white/5 space-y-2">
          <h4 className="text-sm font-semibold text-white">Quick Insights</h4>
          <div className="space-y-1 text-xs text-slate-400">
            {(() => {
              const bestCategory = [...currentData].sort((a, b) => b.roi - a.roi)[0];
              const worstCategory = [...currentData].sort((a, b) => a.roi - b.roi)[0];
              const mostBets = [...currentData].sort((a, b) => b.bets - a.bets)[0];

              return (
                <>
                  {bestCategory && (
                    <p>
                      🟢 Best performing:{" "}
                      <span className="text-emerald-400 font-medium">
                        {bestCategory.category}
                      </span>{" "}
                      ({bestCategory.roi > 0 && "+"}
                      {bestCategory.roi.toFixed(1)}% ROI)
                    </p>
                  )}
                  {worstCategory && worstCategory.roi < 0 && (
                    <p>
                      🔴 Needs improvement:{" "}
                      <span className="text-red-400 font-medium">
                        {worstCategory.category}
                      </span>{" "}
                      ({worstCategory.roi.toFixed(1)}% ROI)
                    </p>
                  )}
                  {mostBets && (
                    <p>
                      📊 Most active:{" "}
                      <span className="text-blue-400 font-medium">{mostBets.category}</span>{" "}
                      ({mostBets.bets} bets)
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
