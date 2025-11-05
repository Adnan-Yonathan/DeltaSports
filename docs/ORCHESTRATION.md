# Delta Chat Orchestration

This document captures the contract between the UI, the chat orchestration API, and the supporting tool interfaces.

## Intent Schema

Delta extracts a lightweight intent object before invoking the LLM. The current schema is:

```ts
interface Intent {
  type: 'team_stats' | 'player_stats' | 'odds' | 'injuries' | 'schedule' | 'lines_movement' | 'parlay_eval';
  league?: string;
  team?: string;
  player?: string;
  market?: string;
  timeframe?: string;
}
```

The helper `inferIntent(prompt: string)` in `src/lib/llm/openai.ts` provides a keyword-based fallback and can be replaced by model-assisted classification later.

## Tool Calling

The assistant can call the function `fetchSportsData(query, league?, market?, team?, player?, dateRange?, location?, sportsbook?)`. When the model requests a tool invocation we surface the raw JSON arguments and result in the UI as a `ToolCallCard` component.

Each tool response must include:

- `source`: provider identifier or `mock-offline` when running without external access.
- `fetchedAt`: ISO timestamp (UTC) used for display and caching.
- `markets[]`: odds breakdown with American, Decimal, Fractional formats and implied probability.
- Optional `injuries[]`, `events[]`, or `players[]` arrays.

## Streaming Contract

`POST /api/chat` returns a `text/event-stream` response. Events include:

- `ready`: initial handshake.
- `token`: incremental content string.
- `tool`: tool call metadata `{ name, args, result? }`.
- `done`: final usage payload and closing signal.
- `error`: terminal error message.
- `heartbeat`: keepalive every 15s (configurable).

The client merges all `token` deltas into the assistant draft and renders tool call cards as they arrive. When the stream completes the draft is persisted to the database alongside token usage metadata.

## Persistence

Entities defined in `prisma/schema.prisma`:

- `Conversation`: chat shell with pinned flag, model preference, timestamps.
- `Message`: conversational turn with JSON content and optional token counts.
- `ToolCall`: per-tool logs linked to messages with latency measurements.

All database access is done via the repository helpers under `src/lib/repos/*` to keep the API route handlers slim and testable.

## Observability Hooks

- Tool latencies can be tracked by storing `latencyMs` on `ToolCall` records.
- Streaming usage appears in `done` payloads from OpenAI; persisted for future analytics.
- Caching for sports tool responses uses in-memory TTL with `ETag` headers; swap with Redis/Edge store as needed.
