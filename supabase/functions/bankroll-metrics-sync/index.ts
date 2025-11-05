import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import { extractBetRecord, processBankrollMetrics } from "./metrics.ts";
import type { SupabasePayload } from "./metrics.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: SupabasePayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("bankroll-metrics-sync: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  const bet = extractBetRecord(payload);
  if (!bet) {
    return errorResponse("Unsupported payload", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const metrics = await processBankrollMetrics(supabase, bet.user_id);
    return jsonResponse({ status: "ok", metrics });
  } catch (error) {
    console.error("bankroll-metrics-sync: failed to build metrics", error);
    return errorResponse(
      "Failed to calculate bankroll metrics",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
