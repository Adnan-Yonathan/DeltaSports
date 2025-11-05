import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import type { Database, EdgeAlert } from "@shared/types.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: RefreshPayload = {};
  try {
    if (req.headers.get("content-length") && Number(req.headers.get("content-length")) > 0) {
      payload = await req.json();
    }
  } catch (error) {
    console.error("ev-scanner-refresh: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const { alerts, summary } = await refreshEdgeAlerts(supabase, payload);
    return jsonResponse({ status: "ok", alerts, summary });
  } catch (error) {
    if (error instanceof RefreshInputError) {
      return errorResponse(error.message, error.status);
    }
    console.error("ev-scanner-refresh: failed to refresh edges", error);
    return errorResponse(
      "Failed to refresh edge alerts",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
