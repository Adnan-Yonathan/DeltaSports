/**
 * AlertList Component
 * Displays list of edge alerts with filtering
 */

"use client";

import { useState } from "react";
import { AlertCard } from "./AlertCard";
import type { EdgeAlertWithStatus, AlertStatus, AlertOrigin } from "@/lib/types/alerts";

interface AlertListProps {
  alerts: EdgeAlertWithStatus[];
  isLoading?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

export function AlertList({
  alerts,
  isLoading = false,
  onAcknowledge,
  onDismiss,
}: AlertListProps) {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const [originFilter, setOriginFilter] = useState<AlertOrigin | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_ev">("newest");

  // Apply filters
  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (originFilter !== "all" && alert.origin !== originFilter) return false;
    return true;
  });

  // Apply sorting
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
      case "oldest":
        return new Date(a.triggered_at).getTime() - new Date(b.triggered_at).getTime();
      case "highest_ev":
        return b.ev_percentage - a.ev_percentage;
      default:
        return 0;
    }
  });

  // Count by status
  const statusCounts = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    dismissed: alerts.filter((a) => a.status === "dismissed").length,
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | "all")}
            className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All ({statusCounts.all})</option>
            <option value="active">Active ({statusCounts.active})</option>
            <option value="acknowledged">Acknowledged ({statusCounts.acknowledged})</option>
            <option value="dismissed">Dismissed ({statusCounts.dismissed})</option>
          </select>
        </div>

        {/* Origin Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Source:</label>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as AlertOrigin | "all")}
            className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Sources</option>
            <option value="model">🤖 AI Generated</option>
            <option value="manual">✋ Manual</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-slate-400">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_ev">Highest EV</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-black/30 p-4 h-32 overflow-hidden"
            >
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3 animate-shimmer"></div>
              <div className="h-3 bg-white/5 rounded w-1/2 mb-2 animate-shimmer"></div>
              <div className="h-3 bg-white/5 rounded w-2/3 animate-shimmer"></div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts List */}
      {!isLoading && sortedAlerts.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-white/5 bg-black/30">
          <span className="text-4xl mb-4 block">🔔</span>
          <h3 className="text-lg font-semibold text-white mb-2">No alerts found</h3>
          <p className="text-sm text-slate-400">
            {statusFilter === "all" && originFilter === "all"
              ? "You don't have any alerts yet"
              : "No alerts match your current filters"}
          </p>
        </div>
      )}

      {!isLoading && sortedAlerts.length > 0 && (
        <div className="space-y-3">
          {sortedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && sortedAlerts.length > 0 && (
        <div className="text-center text-xs text-slate-500">
          Showing {sortedAlerts.length} of {alerts.length}{" "}
          {alerts.length === 1 ? "alert" : "alerts"}
        </div>
      )}
    </div>
  );
}
