import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import type { AlertEvent, Database, EdgeAlert } from "@shared/types.ts";
import { normalizeAction } from "./normalize-action.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
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

  try {
    const supabase = createServiceRoleClient();
    const alert = await acknowledgeAlert(supabase, payload);
    return jsonResponse({ status: "ok", alert });
  } catch (error) {
    console.error("edge-alerts-ack: failed to process acknowledgment", payload.alertId, error);
    return errorResponse(
      "Failed to acknowledge alert",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
