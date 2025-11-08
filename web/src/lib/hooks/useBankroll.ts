/**
 * useBankroll Hook
 * Manages bankroll data fetching and state
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  BankrollSummary,
  BankrollAccount,
  BankrollMetrics,
  BetWithTags,
  PerformanceByCategory,
} from "@/lib/types/bankroll";

interface UseBankrollOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseBankrollReturn {
  account: BankrollAccount | null;
  metrics: BankrollMetrics | null;
  recentBets: BetWithTags[];
  performanceBySport: PerformanceByCategory[];
  performanceByMarket: PerformanceByCategory[];
  topTags: Array<{ tag: string; count: number }>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBankroll(options: UseBankrollOptions = {}): UseBankrollReturn {
  const { autoRefresh = false, refreshInterval = 60000 } = options;

  const [account, setAccount] = useState<BankrollAccount | null>(null);
  const [metrics, setMetrics] = useState<BankrollMetrics | null>(null);
  const [recentBets, setRecentBets] = useState<BetWithTags[]>([]);
  const [performanceBySport, setPerformanceBySport] = useState<PerformanceByCategory[]>([]);
  const [performanceByMarket, setPerformanceByMarket] = useState<PerformanceByCategory[]>([]);
  const [topTags, setTopTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankroll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bankroll");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch bankroll data");
      }

      const data: BankrollSummary = result.data;

      setAccount(data.account);
      setMetrics(data.metrics);
      setRecentBets(data.recentBets);
      setPerformanceBySport(data.performanceBySport);
      setPerformanceByMarket(data.performanceByMarket);
      setTopTags(data.topTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Failed to fetch bankroll:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBankroll();
  }, [fetchBankroll]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBankroll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBankroll]);

  return {
    account,
    metrics,
    recentBets,
    performanceBySport,
    performanceByMarket,
    topTags,
    isLoading,
    error,
    refetch: fetchBankroll,
  };
}
