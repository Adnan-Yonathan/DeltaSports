import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { requireUser, UnauthorizedError } from "../_shared/auth.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../_shared/response.ts";
import type { AlertEvent, Database, EdgeAlert } from "../_shared/types.ts";

type AckPayload = {
  alertId: string;
  userId?: string | null;
  action?: string;
  metadata?: Record<string, unknown>;
  resolveAlert?: boolean;
};

function normalizeAction(action?: string): string {
  if (!action) {
    return "acknowledged";
  }
  const trimmed = action.trim();
  return trimmed.length > 0 ? trimmed : "acknowledged";
}

async function logEvent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: AckPayload,
  alert: EdgeAlert,
  userId: string,
): Promise<void> {
  const eventPayload: Database["public"]["Tables"]["alert_events"]["Insert"] = {
    alert_id: alert.id,
    user_id: userId,
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
): Promise<EdgeAlert> {
  const { data, error } = await supabase
    .from("edge_alerts")
    .update({ status: "acknowledged", resolved_at: new Date().toISOString() })
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
): Promise<EdgeAlert> {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let authUserId: string;
  try {
    const user = await requireUser(req);
    authUserId = user.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorResponse(error.message, error.status);
    }
    console.error("edge-alerts-ack: failed to authenticate request", error);
    return errorResponse("Unauthorized", 401);
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

    if (alert.user_id && alert.user_id !== authUserId) {
      return errorResponse("Forbidden", 403);
    }
    if (payload.userId && payload.userId !== authUserId) {
      return errorResponse("Forbidden", 403);
    }

    const shouldResolve = payload.resolveAlert === true && alert.user_id === authUserId;
    const updatedAlert = shouldResolve ? await resolveAlert(supabase, payload.alertId) : alert;

    await logEvent(supabase, payload, updatedAlert, authUserId);
    return jsonResponse({ status: "ok", alert: updatedAlert });
  } catch (error) {
    console.error("edge-alerts-ack: failed to process acknowledgment", payload.alertId, error);
    if (error instanceof UnauthorizedError) {
      return errorResponse(error.message, error.status);
    }
    const message = error instanceof Error ? error.message : String(error);
    const notFound = message.includes("PGRST116");
    return errorResponse(
      notFound ? "Alert not found" : "Failed to acknowledge alert",
      notFound ? 404 : 500,
      message,
    );
  }
});
