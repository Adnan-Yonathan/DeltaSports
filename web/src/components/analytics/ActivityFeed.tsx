/**
 * ActivityFeed Component
 * Displays recent activity across bets, alerts, and opportunities
 */

"use client";

import type { ActivityItem } from "@/lib/types/analytics";
import { formatCurrency } from "@/lib/odds";
import { EVBadge } from "@/components/odds/EVBadge";

interface ActivityFeedProps {
  activities: ActivityItem[];
  currency?: string;
}

export function ActivityFeed({ activities, currency = "USD" }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "bet_placed":
        return "🎲";
      case "bet_won":
        return "✅";
      case "bet_lost":
        return "❌";
      case "alert_triggered":
        return "🔔";
      case "ev_opportunity":
        return "💎";
      default:
        return "📊";
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "bet_won":
        return "border-emerald-500/30 bg-emerald-500/10";
      case "bet_lost":
        return "border-red-500/30 bg-red-500/10";
      case "alert_triggered":
        return "border-orange-500/30 bg-orange-500/10";
      case "ev_opportunity":
        return "border-blue-500/30 bg-blue-500/10";
      default:
        return "border-white/5 bg-black/20";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <p className="text-sm text-slate-400 mt-1">
          Latest updates from your betting dashboard
        </p>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📭</span>
          <p className="text-sm text-slate-400">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-lg border p-4 transition-colors hover:border-white/20 ${getActivityColor(
                activity.type
              )}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl shrink-0">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activity.description}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2">
                    {activity.amount !== undefined && (
                      <span
                        className={`text-sm font-semibold ${
                          activity.amount > 0
                            ? "text-emerald-400"
                            : activity.amount < 0
                            ? "text-red-400"
                            : "text-slate-400"
                        }`}
                      >
                        {activity.amount > 0 && "+"}
                        {formatCurrency(activity.amount, currency)}
                      </span>
                    )}

                    {activity.evPercentage !== undefined && activity.evPercentage !== null && (
                      <EVBadge evPercentage={activity.evPercentage} size="sm" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="pt-2 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
}
