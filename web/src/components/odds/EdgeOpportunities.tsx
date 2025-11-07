'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Opportunity = {
  eventId: string;
  eventName: string;
  sportTitle: string;
  commenceTime: string | null;
  outcome: string;
  market: string;
  bestOdds: number;
  bestBook: string;
  ev: number;
};

export function EdgeOpportunities() {
  const { userProfile } = useSupabaseAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchOpportunities = useCallback(async () => {
    if (!userProfile?.id) {
      return;
    }

    setLoading(true);

    try {
      // Fetch odds for NBA and NFL
      const sports = ['basketball_nba', 'americanfootball_nfl'];
      const allOpps: Opportunity[] = [];

      for (const sport of sports) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'Get current odds',
            sportKey: sport,
            regions: 'us',
            markets: 'h2h,spreads,totals',
            bookmakers: 'draftkings,fanduel,betmgm',
            userProfileId: userProfile.id,
            streamResponse: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.odds_snapshot && data.odds_snapshot.events) {
            // Process each event to find value opportunities
            for (const event of data.odds_snapshot.events) {
              // Check moneyline
              if (event.bookmakers && event.bookmakers.length > 0) {
                const awayValue = calculateMarketValue(event.bookmakers, 'h2h', event.awayTeam);
                const homeValue = calculateMarketValue(event.bookmakers, 'h2h', event.homeTeam);

                if (awayValue.hasValue) {
                  allOpps.push({
                    eventId: event.id,
                    eventName: `${event.awayTeam} @ ${event.homeTeam}`,
                    sportTitle: event.sportTitle || sport,
                    commenceTime: event.commenceTime,
                    outcome: event.awayTeam,
                    market: 'Moneyline',
                    bestOdds: awayValue.bestPrice || 0,
                    bestBook: awayValue.bestBook || '',
                    ev: awayValue.ev,
                  });
                }

                if (homeValue.hasValue) {
                  allOpps.push({
                    eventId: event.id,
                    eventName: `${event.awayTeam} @ ${event.homeTeam}`,
                    sportTitle: event.sportTitle || sport,
                    commenceTime: event.commenceTime,
                    outcome: event.homeTeam,
                    market: 'Moneyline',
                    bestOdds: homeValue.bestPrice || 0,
                    bestBook: homeValue.bestBook || '',
                    ev: homeValue.ev,
                  });
                }
              }
            }
          }
        }
      }

      // Sort by EV descending
      allOpps.sort((a, b) => b.ev - a.ev);

      setOpportunities(allOpps.slice(0, 10)); // Top 10
      setLastFetch(new Date());
    } catch (error) {
      console.error('Error fetching edge opportunities', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    void fetchOpportunities();
  }, [fetchOpportunities]);

  const calculateMarketValue = (bookmakers: any[], marketKey: string, outcomeName: string) => {
    const americanToDecimal = (american: number): number => {
      return american > 0 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
    };

    const allOdds: number[] = [];
    bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets?.find((m: any) => m.key === marketKey);
      if (market) {
        const outcome = market.outcomes?.find((o: any) => o.name === outcomeName);
        if (outcome && outcome.price !== null) {
          allOdds.push(outcome.price);
        }
      }
    });

    if (allOdds.length === 0) {
      return { bestPrice: null, bestBook: null, ev: 0, hasValue: false };
    }

    const decimalOdds = allOdds.map(americanToDecimal);
    const impliedProbs = decimalOdds.map((d) => 1 / d);
    const consensusProb = impliedProbs.reduce((sum, prob) => sum + prob, 0) / impliedProbs.length;

    let bestPrice: number | null = null;
    let bestBook: string | null = null;
    let bestDecimal = 0;

    bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets?.find((m: any) => m.key === marketKey);
      if (market) {
        const outcome = market.outcomes?.find((o: any) => o.name === outcomeName);
        if (outcome && outcome.price !== null) {
          const decimal = americanToDecimal(outcome.price);
          if (
            bestPrice === null ||
            (outcome.price > 0 && outcome.price > bestPrice) ||
            (outcome.price < 0 && bestPrice < 0 && outcome.price > bestPrice)
          ) {
            bestPrice = outcome.price;
            bestBook = bookmaker.title;
            bestDecimal = decimal;
          }
        }
      }
    });

    const ev = bestDecimal > 0 ? (bestDecimal * consensusProb - 1) * 100 : 0;
    const hasValue = ev > 0.5;

    return { bestPrice, bestBook, ev, hasValue };
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Edge Opportunities</h3>
          <p className="text-xs text-slate-300">
            Value bets based on market discrepancies across sportsbooks.
          </p>
        </div>
        <Link
          href="/odds-scanner"
          className="text-xs font-semibold text-brand-accent transition hover:text-brand-accent/80"
        >
          View All →
        </Link>
      </header>

      {loading && !lastFetch && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">Scanning for value...</p>
        </div>
      )}

      {!loading && opportunities.length === 0 && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400">No edge opportunities found at the moment</p>
        </div>
      )}

      {opportunities.length > 0 && (
        <div className="space-y-2">
          {opportunities.map((opp, index) => (
            <div
              key={`${opp.eventId}-${opp.outcome}-${index}`}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {opp.sportTitle}
                    </span>
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                      +{opp.ev.toFixed(2)}% EV
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{opp.eventName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {opp.commenceTime ? new Date(opp.commenceTime).toLocaleString() : 'TBD'}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-xs text-slate-400">{opp.market}</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {opp.bestOdds > 0 ? '+' : ''}
                    {opp.bestOdds}
                  </p>
                  <p className="text-xs text-slate-400">@ {opp.bestBook}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-xs text-slate-400">
                  <span className="font-medium text-white">{opp.outcome}</span> • Market consensus indicates{' '}
                  {opp.ev.toFixed(2)}% positive expected value
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastFetch && (
        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
          <span>Last updated: {lastFetch.toLocaleTimeString()}</span>
          <button
            type="button"
            onClick={fetchOpportunities}
            disabled={loading}
            className="text-brand-accent transition hover:text-brand-accent/80 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}
    </div>
  );
}
