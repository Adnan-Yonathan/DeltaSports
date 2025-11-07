import { NextRequest } from "next/server";

import {
  isAssistantError,
  transformAssistantPayload,
  type OddsAssistantPayload,
} from "@/lib/chat/transform";

const DEFAULT_SPORT_KEY = "basketball_nba";

const requiredEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return { supabaseUrl, supabaseServiceKey } as const;
};

const encoder = new TextEncoder();

const sendEvent = (controller: ReadableStreamDefaultController<Uint8Array>, patch: Record<string, unknown>) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(patch)}\n\n`));
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const prompt = toStringOrUndefined(body.prompt);
  if (!prompt) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  const sessionId = toStringOrUndefined(body.sessionId);
  if (sessionId && sessionId.length > 128) {
    return Response.json({ error: "Session ID is too long." }, { status: 400 });
  }

  const sportKey = toStringOrUndefined(body.sportKey) ?? DEFAULT_SPORT_KEY;
  const marketKey = toStringOrUndefined(body.marketKey);
  const userProfileId = toStringOrUndefined(body.userProfileId);
  const tonePreference = toStringOrUndefined(body.tonePreference) ?? 'neutral';
  const quickPromptId = toStringOrUndefined(body.quickPromptId);

  const env = requiredEnv();
  if (!env) {
    return Response.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  let edgeResponse: Response;
  try {
    edgeResponse = await fetch(`${env.supabaseUrl}/functions/v1/odds-assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: prompt,
        sportKey,
        markets: marketKey,
        userProfileId,
        tonePreference,
        sessionId,
        quickPromptId,
      }),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    console.error("/api/chat: failed to reach odds-assistant", error);
    return Response.json({ error: "Unable to contact the odds assistant." }, { status: 502 });
  }

  if (!edgeResponse.ok) {
    let errorMessage = `Odds assistant request failed (${edgeResponse.status}).`;
    try {
      const data = (await edgeResponse.json()) as Record<string, unknown>;
      if (typeof data.message === "string" && data.message.trim().length > 0) {
        errorMessage = data.message.trim();
      } else if (typeof data.error === "string" && data.error.trim().length > 0) {
        errorMessage = data.error.trim();
      }
    } catch {
      try {
        const text = await edgeResponse.text();
        if (text.trim().length > 0) {
          errorMessage = text.trim();
        }
      } catch {
        // ignore
      }
    }

    return Response.json({ error: errorMessage }, { status: edgeResponse.status });
  }

  let payload: OddsAssistantPayload;
  try {
    payload = (await edgeResponse.json()) as OddsAssistantPayload;
  } catch (error) {
    console.error("/api/chat: invalid response from odds-assistant", error);
    return Response.json({ error: "Received an invalid response from the odds assistant." }, { status: 502 });
  }

  if (isAssistantError(payload)) {
    return Response.json({ error: payload.message }, { status: 502 });
  }

  const transformed = transformAssistantPayload(payload);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sendEvent(controller, { headline: transformed.headline });
      if (transformed.summary) {
        sendEvent(controller, { summary: transformed.summary });
      }
      if (transformed.odds) {
        sendEvent(controller, { odds: transformed.odds });
      }
      if (transformed.sections.length > 0) {
        sendEvent(controller, { sections: transformed.sections });
      }
      if (transformed.sources.length > 0) {
        sendEvent(controller, { sources: transformed.sources });
      }
      if (transformed.warnings.length > 0) {
        sendEvent(controller, { warnings: transformed.warnings });
      }
      sendEvent(controller, { status: "complete" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
