import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../_shared/response.ts";
import type { AlertEvent, AlertOrigin, Database, EdgeAlert } from "../_shared/types.ts";
import {
  buildAlertMessage,
  DEFAULT_TONE,
  DispatchAlert,
  DispatchTone,
  Notification,
} from "./messages.ts";

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

type DispatchPayload = {
  alerts: DispatchAlert[];
  defaultTone?: DispatchTone;
};

async function insertEdgeAlert(
  supabase: SupabaseClient,
  alert: DispatchAlert,
  tone: DispatchTone,
): Promise<{ alert: EdgeAlert; notification: Notification }> {
  const origin: AlertOrigin = alert.origin ?? "model";
  const triggerThreshold = alert.triggerThreshold ?? Math.max(alert.edgeValue, 0);
  const message = buildAlertMessage(alert, tone);

  const insertPayload: Database["public"]["Tables"]["edge_alerts"]["Insert"] = {
    origin,
    market: alert.market,
    sportsbook: alert.sportsbook,
    edge_value: alert.edgeValue,
    trigger_threshold: triggerThreshold,
    message,
    status: "active",
    source_handle: alert.sourceHandle ?? null,
    user_id: alert.userId ?? null,
  };

  const { data, error } = await supabase
    .from("edge_alerts")
    .insert(insertPayload)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to insert edge alert: ${error.message}`);
  }
  const record = data as EdgeAlert;

  const metadata = {
    tone,
    true_probability: alert.trueProbability ?? null,
    url: alert.url ?? null,
    ...alert.metadata,
  } as AlertEvent["metadata"];

  const { error: eventError } = await supabase
    .from("alert_events")
    .insert({
      alert_id: record.id,
      user_id: record.user_id,
      action: "dispatched",
      metadata,
    });
  if (eventError) {
    console.error("edge-alerts-dispatch: failed to log dispatch event", record.id, eventError);
  }

  return {
    alert: record,
    notification: {
      alertId: record.id,
      market: record.market,
      sportsbook: record.sportsbook ?? alert.sportsbook,
      message,
      tone,
      url: alert.url,
    },
  };
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: DispatchPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("edge-alerts-dispatch: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.alerts || payload.alerts.length === 0) {
    return errorResponse("At least one alert is required", 400);
  }

  const supabase = createServiceRoleClient();
  const tone = payload.defaultTone ?? DEFAULT_TONE;

  const results: EdgeAlert[] = [];
  const notifications: Notification[] = [];

  for (const alert of payload.alerts) {
    if (!alert.market || !alert.sportsbook || typeof alert.edgeValue !== "number") {
      console.error("edge-alerts-dispatch: skipping malformed alert", alert);
      continue;
    }
    const alertTone = alert.tone ?? tone;
    try {
      const { alert: record, notification } = await insertEdgeAlert(supabase, alert, alertTone);
      results.push(record);
      notifications.push(notification);
    } catch (error) {
      console.error("edge-alerts-dispatch: failed to store alert", alert.market, alert.sportsbook, error);
    }
  }

  if (results.length === 0) {
    return errorResponse("No alerts dispatched", 500);
  }

  return jsonResponse({
    status: "ok",
    alerts: results,
    notifications,
  });
};

if (import.meta.main) {
  serve(handler);
}
