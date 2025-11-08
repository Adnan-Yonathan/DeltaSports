/**
 * ROITimeline Component
 * Displays ROI performance over time with simple bar chart
 */

"use client";

import { useState } from "react";
import type { ROIDataPoint, TimePeriod } from "@/lib/types/analytics";
import { formatCurrency } from "@/lib/odds";

interface ROITimelineProps {
  data: ROIDataPoint[];
  currency?: string;
}

export function ROITimeline({ data, currency = "USD" }: ROITimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ROI Timeline</h3>
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📊</span>
          <p className="text-sm text-slate-400">No data available yet</p>
        </div>
      </div>
    );
  }

  // Calculate min and max for scaling
  const maxROI = Math.max(...data.map((d) => d.roi));
  const minROI = Math.min(...data.map((d) => d.roi));
  const maxAbsROI = Math.max(Math.abs(maxROI), Math.abs(minROI));

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">ROI Timeline</h3>
        <p className="text-sm text-slate-400 mt-1">
          Performance over the last {data.length} days
        </p>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-500">
          <span>+{maxAbsROI.toFixed(0)}%</span>
          <span>0%</span>
          <span>-{maxAbsROI.toFixed(0)}%</span>
        </div>

        {/* Chart area */}
        <div className="ml-12">
          {/* Zero line */}
          <div className="relative h-48">
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/10" />

            {/* Bars */}
            <div className="flex items-end justify-around h-full gap-1">
              {data.map((point, index) => {
                const isPositive = point.roi >= 0;
                const heightPercentage = (Math.abs(point.roi) / maxAbsROI) * 50; // 50% of container height
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center justify-center relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t transition-all cursor-pointer ${
                        isPositive
                          ? "bg-emerald-500/60 hover:bg-emerald-500/80"
                          : "bg-red-500/60 hover:bg-red-500/80"
                      } ${isHovered ? "opacity-100" : "opacity-80"}`}
                      style={{
                        height: `${heightPercentage}%`,
                        transform: isPositive ? "none" : "translateY(100%)",
                      }}
                    />

                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-10 w-48">
                        <div className="rounded-lg bg-black/90 border border-white/20 p-3 text-xs shadow-lg">
                          <p className="text-slate-400 mb-2">{formatDate(point.date)}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">ROI:</span>
                              <span
                                className={`font-semibold ${
                                  point.roi > 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {point.roi > 0 && "+"}
                                {point.roi.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Profit:</span>
                              <span
                                className={`font-semibold ${
                                  point.profit > 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {point.profit > 0 && "+"}
                                {formatCurrency(point.profit, currency)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Bets:</span>
                              <span className="text-white font-semibold">{point.bets}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels (show every nth date to avoid crowding) */}
          <div className="flex justify-around mt-2 text-xs text-slate-500">
            {data.map((point, index) => {
              // Show first, last, and every 7th label
              const showLabel = index === 0 || index === data.length - 1 || index % 7 === 0;
              return (
                <div key={point.date} className="flex-1 text-center">
                  {showLabel && formatDate(point.date)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-xs text-slate-500">Avg ROI</p>
          <p className="text-lg font-semibold text-white mt-1">
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
        <div>
          <p className="text-xs text-slate-500">Total Bets</p>
          <p className="text-lg font-semibold text-white mt-1">
            {data.reduce((sum, d) => sum + d.bets, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
