import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import {
  DEFAULT_TONE,
  buildAlertMessage,
  type DispatchAlert,
} from "../edge-alerts-dispatch/messages.ts";

const baseAlert: DispatchAlert = {
  market: "Team A vs Team B",
  sportsbook: "SharpBook",
  edgeValue: 0.12,
};

Deno.test("buildAlertMessage uses default concise tone", () => {
  const message = buildAlertMessage(baseAlert, DEFAULT_TONE);
  assertEquals(message, "Team A vs Team B @ SharpBook: 12.0% edge");
});

Deno.test("buildAlertMessage formats engaging tone", () => {
  const message = buildAlertMessage(baseAlert, "engaging");
  assertEquals(
    message,
    "🚨 Team A vs Team B: SharpBook is hanging value (12.0% edge). Jump before it moves!",
  );
});

Deno.test("buildAlertMessage formats analytical tone with trigger threshold", () => {
  const message = buildAlertMessage(
    { ...baseAlert, triggerThreshold: 0.15 },
    "analytical",
  );
  assertEquals(
    message,
    "Team A vs Team B @ SharpBook => 12.0% edge; trigger 15% | origin model",
  );
});
