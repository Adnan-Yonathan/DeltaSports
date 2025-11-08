/**
 * AlertCard Component
 * Displays individual edge alert with actions
 */

"use client";

import { useState } from "react";
import type { EdgeAlertWithStatus, AlertOrigin } from "@/lib/types/alerts";
import { getAlertPriority } from "@/lib/types/alerts";
import { EVBadge } from "@/components/odds/EVBadge";

interface AlertCardProps {
  alert: EdgeAlertWithStatus;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

export function AlertCard({ alert, onAcknowledge, onDismiss }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const priority = getAlertPriority(alert.ev_percentage);

  const getStatusColor = (status: EdgeAlertWithStatus["status"]) => {
    switch (status) {
      case "active":
        return "border-blue-500/30 bg-blue-500/10";
      case "acknowledged":
        return "border-emerald-500/30 bg-emerald-500/10";
      case "dismissed":
        return "border-slate-500/30 bg-slate-500/10";
      default:
        return "border-white/5 bg-black/20";
    }
  };

  const getPriorityColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "orange":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "yellow":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "blue":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getOriginIcon = (origin: AlertOrigin) => {
    switch (origin) {
      case "model":
        return "🤖";
      case "manual":
        return "✋";
      default:
        return "📊";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
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
    <div
      className={`rounded-xl border overflow-hidden transition-all ${getStatusColor(
        alert.status
      )}`}
    >
      {/* Main Alert Card */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left Side: Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(
                  priority.color
                )}`}
              >
                {priority.label}
              </span>
              <span className="text-xs text-slate-500">
                {getOriginIcon(alert.origin)} {alert.origin === "model" ? "AI Alert" : "Manual"}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">{formatDate(alert.triggered_at)}</span>
            </div>

            <h4 className="text-sm font-semibold text-white mb-1 truncate">
              {alert.event_name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{alert.market}</span>
              <span>•</span>
              <span className="font-mono">
                {alert.odds > 0 ? "+" : ""}
                {alert.odds}
              </span>
              <span>•</span>
              <span className="text-blue-400">{alert.bookmaker}</span>
            </div>
          </div>

          {/* Right Side: EV Badge */}
          <div className="shrink-0">
            <EVBadge evPercentage={alert.ev_percentage} size="lg" />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-2">
          {alert.status === "active" && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Active</span>
            </div>
          )}
          {alert.status === "acknowledged" && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <span>✓</span>
              <span>Acknowledged</span>
            </div>
          )}
          {alert.status === "dismissed" && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>✕</span>
              <span>Dismissed</span>
            </div>
          )}

          {alert.confidence_score !== null && alert.confidence_score !== undefined && (
            <>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-500">
                {Math.round(alert.confidence_score * 100)}% confidence
              </span>
            </>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
          {/* AI Reasoning */}
          {alert.reasoning && (
            <div>
              <p className="text-xs text-slate-500 mb-1">AI Reasoning</p>
              <p className="text-sm text-slate-300">{alert.reasoning}</p>
            </div>
          )}

          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500">EV Threshold</p>
              <p className="text-slate-300 mt-0.5">≥{alert.trigger_ev_threshold}%</p>
            </div>
            <div>
              <p className="text-slate-500">Triggered At</p>
              <p className="text-slate-300 mt-0.5">
                {new Date(alert.triggered_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Actions (only for active alerts) */}
          {alert.status === "active" && (onAcknowledge || onDismiss) && (
            <div className="flex gap-2 pt-2">
              {onAcknowledge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(alert.id);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                >
                  ✓ Acknowledge
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(alert.id);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  ✕ Dismiss
                </button>
              )}
            </div>
          )}

          {/* Acknowledged/Dismissed Info */}
          {alert.acknowledged_at && (
            <div className="text-xs text-slate-500">
              Acknowledged {formatDate(alert.acknowledged_at)}
            </div>
          )}
          {alert.dismissed_at && (
            <div className="text-xs text-slate-500">
              Dismissed {formatDate(alert.dismissed_at)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
