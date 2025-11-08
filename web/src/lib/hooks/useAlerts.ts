/**
 * useAlerts Hook
 * Manages edge alerts data fetching and state
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { AlertSummary, EdgeAlertWithStatus } from "@/lib/types/alerts";

interface UseAlertsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseAlertsReturn {
  alerts: EdgeAlertWithStatus[];
  summary: AlertSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { autoRefresh = false, refreshInterval = 60000 } = options;

  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [alerts, setAlerts] = useState<EdgeAlertWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/alerts");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch alerts");
      }

      const data: AlertSummary = result.data;

      setSummary(data);
      setAlerts(data.recentAlerts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Failed to fetch alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acknowledged_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to acknowledge alert");
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, acknowledged_at: new Date().toISOString(), status: "acknowledged" }
            : alert
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      throw err;
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dismissed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to dismiss alert");
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, dismissed_at: new Date().toISOString(), status: "dismissed" }
            : alert
        )
      );
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAlerts]);

  return {
    alerts,
    summary,
    isLoading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
    dismissAlert,
  };
}
