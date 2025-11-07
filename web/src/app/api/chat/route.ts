import { NextRequest } from "next/server";

import { getServerEnv, hasFeature } from "@/lib/env";
import { runDeltaConversation } from "@/lib/llmClient";
import { getLogger } from "@/lib/telemetry/logger";

const encoder = new TextEncoder();

type ChatRequest = {
  prompt: string;
  sessionId?: string;
  sportKey?: string;
  marketKey?: string;
  quickPromptId?: string;
};

const parseRequest = (value: unknown): ChatRequest | { error: string } => {
  if (typeof value !== "object" || value === null) {
    return { error: "Payload must be an object." };
  }

  const record = value as Record<string, unknown>;
  const rawPrompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  if (!rawPrompt) {
    return { error: "Prompt is required." };
  }

  const normalizeOptional = (key: string, maxLength?: number) => {
    const raw = record[key];
    if (typeof raw !== "string") {
      return undefined;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }
    if (maxLength && trimmed.length > maxLength) {
      return undefined;
    }
    return trimmed;
  };

  return {
    prompt: rawPrompt,
    sessionId: normalizeOptional("sessionId", 128),
    sportKey: normalizeOptional("sportKey"),
    marketKey: normalizeOptional("marketKey"),
    quickPromptId: normalizeOptional("quickPromptId"),
  };
};

const sendEvent = (controller: ReadableStreamDefaultController<Uint8Array>, patch: Record<string, unknown>) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(patch)}\n\n`));
};

export async function POST(request: NextRequest) {
  const logger = getLogger();
  const env = getServerEnv();

  if (!hasFeature("llm_insights")) {
    return Response.json({ error: "LLM insights are disabled." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = parseRequest(json);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { answer, trace } = await runDeltaConversation(parsed.prompt);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        sendEvent(controller, { headline: "Grounded response" });
        sendEvent(controller, { summary: answer.answer });
        sendEvent(controller, { answer: answer.answer });
        sendEvent(controller, { widgets: answer.widgets ?? [] });
        sendEvent(controller, { sources: answer.sources });
        sendEvent(controller, { confidence: answer.confidence });
        if (answer.caveats && answer.caveats.length > 0) {
          sendEvent(controller, { caveats: answer.caveats });
        }
        sendEvent(controller, { trace });
        sendEvent(controller, { status: "complete" });
        controller.close();
      },
      cancel() {
        logger.info({ event: "chat_stream_cancelled" }, "Client cancelled chat stream");
      },
    });

    logger.info({ prompt: parsed.prompt, trace, cacheTtl: env.cacheTtlSeconds }, "chat session completed");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "chat session failed");
    return Response.json({ error: "Assistant failed to complete the request." }, { status: 502 });
  }
}
