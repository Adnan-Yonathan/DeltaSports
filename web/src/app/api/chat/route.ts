import { randomUUID } from "crypto";

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
import {
  captureServerEvent,
  initializeInstrumentation,
  shutdownInstrumentation,
} from "@/lib/llm/instrumentation";
import { maybeGenerateNarrative } from "@/lib/llm/narrative";

const ANALYTICS_EXPERIMENT_VERSION = "chat-llm-v7";

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
  const requestId = randomUUID();
  const instrumentation = await initializeInstrumentation();
  const analyticsBase = {
    sessionId: payload.sessionId ?? null,
    distinctId: payload.distinctId ?? null,
    requestId,
    experimentVersion: ANALYTICS_EXPERIMENT_VERSION,
    promptLength: guardrailOutcome.sanitizedPrompt.length,
    redactionCount: guardrailOutcome.redactions.length,
  } as const;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const throttleKey = resolveThrottleKey(payload.sessionId, payload.distinctId, ip);
  const throttleResult = registerRequest(throttleKey);

  if (!throttleResult.allowed) {
    const retryAfterSeconds = Math.ceil(throttleResult.retryAfterMs / 1000);
    const message = "We’re handling a few requests at once. Give it a moment before trying again.";
    captureServerEvent(instrumentation, "llm.guardrail.rate_limited", {
      ...analyticsBase,
      retryAfterMs: throttleResult.retryAfterMs,
    });
    logGuardrailEvent("warn", "Rate limit triggered", {
      throttleKey,
      retryAfterMs: throttleResult.retryAfterMs,
    });
    await shutdownInstrumentation(instrumentation);
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
    captureServerEvent(instrumentation, "llm.guardrail.blocked", {
      ...analyticsBase,
      reason: guardrailOutcome.blocked.reason,
    });
    logGuardrailEvent("warn", "Prompt blocked by guardrail", {
      reason: guardrailOutcome.blocked.reason,
    });
    await shutdownInstrumentation(instrumentation);
    return NextResponse.json(
      { error: guardrailOutcome.blocked.message, guardrail: guardrailOutcome.blocked.code },
      { status: 400 },
    );
  }

  if (guardrailOutcome.redactions.length) {
    captureServerEvent(instrumentation, "llm.guardrail.redacted", {
      ...analyticsBase,
      fields: guardrailOutcome.redactions,
    });
    logGuardrailEvent("info", "Prompt redactions applied", {
      fields: guardrailOutcome.redactions,
    });
  }

  const sanitizedPrompt = guardrailOutcome.sanitizedPrompt;

  let instrumentationClosed = false;
  const closeInstrumentation = async () => {
    if (instrumentationClosed) {
      return;
    }
    instrumentationClosed = true;
    await shutdownInstrumentation(instrumentation);
  };

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
      const startedAt = Date.now();

      try {
        captureServerEvent(instrumentation, "llm.conversation.started", {
          ...analyticsBase,
        });

        const plan = planSportsQuery(sanitizedPrompt, payload.conversation);
        captureServerEvent(instrumentation, "llm.intent.planned", {
          ...analyticsBase,
          rationale: plan.slots.rationale,
          slots: plan.slots,
        });

        const executions = await executePlan(sanitizedPrompt, plan, {
          onToolStart: (call) => {
            captureServerEvent(instrumentation, "llm.tool.invoked", {
              ...analyticsBase,
              tool: call.toolName,
              slots: call.args,
            });
          },
          onToolSuccess: (execution) => {
            captureServerEvent(instrumentation, "llm.tool.completed", {
              ...analyticsBase,
              tool: execution.call.toolName,
              durationMs: execution.durationMs,
              slots: execution.call.args,
            });
          },
          onToolError: (call, error) => {
            captureServerEvent(instrumentation, "llm.tool.failed", {
              ...analyticsBase,
              tool: call.toolName,
              error: error instanceof Error ? error.message : "Unknown tool failure",
            });
          },
        });

        const narrativeOutcome = await maybeGenerateNarrative(instrumentation.openai, {
          prompt: sanitizedPrompt,
          plan,
          primaryResult: executions[0]?.result ?? null,
        });

        if (narrativeOutcome.status === "generated") {
          captureServerEvent(instrumentation, "llm.answer.narrative_generated", {
            ...analyticsBase,
            model: narrativeOutcome.metadata.model ?? null,
            promptTokens: narrativeOutcome.metadata.promptTokens ?? null,
            responseTokens: narrativeOutcome.metadata.responseTokens ?? null,
            totalTokens: narrativeOutcome.metadata.totalTokens ?? null,
            durationMs: narrativeOutcome.metadata.durationMs,
          });
        } else {
          captureServerEvent(instrumentation, "llm.answer.narrative_skipped", {
            ...analyticsBase,
            reason: narrativeOutcome.reason,
            errorMessage: narrativeOutcome.errorMessage ?? null,
          });
        }

        const content = composeAssistantContent(
          sanitizedPrompt,
          plan,
          executions,
          narrativeOutcome.status === "generated" ? narrativeOutcome.overrides : undefined,
        );
        captureServerEvent(instrumentation, "llm.answer.composed", {
          ...analyticsBase,
          promptHash: content.promptHash,
          sections: content.sections.map((section) => section.id),
          narrativeStatus: narrativeOutcome.status,
          narrativeModel:
            narrativeOutcome.status === "generated"
              ? narrativeOutcome.metadata.model ?? null
              : null,
        });

        const patches = buildResponsePatches(content);
        for (const patch of patches) {
          sendPatch(patch);
          patchCount += 1;
          await waitFor(60);
        }

        sendPatch({ status: "complete" });
        send({ type: "done" });

        captureServerEvent(instrumentation, "llm.answer.stream_completed", {
          ...analyticsBase,
          promptHash: content.promptHash,
          latencyMs: Date.now() - startedAt,
          patches: patchCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        send({ type: "error", message });
        captureServerEvent(instrumentation, "llm.error", {
          ...analyticsBase,
          message,
        });
      } finally {
        controller.close();
        await closeInstrumentation();
      }
    },
    async cancel() {
      await closeInstrumentation();
    },
  });

  return new Response(stream, {
    headers: STREAM_HEADERS,
  });
}
