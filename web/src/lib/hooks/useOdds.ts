/**
 * React hook for fetching odds data
 */

import { useState, useEffect, useCallback } from "react";
import type { ProcessedOdds, EVAnalysis } from "@/lib/types/odds-api";

interface OddsResponse {
  success: boolean;
  data?: {
    events: ProcessedOdds[];
    evOpportunities: EVAnalysis[];
    metadata: {
      sport: string;
      eventCount: number;
      evOpportunityCount: number;
      fetchedAt: string;
    };
  };
  error?: string;
}

interface UseOddsOptions {
  sport?: string;
  markets?: string;
  regions?: string;
  bookmakers?: string;
  minEv?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseOddsReturn {
  events: ProcessedOdds[];
  evOpportunities: EVAnalysis[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  metadata: OddsResponse["data"]["metadata"] | null;
}

export function useOdds(options: UseOddsOptions = {}): UseOddsReturn {
  const {
    sport = "basketball_nba",
    markets = "h2h,spreads,totals",
    regions = "us,us2",
    bookmakers,
    minEv = 0,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute default
  } = options;

  const [events, setEvents] = useState<ProcessedOdds[]>([]);
  const [evOpportunities, setEvOpportunities] = useState<EVAnalysis[]>([]);
  const [metadata, setMetadata] = useState<OddsResponse["data"]["metadata"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sport,
        markets,
        regions,
        min_ev: minEv.toString(),
      });

      if (bookmakers) {
        params.append("bookmakers", bookmakers);
      }

      const response = await fetch(`/api/odds?${params.toString()}`);
      const data: OddsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch odds");
      }

      if (data.data) {
        setEvents(data.data.events);
        setEvOpportunities(data.data.evOpportunities);
        setMetadata(data.data.metadata);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("[useOdds] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sport, markets, regions, bookmakers, minEv]);

  // Initial fetch
  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOdds();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOdds]);

  return {
    events,
    evOpportunities,
    isLoading,
    error,
    refetch: fetchOdds,
    metadata,
  };
}
