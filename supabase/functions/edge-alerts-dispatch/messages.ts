import type { AlertOrigin } from "../shared/database.types.ts";

export type DispatchTone = "concise" | "engaging" | "analytical";

export type DispatchAlert = {
  market: string;
  sportsbook: string;
  edgeValue: number;
  triggerThreshold?: number;
  trueProbability?: number;
  origin?: AlertOrigin | null;
  sourceHandle?: string | null;
  userId?: string | null;
  url?: string;
  tone?: DispatchTone;
  metadata?: Record<string, unknown>;
};

export type Notification = {
  alertId: string;
  market: string;
  sportsbook: string;
  message: string;
  tone: DispatchTone;
  url?: string;
};

export const DEFAULT_TONE: DispatchTone = "concise";

export function buildAlertMessage(alert: DispatchAlert, tone: DispatchTone): string {
  const pctEdge = (alert.edgeValue * 100).toFixed(1);
  const oddsString = alert.edgeValue >= 0
    ? `${pctEdge}% edge`
    : `${Math.abs(alert.edgeValue * 100).toFixed(1)}% negative EV`;

  switch (tone) {
    case "engaging":
      return `🚨 ${alert.market}: ${alert.sportsbook} is hanging value (${oddsString}). Jump before it moves!`;
    case "analytical":
      return `${alert.market} @ ${alert.sportsbook} => ${oddsString}; trigger ${
        (alert.triggerThreshold ?? 0) * 100
      }% | origin ${alert.origin ?? "model"}`;
    default:
      return `${alert.market} @ ${alert.sportsbook}: ${oddsString}`;
  }
}
