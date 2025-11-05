import { createServiceRoleClient } from "@shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "@shared/response.ts";
import { publishCreatorUpdate } from "./publish.ts";
import type { PublishPayload } from "./publish.ts";

Deno.serve((req) => handler(req));

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: PublishPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("creator-feed-publish: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.title || !payload.content) {
    return errorResponse("title and content are required", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await publishCreatorUpdate(supabase, payload);
    return jsonResponse({ status: "ok", ...result });
  } catch (error) {
    console.error("creator-feed-publish: failed to publish", error);
    return errorResponse(
      "Failed to publish creator update",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}
