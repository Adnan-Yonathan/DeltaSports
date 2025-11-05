import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type {
  AlertEvent,
  EdgeAlert,
  TablesInsert,
  TablesUpdate,
} from "../shared/types.ts";
import { normalizeAction } from "./normalize-action.ts";

type AckPayload = {
  alertId: string;
  userId?: string | null;
  action?: string;
  metadata?: Record<string, unknown>;
  resolveAlert?: boolean;
};

async function logEvent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: AckPayload,
  alert: EdgeAlert,
) {
  const eventPayload: TablesInsert<"alert_events"> = {
    alert_id: alert.id,
    user_id: payload.userId ?? alert.user_id ?? null,
    action: normalizeAction(payload.action),
    metadata: {
      ...(payload.metadata ?? {}),
      acknowledged_at: new Date().toISOString(),
    } as AlertEvent["metadata"],
  };

  const { error } = await supabase
    .from("alert_events")
    .insert(eventPayload);
  if (error) {
    throw new Error(`Failed to insert alert event: ${error.message}`);
  }
}

async function resolveAlert(
  supabase: ReturnType<typeof createServiceRoleClient>,
  alertId: string,
) {
  const updatePayload: TablesUpdate<"edge_alerts"> = {
    status: "acknowledged",
    resolved_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("edge_alerts")
    .update(updatePayload)
    .eq("id", alertId)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to update alert status: ${error.message}`);
  }
  return data as EdgeAlert;
}

async function fetchAlert(
  supabase: ReturnType<typeof createServiceRoleClient>,
  alertId: string,
) {
  const { data, error } = await supabase
    .from("edge_alerts")
    .select("*")
    .eq("id", alertId)
    .single();
  if (error) {
    throw new Error(`Failed to fetch alert: ${error.message}`);
  }
  return data as EdgeAlert;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: AckPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("edge-alerts-ack: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.alertId) {
    return errorResponse("alertId is required", 400);
  }

  const supabase = createServiceRoleClient();

  try {
    const alert = await fetchAlert(supabase, payload.alertId);
    const updatedAlert = payload.resolveAlert
      ? await resolveAlert(supabase, payload.alertId)
      : alert;
    await logEvent(supabase, payload, updatedAlert);
    return jsonResponse({ status: "ok", alert: updatedAlert });
  } catch (error) {
    console.error("edge-alerts-ack: failed to process acknowledgment", payload.alertId, error);
    return errorResponse(
      "Failed to acknowledge alert",
      500,
      error instanceof Error ? error.message : error,
    );
  }
};

if (import.meta.main) {
  serve(handler);
}
