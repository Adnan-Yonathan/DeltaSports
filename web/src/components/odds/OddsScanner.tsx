/**
 * OddsScanner Component
 * Main interface for real-time odds comparison across sportsbooks
 */

"use client";

import { useState } from "react";
import { useOdds } from "@/lib/hooks/useOdds";
import { GameCard } from "./GameCard";

const SPORTS = [
  { key: "basketball_nba", label: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", label: "NFL", emoji: "🏈" },
  { key: "baseball_mlb", label: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", label: "NHL", emoji: "🏒" },
  { key: "soccer_epl", label: "EPL", emoji: "⚽" },
];

export function OddsScanner() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [minEv, setMinEv] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { events, evOpportunities, isLoading, error, refetch, metadata } = useOdds({
    sport: selectedSport,
    markets: "h2h,spreads,totals",
    minEv,
    autoRefresh,
    refreshInterval: 60000, // 1 minute
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="space-y-4">
        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Odds Scanner</h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time odds comparison across 100+ sportsbooks
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh Toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              Auto-refresh
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Sport Selector */}
        <div className="flex gap-2">
          {SPORTS.map((sport) => (
            <button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSport === sport.key
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
              }`}
            >
              <span className="mr-2">{sport.emoji}</span>
              {sport.label}
            </button>
          ))}
        </div>

        {/* EV Filter */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <label className="text-sm text-slate-300 font-medium">
            Minimum EV:
          </label>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minEv}
              onChange={(e) => setMinEv(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm font-mono text-white w-16 text-right">
              {minEv.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {minEv === 0 ? "Show all odds" : `Show only ≥${minEv}% EV`}
          </div>
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>
              {metadata.eventCount} {metadata.eventCount === 1 ? "game" : "games"}
            </span>
            <span>
              {metadata.evOpportunityCount} +EV{" "}
              {metadata.evOpportunityCount === 1 ? "opportunity" : "opportunities"}
            </span>
            <span>
              Updated {new Date(metadata.fetchedAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-red-400">
                Failed to load odds
              </h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && events.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-black/30 p-6 h-64 overflow-hidden"
            >
              <div className="h-6 bg-white/10 rounded w-1/2 mb-4 animate-shimmer"></div>
              <div className="h-4 bg-white/5 rounded w-1/4 mb-6 animate-shimmer"></div>
              <div className="space-y-3">
                <div className="h-10 bg-white/5 rounded animate-shimmer"></div>
                <div className="h-10 bg-white/5 rounded animate-shimmer"></div>
                <div className="h-10 bg-white/5 rounded animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Games List */}
      {!isLoading && events.length === 0 && !error && (
        <div className="text-center py-12 rounded-2xl border border-white/5 bg-black/30">
          <span className="text-4xl mb-4 block">🏀</span>
          <h3 className="text-lg font-semibold text-white mb-2">
            No games available
          </h3>
          <p className="text-sm text-slate-400">
            Check back later or try a different sport
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <GameCard
              key={event.eventId}
              event={event}
              evOpportunities={evOpportunities}
            />
          ))}
        </div>
      )}
    </div>
  );
}
