import type { createServiceRoleClient } from "@shared/client.ts";
import type { AlertEvent, Database, EdgeAlert } from "@shared/types.ts";
import { normalizeAction } from "./normalize-action.ts";

export type AckPayload = {
  alertId: string;
  userId?: string | null;
  action?: string;
  metadata?: Record<string, unknown>;
  resolveAlert?: boolean;
};

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

async function fetchAlert(
  supabase: SupabaseClient,
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

async function resolveAlert(
  supabase: SupabaseClient,
  alertId: string,
) {
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

async function logEvent(
  supabase: SupabaseClient,
  payload: AckPayload,
  alert: EdgeAlert,
) {
  const eventPayload: Database["public"]["Tables"]["alert_events"]["Insert"] = {
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

export async function acknowledgeAlert(
  supabase: SupabaseClient,
  payload: AckPayload,
): Promise<EdgeAlert> {
  const alert = await fetchAlert(supabase, payload.alertId);
  const updatedAlert = payload.resolveAlert
    ? await resolveAlert(supabase, payload.alertId)
    : alert;

  await logEvent(supabase, payload, updatedAlert);
  return updatedAlert;
}
