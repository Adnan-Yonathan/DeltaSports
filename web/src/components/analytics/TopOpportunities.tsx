/**
 * TopOpportunities Component
 * Displays top +EV betting opportunities
 */

"use client";

import Link from "next/link";
import type { TopOpportunity } from "@/lib/types/analytics";
import { EVBadge } from "@/components/odds/EVBadge";

interface TopOpportunitiesProps {
  opportunities: TopOpportunity[];
}

export function TopOpportunities({ opportunities }: TopOpportunitiesProps) {
  const getSportEmoji = (sport: string) => {
    if (sport.includes("nba") || sport.includes("basketball")) return "🏀";
    if (sport.includes("nfl") || sport.includes("football")) return "🏈";
    if (sport.includes("mlb") || sport.includes("baseball")) return "⚾";
    if (sport.includes("nhl") || sport.includes("hockey")) return "🏒";
    if (sport.includes("soccer") || sport.includes("epl")) return "⚽";
    return "🎯";
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Top Opportunities</h3>
          <p className="text-sm text-slate-400 mt-1">
            Best +EV opportunities available now
          </p>
        </div>
        <Link
          href="/odds"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">💎</span>
          <p className="text-sm text-slate-400">No opportunities available</p>
          <p className="text-xs text-slate-500 mt-1">Check back soon for new edges</p>
        </div>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp, index) => (
            <div
              key={`${opp.eventName}-${opp.market}-${index}`}
              className="rounded-lg border border-white/5 bg-black/20 p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left Side */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Sport Emoji */}
                  <div className="text-2xl shrink-0">
                    {getSportEmoji(opp.sport)}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {opp.eventName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{opp.market}</span>
                      <span>•</span>
                      <span className="font-mono">
                        {opp.odds > 0 ? "+" : ""}
                        {opp.odds}
                      </span>
                      <span>•</span>
                      <span className="text-blue-400">{opp.bookmaker}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - EV Badge */}
                <div className="shrink-0">
                  <EVBadge evPercentage={opp.evPercentage} size="md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {opportunities.length > 0 && (
        <Link
          href="/odds"
          className="block w-full px-4 py-3 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-center text-sm font-medium"
        >
          Scan All Opportunities
        </Link>
      )}
    </div>
  );
}
