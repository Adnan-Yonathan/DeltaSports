import { NextRequest } from "next/server";
import { z } from "zod";

import { getServerEnv, hasFeature } from "@/lib/env";
import { runDeltaConversation } from "@/lib/llmClient";
import { getLogger } from "@/lib/telemetry/logger";

const encoder = new TextEncoder();

const requestSchema = z.object({
  prompt: z.string().min(1),
  sessionId: z.string().max(128).optional(),
  sportKey: z.string().optional(),
  marketKey: z.string().optional(),
  quickPromptId: z.string().optional(),
});

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

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const { answer, trace } = await runDeltaConversation(parsed.data.prompt);

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

    logger.info({ prompt: parsed.data.prompt, trace, cacheTtl: env.cacheTtlSeconds }, "chat session completed");

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
