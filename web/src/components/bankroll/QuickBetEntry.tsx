/**
 * QuickBetEntry Component
 * Allows quick bet entry with natural language parsing
 */

"use client";

import { useState } from "react";
import type { QuickBetInput, ParsedBet } from "@/lib/types/bankroll";

interface QuickBetEntryProps {
  bankrollId?: string;
  onSubmit: (bet: QuickBetInput) => Promise<void>;
  onCancel?: () => void;
}

export function QuickBetEntry({ bankrollId, onSubmit, onCancel }: QuickBetEntryProps) {
  const [input, setInput] = useState("");
  const [parsedBet, setParsedBet] = useState<ParsedBet | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual entry state
  const [manualBet, setManualBet] = useState<QuickBetInput>({
    bankroll_id: bankrollId,
    event_name: "",
    market: "",
    wager_amount: 0,
    odds: 0,
    notes: "",
  });

  // Simple NLP parser (can be enhanced with AI later)
  const parseBetInput = (text: string): ParsedBet | null => {
    // Example: "$100 on Lakers ML -150"
    // Example: "50 Lakers -3.5 -110"
    // Example: "$25 Warriors over 225.5 -105"

    const dollarMatch = text.match(/\$?(\d+(?:\.\d+)?)/);
    const oddsMatch = text.match(/([+-]\d+)/);

    if (!dollarMatch) return null;

    const wager_amount = parseFloat(dollarMatch[1]);
    const odds = oddsMatch ? parseInt(oddsMatch[1]) : 0;

    // Try to extract team/event name
    let event_name = text;
    let market = "";

    // Check for spread
    if (text.match(/[+-]?\d+\.5/)) {
      const spreadMatch = text.match(/([+-]?\d+\.5)/);
      market = `Spread ${spreadMatch?.[1] || ""}`;
      event_name = text.replace(/[+-]?\d+\.5/, "").replace(/\$?\d+(?:\.\d+)?/, "").replace(/[+-]\d+/, "").trim();
    }
    // Check for over/under
    else if (text.toLowerCase().includes("over") || text.toLowerCase().includes("under")) {
      const ouMatch = text.match(/(over|under)\s+(\d+(?:\.\d+)?)/i);
      if (ouMatch) {
        market = `${ouMatch[1].charAt(0).toUpperCase() + ouMatch[1].slice(1)} ${ouMatch[2]}`;
        event_name = text.replace(ouMatch[0], "").replace(/\$?\d+(?:\.\d+)?/, "").replace(/[+-]\d+/, "").trim();
      }
    }
    // Check for ML
    else if (text.toLowerCase().includes("ml") || text.toLowerCase().includes("moneyline")) {
      market = "Moneyline";
      event_name = text.replace(/ml|moneyline/gi, "").replace(/\$?\d+(?:\.\d+)?/, "").replace(/[+-]\d+/, "").trim();
    }

    // Clean up event name
    event_name = event_name.replace(/\s+/g, " ").replace(/^on\s+/i, "").trim();

    if (!event_name) return null;

    return {
      wager_amount,
      event_name,
      market: market || "Moneyline",
      odds,
      confidence: 0.7, // Simple parser has moderate confidence
    };
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    const parsed = parseBetInput(text);
    setParsedBet(parsed);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const betData: QuickBetInput = isManualMode
        ? manualBet
        : {
            bankroll_id: bankrollId,
            event_name: parsedBet!.event_name,
            market: parsedBet!.market,
            wager_amount: parsedBet!.wager_amount,
            odds: parsedBet!.odds,
            notes: input, // Store original input as notes
          };

      await onSubmit(betData);

      // Reset form
      setInput("");
      setParsedBet(null);
      setManualBet({
        bankroll_id: bankrollId,
        event_name: "",
        market: "",
        wager_amount: 0,
        odds: 0,
        notes: "",
      });
    } catch (error) {
      console.error("Failed to submit bet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isManualMode
    ? manualBet.event_name && manualBet.market && manualBet.wager_amount > 0
    : parsedBet !== null;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Quick Bet Entry</h3>
        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {isManualMode ? "Use Natural Language" : "Manual Entry"}
        </button>
      </div>

      {!isManualMode ? (
        <>
          {/* Natural Language Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">
              Describe your bet (e.g., "$100 on Lakers ML -150")
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="$50 Warriors -3.5 -110"
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Parsed Preview */}
          {parsedBet && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400 font-medium">Parsed:</span>
                {parsedBet.confidence < 0.8 && (
                  <span className="text-xs text-amber-400">
                    (Low confidence - please verify)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Event</p>
                  <p className="text-white font-medium">{parsedBet.event_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Market</p>
                  <p className="text-white font-medium">{parsedBet.market}</p>
                </div>
                <div>
                  <p className="text-slate-500">Wager</p>
                  <p className="text-white font-medium">${parsedBet.wager_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Odds</p>
                  <p className="text-white font-medium">
                    {parsedBet.odds > 0 ? "+" : ""}{parsedBet.odds}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Manual Entry Form */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-400">Event Name</label>
              <input
                type="text"
                value={manualBet.event_name}
                onChange={(e) => setManualBet({ ...manualBet, event_name: e.target.value })}
                placeholder="Lakers vs Warriors"
                className="w-full mt-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-400">Market</label>
                <select
                  value={manualBet.market}
                  onChange={(e) => setManualBet({ ...manualBet, market: e.target.value })}
                  className="w-full mt-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select...</option>
                  <option value="Moneyline">Moneyline</option>
                  <option value="Spread">Spread</option>
                  <option value="Over">Over</option>
                  <option value="Under">Under</option>
                  <option value="Parlay">Parlay</option>
                  <option value="Prop">Prop Bet</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Wager Amount</label>
                <input
                  type="number"
                  value={manualBet.wager_amount || ""}
                  onChange={(e) => setManualBet({ ...manualBet, wager_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  className="w-full mt-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">American Odds</label>
              <input
                type="number"
                value={manualBet.odds || ""}
                onChange={(e) => setManualBet({ ...manualBet, odds: parseInt(e.target.value) || 0 })}
                placeholder="-110"
                className="w-full mt-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Notes (Optional)</label>
              <textarea
                value={manualBet.notes || ""}
                onChange={(e) => setManualBet({ ...manualBet, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full mt-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isSubmitting ? "Adding Bet..." : "Add Bet"}
        </button>
      </div>

      {/* Help Text */}
      {!isManualMode && (
        <p className="text-xs text-slate-500 text-center">
          Try: "$100 on Lakers ML -150" or "50 Warriors -3.5 -110" or "$25 over 225.5 -105"
        </p>
      )}
    </div>
  );
}
