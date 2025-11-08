/**
 * RecentBets Component
 * Displays recent bet history with status and results
 */

"use client";

import { useState } from "react";
import type { BetWithTags, BetStatus } from "@/lib/types/bankroll";
import { formatCurrency } from "@/lib/odds";

interface RecentBetsProps {
  bets: BetWithTags[];
  currency?: string;
  onUpdateBet?: (betId: string, status: BetStatus, payout?: number) => void;
}

export function RecentBets({ bets, currency = "USD", onUpdateBet }: RecentBetsProps) {
  const [filter, setFilter] = useState<BetStatus | "all">("all");
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  const filteredBets = filter === "all" ? bets : bets.filter((bet) => bet.status === filter);

  const getStatusColor = (status: BetStatus) => {
    switch (status) {
      case "won":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "lost":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "push":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "void":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusLabel = (status: BetStatus) => {
    switch (status) {
      case "won":
        return "✓ Won";
      case "lost":
        return "✗ Lost";
      case "pending":
        return "⏳ Pending";
      case "push":
        return "↔ Push";
      case "void":
        return "⊘ Void";
      default:
        return status;
    }
  };

  const calculateProfit = (bet: BetWithTags) => {
    if (bet.status === "won" && bet.settled_payout) {
      return bet.settled_payout - bet.wager_amount;
    } else if (bet.status === "lost") {
      return -bet.wager_amount;
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Recent Bets</h3>
          <p className="text-sm text-slate-400 mt-1">
            {filteredBets.length} {filteredBets.length === 1 ? "bet" : "bets"}
          </p>
        </div>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as BetStatus | "all")}
          className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Bets</option>
          <option value="pending">Pending</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="push">Push</option>
          <option value="void">Void</option>
        </select>
      </div>

      {/* Bets List */}
      <div className="space-y-2">
        {filteredBets.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📊</span>
            <h3 className="text-lg font-semibold text-white mb-2">No bets yet</h3>
            <p className="text-sm text-slate-400">
              {filter === "all"
                ? "Start tracking your bets to see your history here"
                : `No ${filter} bets found`}
            </p>
          </div>
        ) : (
          filteredBets.map((bet) => {
            const profit = calculateProfit(bet);
            const isExpanded = expandedBet === bet.id;

            return (
              <div
                key={bet.id}
                className="rounded-lg border border-white/5 bg-black/20 overflow-hidden hover:border-white/10 transition-colors"
              >
                {/* Main Bet Row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side: Event and Market */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {bet.event_name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{bet.market}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                            bet.status
                          )}`}
                        >
                          {getStatusLabel(bet.status)}
                        </span>
                        {bet.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30 text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Side: Odds and Amount */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono text-white">
                        {bet.american_odds
                          ? `${bet.american_odds > 0 ? "+" : ""}${bet.american_odds}`
                          : bet.decimal_odds
                          ? `${bet.decimal_odds.toFixed(2)}`
                          : "—"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatCurrency(bet.wager_amount, currency)}
                      </div>
                      {bet.status === "won" || bet.status === "lost" ? (
                        <div
                          className={`text-sm font-semibold mt-2 ${
                            profit > 0
                              ? "text-emerald-400"
                              : profit < 0
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {profit > 0 && "+"}
                          {formatCurrency(profit, currency)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Placed</p>
                        <p className="text-slate-300 mt-0.5">
                          {formatDate(bet.placed_at)}
                        </p>
                      </div>
                      {bet.settled_at && (
                        <div>
                          <p className="text-slate-500">Settled</p>
                          <p className="text-slate-300 mt-0.5">
                            {formatDate(bet.settled_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expected Value */}
                    {bet.expected_value !== null && bet.expected_value !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Expected Value</p>
                        <p
                          className={`text-sm font-medium mt-0.5 ${
                            bet.expected_value > 0
                              ? "text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          {bet.expected_value > 0 && "+"}
                          {bet.expected_value.toFixed(1)}%
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {bet.notes && (
                      <div>
                        <p className="text-xs text-slate-500">Notes</p>
                        <p className="text-sm text-slate-300 mt-1">{bet.notes}</p>
                      </div>
                    )}

                    {/* Quick Actions for Pending Bets */}
                    {bet.status === "pending" && onUpdateBet && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBet(bet.id, "won");
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                        >
                          Mark Won
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBet(bet.id, "lost");
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-xs font-medium"
                        >
                          Mark Lost
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBet(bet.id, "push");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30 transition-colors text-xs font-medium"
                        >
                          Push
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
