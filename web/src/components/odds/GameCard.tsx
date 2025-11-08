/**
 * GameCard Component
 * Displays a single game/event with odds across bookmakers
 */

import { useState } from "react";
import type { ProcessedOdds, ProcessedMarket } from "@/lib/types/odds-api";
import { EVBadge } from "./EVBadge";
import { formatAmericanOdds } from "@/lib/odds";

interface GameCardProps {
  event: ProcessedOdds;
  evOpportunities?: Array<{
    eventId: string;
    market: string;
    selection: string;
    bestOdds: number;
    bestBook: string;
    evPercentage: number;
  }>;
}

export function GameCard({ event, evOpportunities = [] }: GameCardProps) {
  const [activeMarket, setActiveMarket] = useState<"moneyline" | "spread" | "total">("moneyline");

  // Get current market data
  const currentMarket = event.markets.find((m) => m.type === activeMarket);

  // Get EV for current market
  const getEV = (team: string, odds: number) => {
    const ev = evOpportunities.find(
      (e) =>
        e.eventId === event.eventId &&
        e.market === activeMarket &&
        e.selection.includes(team) &&
        e.bestOdds === odds
    );
    return ev?.evPercentage || 0;
  };

  // Format game time
  const gameTime = new Date(event.commenceTime).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-6 space-y-4">
      {/* Header: Teams and Time */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {event.awayTeam} <span className="text-slate-400">@</span> {event.homeTeam}
          </h3>
          <span className="text-xs text-slate-400">{gameTime}</span>
        </div>
        <p className="text-xs text-slate-500">{event.sportTitle}</p>
      </header>

      {/* Market Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {["moneyline", "spread", "total"].map((market) => {
          const hasData = event.markets.some((m) => m.type === market);
          if (!hasData) return null;

          return (
            <button
              key={market}
              onClick={() => setActiveMarket(market as typeof activeMarket)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeMarket === market
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {market === "moneyline" && "Moneyline"}
              {market === "spread" && "Spread"}
              {market === "total" && "Total"}
            </button>
          );
        })}
      </div>

      {/* Odds Table */}
      {currentMarket ? (
        <div className="space-y-2">
          {currentMarket.bookmakers.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 font-medium px-3 pb-2 border-b border-white/5">
                <div className="col-span-4">Sportsbook</div>
                <div className="col-span-4 text-center">{event.awayTeam}</div>
                <div className="col-span-4 text-center">{event.homeTeam}</div>
              </div>

              {/* Table Rows */}
              {currentMarket.bookmakers.map((bookmaker) => {
                const awayOutcome = bookmaker.outcomes.find((o) => o.team === event.awayTeam);
                const homeOutcome = bookmaker.outcomes.find((o) => o.team === event.homeTeam);

                return (
                  <div
                    key={bookmaker.name}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {/* Sportsbook Name */}
                    <div className="col-span-4 text-sm text-white font-medium">
                      {bookmaker.displayName}
                    </div>

                    {/* Away Team Odds */}
                    <div className="col-span-4 flex flex-col items-center gap-1">
                      {awayOutcome ? (
                        <>
                          <span className="text-sm font-mono text-white">
                            {formatAmericanOdds(awayOutcome.odds)}
                            {awayOutcome.point !== undefined && (
                              <span className="ml-1 text-slate-400">
                                ({awayOutcome.point > 0 ? "+" : ""}
                                {awayOutcome.point})
                              </span>
                            )}
                          </span>
                          {getEV(event.awayTeam, awayOutcome.odds) > 0 && (
                            <EVBadge
                              evPercentage={getEV(event.awayTeam, awayOutcome.odds)}
                              size="sm"
                            />
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>

                    {/* Home Team Odds */}
                    <div className="col-span-4 flex flex-col items-center gap-1">
                      {homeOutcome ? (
                        <>
                          <span className="text-sm font-mono text-white">
                            {formatAmericanOdds(homeOutcome.odds)}
                            {homeOutcome.point !== undefined && (
                              <span className="ml-1 text-slate-400">
                                ({homeOutcome.point > 0 ? "+" : ""}
                                {homeOutcome.point})
                              </span>
                            )}
                          </span>
                          {getEV(event.homeTeam, homeOutcome.odds) > 0 && (
                            <EVBadge
                              evPercentage={getEV(event.homeTeam, homeOutcome.odds)}
                              size="sm"
                            />
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No odds available for this market
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">
          No markets available for this game
        </div>
      )}

      {/* Last Updated */}
      {currentMarket && currentMarket.bookmakers.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-slate-500">
            Last updated:{" "}
            {new Date(
              currentMarket.bookmakers[0].lastUpdate
            ).toLocaleTimeString()}
          </span>
          <button className="text-xs text-blue-400 hover:text-blue-300">
            View all bookmakers →
          </button>
        </div>
      )}
    </div>
  );
}
