import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import { buildChatDigest } from "./digest.ts";
import type { DigestPayload } from "./digest.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: DigestPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("chat-digest: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.userProfileId) {
    return errorResponse("userProfileId is required", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const digest = await buildChatDigest(supabase, payload);
    return jsonResponse(digest);
  } catch (error) {
    console.error("chat-digest: failed to build digest", payload.userProfileId, error);
    return errorResponse(
      "Failed to generate chat digest",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
