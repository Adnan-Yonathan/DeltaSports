# Delta Chat Orchestration

This document summarizes how the Delta chat experience orchestrates user prompts, LLM reasoning, and sports tool calls.

## Intent schema

The planner classifies user inputs into one of the supported intents:

- `team_stats`
- `player_stats`
- `odds`
- `injuries`
- `schedule`
- `lines_movement`
- `parlay_eval`

Each intent may use contextual parameters such as `league`, `team`, `player`, `market`, `dateRange`, `location`, and `sportsbook`.

## Request flow

1. The chat UI sends a POST request to `/api/chat` with the existing transcript, target model, temperature, and optional conversation id.
2. The server infers an intent using `planSportsTool` and, when applicable, fetches normalized data via `lib/tools/sports.ts`. Offline runs use deterministic mocks when `DELTA_OFFLINE=1`.
3. Server-side events are streamed back to the client at `/api/chat` using `createSseResponse`, broadcasting token deltas, metadata (citations, JSON sidecars), and tool call diagnostics.
4. Responses are persisted in Postgres through Prisma models (`Conversation`, `Message`, `ToolCall`). Token counts and tool latencies can be recorded on the message/tool rows.

## Tool contracts

- `fetchSportsData(query, league?, market?, team?, player?, dateRange?, location?, sportsbook?)` → returns normalized odds, stats, injuries, and source metadata.
- `convertOdds(value, fromFormat, toFormat)` → converts between American, Decimal, and Fractional formats while exposing implied probability.

## Streaming contract

SSE events emitted by `/api/chat` include:

- `token`: incremental markdown text.
- `metadata`: citations and structured JSON sidecars for tables.
- `tool`: serialized tool invocation payloads (arguments + snapshots).
- `done`: final message payload containing the canonical assistant message plus any enriched data.
- `error`: structured error information when orchestration fails.

Clients should reconcile streamed chunks to render a progressively updating response and capture final JSON for export (e.g., CSV download).

## Caching

GET `/api/tools/sports` applies short-lived caching defined by `DELTA_CACHE_TTL` and returns ETags so clients can reuse responses. Provider responses are normalized before caching to ensure consistent schema.
