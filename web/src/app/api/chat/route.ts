import { NextResponse } from "next/server";

import type { AssistantStreamPatch } from "@/lib/chat/patch";
import type { ConversationSnapshot } from "@/lib/chat/server/orchestrator";
import {
  applyPromptGuardrails,
  registerRequest,
  resolveThrottleKey,
} from "@/lib/chat/server/guardrails";
import {
  buildResponsePatches,
  composeAssistantContent,
  executePlan,
  planSportsQuery,
} from "@/lib/chat/server/orchestrator";
import { logGuardrailEvent } from "@/lib/chat/server/telemetry";
import { maybeGenerateNarrative } from "@/lib/llm/narrative";

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

type ChatRequestBody = {
  prompt?: string;
  conversation?: ConversationSnapshot[];
  sessionId?: string;
  distinctId?: string | null;
};

const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  let payload: ChatRequestBody;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400 },
    );
  }

  const guardrailOutcome = applyPromptGuardrails(prompt);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const throttleKey = resolveThrottleKey(payload.sessionId, payload.distinctId, ip);
  const throttleResult = registerRequest(throttleKey);

  if (!throttleResult.allowed) {
    const retryAfterSeconds = Math.ceil(throttleResult.retryAfterMs / 1000);
    const message = "We’re handling a few requests at once. Give it a moment before trying again.";
    logGuardrailEvent("warn", "Rate limit triggered", {
      throttleKey,
      retryAfterMs: throttleResult.retryAfterMs,
    });
    return NextResponse.json(
      { error: message, guardrail: "rate_limited", retryAfterMs: throttleResult.retryAfterMs },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
      },
    );
  }

  if (guardrailOutcome.blocked) {
    logGuardrailEvent("warn", "Prompt blocked by guardrail", {
      reason: guardrailOutcome.blocked.reason,
    });
    return NextResponse.json(
      { error: guardrailOutcome.blocked.message, guardrail: guardrailOutcome.blocked.code },
      { status: 400 },
    );
  }

  if (guardrailOutcome.redactions.length) {
    logGuardrailEvent("info", "Prompt redactions applied", {
      fields: guardrailOutcome.redactions,
    });
  }

  const sanitizedPrompt = guardrailOutcome.sanitizedPrompt;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const sendPatch = (patch: AssistantStreamPatch) => {
        send(patch as Record<string, unknown>);
      };

      let patchCount = 0;

      try {
        const plan = planSportsQuery(sanitizedPrompt, payload.conversation);

        const executions = await executePlan(sanitizedPrompt, plan, {
        });

        const narrativeOutcome = await maybeGenerateNarrative({
          prompt: sanitizedPrompt,
          plan,
          primaryResult: executions[0]?.result ?? null,
        });

        const content = composeAssistantContent(
          sanitizedPrompt,
          plan,
          executions,
          narrativeOutcome.status === "generated" ? narrativeOutcome.overrides : undefined,
        );

        const patches = buildResponsePatches(content);
        for (const patch of patches) {
          sendPatch(patch);
          patchCount += 1;
          await waitFor(60);
        }

        sendPatch({ status: "complete" });
        send({ type: "done" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: STREAM_HEADERS,
  });
}
