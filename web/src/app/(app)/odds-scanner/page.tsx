'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

type Outcome = {
  name: string;
  price: number | null;
  point: number | null;
};

type Market = {
  key: string;
  lastUpdate: string | null;
  outcomes: Outcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  markets: Market[];
};

type OddsEvent = {
  id: string;
  sportKey: string;
  sportTitle: string | null;
  commenceTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  bookmakers: Bookmaker[];
};

type OddsSnapshot = {
  sportKey: string;
  fetchedAt: string;
  filters: {
    regions: string;
    markets: string;
    bookmakers?: string;
    oddsFormat: string;
  };
  events: OddsEvent[];
  warnings?: string[];
};

const SPORT_OPTIONS = [
  { value: 'basketball_nba', label: 'NBA' },
  { value: 'americanfootball_nfl', label: 'NFL' },
  { value: 'icehockey_nhl', label: 'NHL' },
  { value: 'baseball_mlb', label: 'MLB' },
  { value: 'soccer_epl', label: 'English Premier League' },
] as const;

const MARKET_OPTIONS = [
  { value: 'h2h', label: 'Moneyline' },
  { value: 'spreads', label: 'Spreads' },
  { value: 'totals', label: 'Totals (Over/Under)' },
] as const;

export default function OddsScannerPage() {
  const { userProfile } = useSupabaseAuth();
  const supabase = getSupabaseClient();
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [selectedMarket, setSelectedMarket] = useState('h2h,spreads,totals');
  const [oddsSnapshot, setOddsSnapshot] = useState<OddsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchOdds = useCallback(async () => {
    if (!userProfile?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Get current odds for all upcoming games',
          sportKey: selectedSport,
          regions: 'us',
          markets: selectedMarket,
          bookmakers: 'draftkings,fanduel,betmgm',
          userProfileId: userProfile.id,
          streamResponse: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.odds_snapshot) {
        setOddsSnapshot(data.odds_snapshot);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Error fetching odds', err);
      setError('Failed to load odds. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile, selectedSport, selectedMarket]);

  useEffect(() => {
    void fetchOdds();
  }, [fetchOdds]);

  // Convert American odds to decimal
  const americanToDecimal = (american: number): number => {
    return american > 0 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
  };

  // Convert decimal odds to implied probability
  const decimalToImpliedProb = (decimal: number): number => {
    return 1 / decimal;
  };

  // Get all odds for a specific outcome across all books
  const getAllOdds = (bookmakers: Bookmaker[], marketKey: string, outcomeName: string): number[] => {
    const odds: number[] = [];
    bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (market) {
        const outcome = market.outcomes.find((o) => o.name === outcomeName);
        if (outcome && outcome.price !== null) {
          odds.push(outcome.price);
        }
      }
    });
    return odds;
  };

  // Calculate market consensus (average implied probability) and best odds
  const calculateMarketValue = (bookmakers: Bookmaker[], marketKey: string, outcomeName: string) => {
    const allOdds = getAllOdds(bookmakers, marketKey, outcomeName);

    if (allOdds.length === 0) {
      return { bestPrice: null, bestBook: null, ev: 0, hasValue: false, consensusProb: 0 };
    }

    // Convert to decimal and calculate implied probabilities
    const decimalOdds = allOdds.map(americanToDecimal);
    const impliedProbs = decimalOdds.map(decimalToImpliedProb);

    // Market consensus is the average implied probability
    const consensusProb = impliedProbs.reduce((sum, prob) => sum + prob, 0) / impliedProbs.length;

    // Find best odds (highest American odds)
    let bestPrice: number | null = null;
    let bestBook: string | null = null;
    let bestDecimal = 0;

    bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (market) {
        const outcome = market.outcomes.find((o) => o.name === outcomeName);
        if (outcome && outcome.price !== null) {
          const decimal = americanToDecimal(outcome.price);
          // For positive odds, higher is better. For negative, closer to 0 is better (i.e., -110 > -120)
          if (bestPrice === null ||
              (outcome.price > 0 && outcome.price > bestPrice) ||
              (outcome.price < 0 && bestPrice < 0 && outcome.price > bestPrice)) {
            bestPrice = outcome.price;
            bestBook = bookmaker.title;
            bestDecimal = decimal;
          }
        }
      }
    });

    // Calculate EV: (best odds payout * consensus probability) - 1
    // EV = (decimal odds * true probability) - 1
    const ev = bestDecimal > 0 ? (bestDecimal * consensusProb - 1) * 100 : 0;
    const hasValue = ev > 0.5; // Flag if EV > 0.5%

    return { bestPrice, bestBook, ev, hasValue, consensusProb };
  };

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Odds Scanner</h3>
          <p className="mt-1 text-sm text-slate-300">
            Real-time odds comparison across major sportsbooks.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOdds}
          disabled={loading}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-accent/90 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Odds'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-white/5 bg-black/40 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-400">Sport</label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            {SPORT_OPTIONS.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-400">Markets</label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
          >
            <option value="h2h">Moneyline Only</option>
            <option value="spreads">Spreads Only</option>
            <option value="totals">Totals Only</option>
            <option value="h2h,spreads">Moneyline + Spreads</option>
            <option value="h2h,spreads,totals">All Markets</option>
          </select>
        </div>
        {lastRefresh && (
          <div className="flex items-end">
            <p className="text-xs text-slate-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !oddsSnapshot && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-black/40">
          <p className="text-sm text-slate-400">Loading odds...</p>
        </div>
      )}

      {/* Odds Display */}
      {oddsSnapshot && oddsSnapshot.events.length === 0 && !loading && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">
          <p className="text-lg font-semibold text-white">No Games Found</p>
          <p className="mt-2 text-sm text-slate-400">Try selecting a different sport or check back later</p>
        </div>
      )}

      {oddsSnapshot && oddsSnapshot.events.length > 0 && (
        <div className="space-y-4">
          {oddsSnapshot.events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-white/5 bg-black/40 p-6"
            >
              {/* Event Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {event.awayTeam} @ {event.homeTeam}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {event.commenceTime ? new Date(event.commenceTime).toLocaleString() : 'TBD'}
                  </p>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {event.sportTitle}
                </span>
              </div>

              {/* Odds Tables */}
              <div className="space-y-4">
                {/* Moneyline */}
                {selectedMarket.includes('h2h') && (() => {
                  const awayValue = calculateMarketValue(event.bookmakers, 'h2h', event.awayTeam || '');
                  const homeValue = calculateMarketValue(event.bookmakers, 'h2h', event.homeTeam || '');

                  return (
                    <div>
                      <h5 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Moneyline
                      </h5>

                      {/* Best Value Summary */}
                      {(awayValue.hasValue || homeValue.hasValue) && (
                        <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                            Value Opportunities
                          </p>
                          <div className="mt-2 space-y-1">
                            {awayValue.hasValue && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white">{event.awayTeam}</span>
                                <span className="text-emerald-400">
                                  {awayValue.bestPrice && (awayValue.bestPrice > 0 ? '+' : '')}
                                  {awayValue.bestPrice} @ {awayValue.bestBook} (+{awayValue.ev.toFixed(2)}% EV)
                                </span>
                              </div>
                            )}
                            {homeValue.hasValue && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white">{event.homeTeam}</span>
                                <span className="text-emerald-400">
                                  {homeValue.bestPrice && (homeValue.bestPrice > 0 ? '+' : '')}
                                  {homeValue.bestPrice} @ {homeValue.bestBook} (+{homeValue.ev.toFixed(2)}% EV)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm">
                          <thead className="border-b border-white/5 bg-black/60">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Book
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {event.awayTeam}
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {event.homeTeam}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {event.bookmakers.map((bookmaker) => {
                              const h2hMarket = bookmaker.markets.find((m) => m.key === 'h2h');
                              if (!h2hMarket) return null;

                              const awayOutcome = h2hMarket.outcomes.find((o) => o.name === event.awayTeam);
                              const homeOutcome = h2hMarket.outcomes.find((o) => o.name === event.homeTeam);

                              const isAwayBest = awayOutcome?.price === awayValue.bestPrice;
                              const isHomeBest = homeOutcome?.price === homeValue.bestPrice;

                              return (
                                <tr key={bookmaker.key} className="transition hover:bg-white/5">
                                  <td className="px-3 py-2 font-medium text-white">{bookmaker.title}</td>
                                  <td className={`px-3 py-2 text-right ${isAwayBest && awayValue.hasValue ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                    {awayOutcome?.price
                                      ? awayOutcome.price > 0
                                        ? `+${awayOutcome.price}`
                                        : awayOutcome.price
                                      : 'N/A'}
                                  </td>
                                  <td className={`px-3 py-2 text-right ${isHomeBest && homeValue.hasValue ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                                    {homeOutcome?.price
                                      ? homeOutcome.price > 0
                                        ? `+${homeOutcome.price}`
                                        : homeOutcome.price
                                      : 'N/A'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Spreads */}
                {selectedMarket.includes('spreads') && (
                  <div>
                    <h5 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Spread
                    </h5>
                    <div className="overflow-x-auto rounded-lg border border-white/5">
                      <table className="w-full text-sm">
                        <thead className="border-b border-white/5 bg-black/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Book
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {event.awayTeam}
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {event.homeTeam}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {event.bookmakers.map((bookmaker) => {
                            const spreadsMarket = bookmaker.markets.find((m) => m.key === 'spreads');
                            if (!spreadsMarket) return null;

                            const awayOutcome = spreadsMarket.outcomes.find((o) => o.name === event.awayTeam);
                            const homeOutcome = spreadsMarket.outcomes.find((o) => o.name === event.homeTeam);

                            return (
                              <tr key={bookmaker.key} className="transition hover:bg-white/5">
                                <td className="px-3 py-2 font-medium text-white">{bookmaker.title}</td>
                                <td className="px-3 py-2 text-right text-slate-300">
                                  {awayOutcome?.point !== null && awayOutcome?.price !== null
                                    ? `${awayOutcome.point > 0 ? '+' : ''}${awayOutcome.point} (${
                                        awayOutcome.price > 0 ? '+' : ''
                                      }${awayOutcome.price})`
                                    : 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-300">
                                  {homeOutcome?.point !== null && homeOutcome?.price !== null
                                    ? `${homeOutcome.point > 0 ? '+' : ''}${homeOutcome.point} (${
                                        homeOutcome.price > 0 ? '+' : ''
                                      }${homeOutcome.price})`
                                    : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                {selectedMarket.includes('totals') && (
                  <div>
                    <h5 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Total (Over/Under)
                    </h5>
                    <div className="overflow-x-auto rounded-lg border border-white/5">
                      <table className="w-full text-sm">
                        <thead className="border-b border-white/5 bg-black/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Book
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Over
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Under
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {event.bookmakers.map((bookmaker) => {
                            const totalsMarket = bookmaker.markets.find((m) => m.key === 'totals');
                            if (!totalsMarket) return null;

                            const overOutcome = totalsMarket.outcomes.find((o) => o.name === 'Over');
                            const underOutcome = totalsMarket.outcomes.find((o) => o.name === 'Under');

                            return (
                              <tr key={bookmaker.key} className="transition hover:bg-white/5">
                                <td className="px-3 py-2 font-medium text-white">{bookmaker.title}</td>
                                <td className="px-3 py-2 text-right text-slate-300">
                                  {overOutcome?.point !== null && overOutcome?.price !== null
                                    ? `O ${overOutcome.point} (${
                                        overOutcome.price > 0 ? '+' : ''
                                      }${overOutcome.price})`
                                    : 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-300">
                                  {underOutcome?.point !== null && underOutcome?.price !== null
                                    ? `U ${underOutcome.point} (${
                                        underOutcome.price > 0 ? '+' : ''
                                      }${underOutcome.price})`
                                    : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
