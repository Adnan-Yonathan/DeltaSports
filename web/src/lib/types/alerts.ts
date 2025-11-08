/**
 * TypeScript types for Edge Alert System
 * Matches Supabase schema from sql-prompts.md
 */

// Alert origin enum (matches database type)
export type AlertOrigin = "model" | "manual";

// Alert status
export type AlertStatus = "active" | "acknowledged" | "dismissed";

// Edge Alert
export interface EdgeAlert {
  id: string;
  user_id: string;
  origin: AlertOrigin;
  trigger_ev_threshold: number;
  event_name: string;
  market: string;
  bookmaker: string;
  odds: number;
  ev_percentage: number;
  confidence_score: number | null;
  reasoning: string | null;
  triggered_at: string;
  acknowledged_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Alert with computed status
export interface EdgeAlertWithStatus extends EdgeAlert {
  status: AlertStatus;
}

// Alert Event (for logging)
export interface AlertEvent {
  id: string;
  alert_id: string;
  event_type: "triggered" | "acknowledged" | "dismissed" | "expired";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Alert Settings (user preferences)
export interface AlertSettings {
  user_id: string;
  min_ev_threshold: number;
  min_confidence: number;
  enabled_sports: string[];
  enabled_markets: string[];
  notification_channels: ("email" | "push" | "sms")[];
  auto_dismiss_after_hours: number;
  created_at: string;
  updated_at: string;
}

// Alert Summary (for dashboard)
export interface AlertSummary {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  dismissedAlerts: number;
  highestEV: number;
  averageEV: number;
  alertsByOrigin: {
    model: number;
    manual: number;
  };
  recentAlerts: EdgeAlertWithStatus[];
}

// Create Alert Request
export interface CreateAlertRequest {
  user_id: string;
  origin: AlertOrigin;
  trigger_ev_threshold: number;
  event_name: string;
  market: string;
  bookmaker: string;
  odds: number;
  ev_percentage: number;
  confidence_score?: number;
  reasoning?: string;
}

// Update Alert Request
export interface UpdateAlertRequest {
  acknowledged_at?: string | null;
  dismissed_at?: string | null;
}

// Alert Filter Options
export interface AlertFilterOptions {
  status?: AlertStatus;
  origin?: AlertOrigin;
  minEV?: number;
  sport?: string;
  market?: string;
  dateFrom?: string;
  dateTo?: string;
}

// API Responses
export interface AlertsResponse {
  success: boolean;
  data?: EdgeAlertWithStatus[];
  error?: string;
}

export interface AlertSummaryResponse {
  success: boolean;
  data?: AlertSummary;
  error?: string;
}

export interface CreateAlertResponse {
  success: boolean;
  data?: EdgeAlert;
  error?: string;
}

// Helper function to compute alert status
export function computeAlertStatus(alert: EdgeAlert): AlertStatus {
  if (alert.dismissed_at) return "dismissed";
  if (alert.acknowledged_at) return "acknowledged";
  return "active";
}

// Helper function to add status to alert
export function withStatus(alert: EdgeAlert): EdgeAlertWithStatus {
  return {
    ...alert,
    status: computeAlertStatus(alert),
  };
}

// Alert priority tiers
export const ALERT_PRIORITY = {
  CRITICAL: { minEV: 10, label: "Critical", color: "red" },
  HIGH: { minEV: 5, label: "High", color: "orange" },
  MEDIUM: { minEV: 2, label: "Medium", color: "yellow" },
  LOW: { minEV: 0, label: "Low", color: "blue" },
} as const;

export function getAlertPriority(evPercentage: number) {
  if (evPercentage >= ALERT_PRIORITY.CRITICAL.minEV) return ALERT_PRIORITY.CRITICAL;
  if (evPercentage >= ALERT_PRIORITY.HIGH.minEV) return ALERT_PRIORITY.HIGH;
  if (evPercentage >= ALERT_PRIORITY.MEDIUM.minEV) return ALERT_PRIORITY.MEDIUM;
  return ALERT_PRIORITY.LOW;
}
