import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import { dispatchAlerts } from "./dispatcher.ts";
import type { DispatchPayload } from "./dispatcher.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
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

  try {
    const supabase = createServiceRoleClient();
    const { alerts, notifications } = await dispatchAlerts(supabase, payload);

    if (alerts.length === 0) {
      return errorResponse("No alerts dispatched", 500);
    }

    return jsonResponse({
      status: "ok",
      alerts,
      notifications,
    });
  } catch (error) {
    console.error("edge-alerts-dispatch: failed to dispatch alerts", error);
    return errorResponse(
      "Failed to dispatch alerts",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
