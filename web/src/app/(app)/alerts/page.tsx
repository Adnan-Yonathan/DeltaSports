/**
 * Edge Alert Center Page
 * Main interface for viewing and managing edge alerts
 */

"use client";

import { useState } from "react";
import { AlertList } from "@/components/alerts/AlertList";
import { AlertSettings } from "@/components/alerts/AlertSettings";
import type { EdgeAlertWithStatus, AlertSettings as AlertSettingsType } from "@/lib/types/alerts";

export default function AlertsPage() {
  const [view, setView] = useState<"alerts" | "settings">("alerts");

  // Mock data for development (will be replaced with real API data)
  const mockAlerts: EdgeAlertWithStatus[] = [
    {
      id: "1",
      user_id: "user-1",
      origin: "model",
      trigger_ev_threshold: 3.0,
      event_name: "Lakers vs Warriors",
      market: "Moneyline",
      bookmaker: "DraftKings",
      odds: -150,
      ev_percentage: 5.8,
      confidence_score: 0.87,
      reasoning:
        "Lakers showing strong home performance (8-2 in last 10). Warriors dealing with injuries to key players. Market seems to undervalue Lakers' recent momentum.",
      triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      acknowledged_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    },
    {
      id: "2",
      user_id: "user-1",
      origin: "model",
      trigger_ev_threshold: 2.0,
      event_name: "Chiefs vs Bills",
      market: "Spread -3.5",
      bookmaker: "FanDuel",
      odds: -105,
      ev_percentage: 3.2,
      confidence_score: 0.75,
      reasoning:
        "Chiefs' offensive line improvements and Bills' recent defensive struggles create value. Weather conditions favor Chiefs' running game.",
      triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      acknowledged_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "acknowledged",
    },
    {
      id: "3",
      user_id: "user-1",
      origin: "manual",
      trigger_ev_threshold: 5.0,
      event_name: "Celtics vs Heat",
      market: "Over 220.5",
      bookmaker: "BetMGM",
      odds: -110,
      ev_percentage: 7.5,
      confidence_score: null,
      reasoning: null,
      triggered_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      acknowledged_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    },
    {
      id: "4",
      user_id: "user-1",
      origin: "model",
      trigger_ev_threshold: 2.0,
      event_name: "Nuggets vs Suns",
      market: "Moneyline",
      bookmaker: "Caesars",
      odds: +180,
      ev_percentage: 2.8,
      confidence_score: 0.62,
      reasoning: "Jokic's historical performance against Suns, home court advantage.",
      triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      acknowledged_at: null,
      dismissed_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "dismissed",
    },
  ];

  const mockSettings: AlertSettingsType = {
    user_id: "user-1",
    min_ev_threshold: 3.0,
    min_confidence: 0.7,
    enabled_sports: ["basketball_nba", "americanfootball_nfl"],
    enabled_markets: ["h2h", "spreads", "totals"],
    notification_channels: ["email", "push"],
    auto_dismiss_after_hours: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Calculate summary stats
  const activeAlerts = mockAlerts.filter((a) => a.status === "active").length;
  const acknowledgedAlerts = mockAlerts.filter((a) => a.status === "acknowledged").length;
  const highestEV = Math.max(...mockAlerts.map((a) => a.ev_percentage));
  const averageEV = mockAlerts.reduce((sum, a) => sum + a.ev_percentage, 0) / mockAlerts.length;

  const handleAcknowledge = (alertId: string) => {
    console.log("Acknowledging alert:", alertId);
    // TODO: Implement API call
    // await updateAlert(alertId, { acknowledged_at: new Date().toISOString() });
  };

  const handleDismiss = (alertId: string) => {
    console.log("Dismissing alert:", alertId);
    // TODO: Implement API call
    // await updateAlert(alertId, { dismissed_at: new Date().toISOString() });
  };

  const handleSaveSettings = (settings: Partial<AlertSettingsType>) => {
    console.log("Saving settings:", settings);
    // TODO: Implement API call
    // await updateAlertSettings(settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Edge Alert Center</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time notifications for high-value betting opportunities
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView("alerts")}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
                view === "alerts"
                  ? "bg-blue-500 text-white"
                  : "bg-black/30 text-slate-300 hover:bg-black/40 border border-white/10"
              }`}
            >
              🔔 Alerts
            </button>
            <button
              onClick={() => setView("settings")}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
                view === "settings"
                  ? "bg-blue-500 text-white"
                  : "bg-black/30 text-slate-300 hover:bg-black/40 border border-white/10"
              }`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="text-xs text-slate-500">Active Alerts</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{activeAlerts}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="text-xs text-slate-500">Acknowledged</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{acknowledgedAlerts}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="text-xs text-slate-500">Highest EV</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">+{highestEV.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="text-xs text-slate-500">Average EV</p>
            <p className="text-2xl font-bold text-white mt-1">+{averageEV.toFixed(1)}%</p>
          </div>
        </div>

        {/* Main Content */}
        {view === "alerts" ? (
          <AlertList
            alerts={mockAlerts}
            onAcknowledge={handleAcknowledge}
            onDismiss={handleDismiss}
          />
        ) : (
          <AlertSettings settings={mockSettings} onSave={handleSaveSettings} />
        )}

        {/* Help Section */}
        {view === "alerts" && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-400">How Edge Alerts Work</h3>
                <ul className="text-sm text-blue-300 mt-2 space-y-1">
                  <li>
                    • AI continuously scans 100+ sportsbooks for +EV opportunities
                  </li>
                  <li>
                    • Alerts are triggered when odds meet your configured thresholds
                  </li>
                  <li>
                    • Acknowledge alerts you&apos;re tracking, dismiss ones you&apos;re not interested in
                  </li>
                  <li>
                    • Configure your preferences in Settings to customize alert criteria
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
