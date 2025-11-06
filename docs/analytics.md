# LLM analytics lifecycle

This document outlines how the chat orchestrator emits PostHog analytics during a conversation. It complements the phase 7 work that instrumented request lifecycles, token usage, and narrative generation.

## Event catalogue

Every API request receives a `requestId` (UUID v4) and `experimentVersion` (`chat-llm-v7`) so dashboards can segment behaviour across releases. The following server-side events are emitted when instrumentation is available:

| Event key | When it fires | Key properties |
| --- | --- | --- |
| `llm.conversation.started` | Immediately after the prompt passes guardrails | `requestId`, `sessionId`, `promptLength`, `experimentVersion` |
| `llm.intent.planned` | After the slot planner runs | `slots` (sport/league/market/timeframe/entity), `rationale[]` |
| `llm.tool.invoked` / `llm.tool.completed` / `llm.tool.failed` | Around each tool execution | `tool`, `slots`, `durationMs`, optional `error` |
| `llm.answer.narrative_generated` | When GPT-4o returns copy for the intro/details sections | `model`, `promptTokens`, `responseTokens`, `totalTokens`, `durationMs` |
| `llm.answer.narrative_skipped` | When LLM copy is skipped or fails | `reason`, optional `errorMessage` |
| `llm.answer.composed` | After the assistant response is assembled | `promptHash`, `sections[]`, `narrativeStatus`, `narrativeModel` |
| `llm.answer.stream_completed` | After streaming finishes | `latencyMs`, `patches` |
| `llm.error` | When an unexpected exception bubbles up | `message` |
| `llm.guardrail.*` | Guardrail counters (blocked, redacted, rate_limited) | Guardrail-specific metadata |

Client-side PostHog events such as `chat_prompt_submitted` and `odds_format_toggled` are triggered elsewhere in the UI and share the same anonymous `distinctId` seed.

## Dependency checklist

The server orchestrator dynamically imports PostHog and OpenAI clients at runtime. Install the Node.js dependencies inside the `web/` workspace to enable instrumentation locally:

```bash
cd web
npm install @posthog/ai posthog-node
```

When the packages are missing or environment variables are undefined, the orchestrator gracefully skips analytics and falls back to deterministic copy.

## Data retention & privacy

* **Retention:** Configure the PostHog project to retain raw LLM events for no longer than 30 days. Derived dashboards can keep aggregated metrics, but delete granular payloads during key rotations to comply with responsible gambling expectations.
* **PII controls:** Prompts are sanitized by guardrails before analytics emission. Only hashed prompt metadata (length, prompt hash) and anonymized identifiers (`requestId`, `distinctId`) reach PostHog.
* **Opt-out:** Remove `POSTHOG_API_KEY` or `POSTHOG_HOST` from the environment to disable instrumentation. The orchestrator will skip analytics and rely on synthetic copy without interrupting responses.
* **Shutdown:** Server processes register `beforeExit`, `SIGINT`, and `SIGTERM` hooks that flush PostHog buffers (`phClient.shutdown()`) so token and latency events are not dropped during deploys or local restarts.

## Operational runbook

1. Provision the API key in PostHog and store it (plus `POSTHOG_HOST` and `OPENAI_API_KEY`) in the deployment platform. Rotate keys quarterly and confirm new values load without restarting the Next.js runtime.
2. Monitor the `llm.answer.narrative_*` event series to evaluate copy quality. Token metrics allow prompt tuning without consulting OpenAI dashboards.
3. If a user requests deletion or opts out, remove their `distinctId` mapping from storage and clear cached conversations. Subsequent requests will generate anonymous IDs and skip analytics when credentials are absent.
4. Keep dashboards filtered by `experimentVersion` to compare behaviour across orchestration revisions and quickly roll back if a release introduces regressions.
