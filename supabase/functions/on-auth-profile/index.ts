import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import type { Database } from "@shared/types.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: AuthWebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("on-auth-profile: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await bootstrapUserProfile(supabase, payload);

    return jsonResponse({
      status: "ok",
      profile: result.profile,
      checklist: result.checklist,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Missing auth user id") {
      console.error("on-auth-profile: missing auth user id", payload);
      return errorResponse("Missing auth user id", 400);
    }
    console.error("on-auth-profile: failed to upsert profile", error);
    return errorResponse(
      "Failed to upsert user profile",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
