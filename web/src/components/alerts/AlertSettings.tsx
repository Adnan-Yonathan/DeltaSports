/**
 * AlertSettings Component
 * Configure edge alert preferences
 */

"use client";

import { useState } from "react";
import type { AlertSettings } from "@/lib/types/alerts";

interface AlertSettingsProps {
  settings: AlertSettings;
  onSave: (settings: Partial<AlertSettings>) => void;
  isSaving?: boolean;
}

const SPORTS_OPTIONS = [
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
  { key: "soccer_epl", label: "EPL" },
  { key: "soccer_uefa_champions_league", label: "Champions League" },
];

const MARKET_OPTIONS = [
  { key: "h2h", label: "Moneyline" },
  { key: "spreads", label: "Spreads" },
  { key: "totals", label: "Totals" },
];

export function AlertSettings({ settings, onSave, isSaving = false }: AlertSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (updates: Partial<AlertSettings>) => {
    setLocalSettings({ ...localSettings, ...updates });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const toggleSport = (sportKey: string) => {
    const enabled = localSettings.enabled_sports || [];
    const updated = enabled.includes(sportKey)
      ? enabled.filter((s) => s !== sportKey)
      : [...enabled, sportKey];
    handleChange({ enabled_sports: updated });
  };

  const toggleMarket = (marketKey: string) => {
    const enabled = localSettings.enabled_markets || [];
    const updated = enabled.includes(marketKey)
      ? enabled.filter((m) => m !== marketKey)
      : [...enabled, marketKey];
    handleChange({ enabled_markets: updated });
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Alert Settings</h3>
        <p className="text-sm text-slate-400 mt-1">
          Configure when and how you receive edge alerts
        </p>
      </div>

      {/* EV Threshold */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Minimum EV Threshold</label>
          <p className="text-xs text-slate-500 mt-1">
            Only trigger alerts for opportunities above this EV percentage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={localSettings.min_ev_threshold}
            onChange={(e) =>
              handleChange({ min_ev_threshold: parseFloat(e.target.value) })
            }
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono text-white w-16 text-right">
            {localSettings.min_ev_threshold.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>More alerts</span>
          <span>Fewer, higher quality alerts</span>
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Minimum Confidence</label>
          <p className="text-xs text-slate-500 mt-1">
            Only show AI-generated alerts with at least this confidence level
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localSettings.min_confidence * 100}
            onChange={(e) =>
              handleChange({ min_confidence: parseFloat(e.target.value) / 100 })
            }
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono text-white w-16 text-right">
            {Math.round(localSettings.min_confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Enabled Sports */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Enabled Sports</label>
          <p className="text-xs text-slate-500 mt-1">
            Select which sports you want to receive alerts for
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SPORTS_OPTIONS.map((sport) => {
            const isEnabled = localSettings.enabled_sports?.includes(sport.key) ?? false;
            return (
              <button
                key={sport.key}
                onClick={() => toggleSport(sport.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEnabled
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                }`}
              >
                {sport.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enabled Markets */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Enabled Markets</label>
          <p className="text-xs text-slate-500 mt-1">
            Select which bet types you want alerts for
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MARKET_OPTIONS.map((market) => {
            const isEnabled = localSettings.enabled_markets?.includes(market.key) ?? false;
            return (
              <button
                key={market.key}
                onClick={() => toggleMarket(market.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEnabled
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                }`}
              >
                {market.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-dismiss */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Auto-dismiss After</label>
          <p className="text-xs text-slate-500 mt-1">
            Automatically dismiss alerts after this many hours
          </p>
        </div>
        <select
          value={localSettings.auto_dismiss_after_hours}
          onChange={(e) =>
            handleChange({ auto_dismiss_after_hours: parseInt(e.target.value) })
          }
          className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="0">Never</option>
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
          <option value="6">6 hours</option>
          <option value="12">12 hours</option>
          <option value="24">24 hours</option>
          <option value="48">48 hours</option>
        </select>
      </div>

      {/* Notification Channels */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-white">Notification Channels</label>
          <p className="text-xs text-slate-500 mt-1">
            How would you like to be notified? (Coming soon)
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 opacity-50 pointer-events-none">
          <button className="px-4 py-2 rounded-lg border border-white/5 text-slate-400 text-sm">
            📧 Email
          </button>
          <button className="px-4 py-2 rounded-lg border border-white/5 text-slate-400 text-sm">
            📱 Push
          </button>
          <button className="px-4 py-2 rounded-lg border border-white/5 text-slate-400 text-sm">
            💬 SMS
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/5">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
