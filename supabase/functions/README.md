# Supabase Edge Functions

Edge functions provide the realtime glue for bankroll analytics, edge alerts, creator engagement, and conversational summaries. E
each folder houses one function plus any feature-specific README with payload samples.

## Directory map

```
supabase/functions/
  shared/                   # Cross-function utilities (env, client, response helpers)
  bankroll-metrics-sync/     # Recalculate bankroll metrics after bet inserts/updates
  chat-digest/               # Build conversational digests for the home hub
  creator-feed-publish/      # Publish creator posts & notify subscribers
  edge-alerts-ack/           # Record alert acknowledgements from clients
  edge-alerts-dispatch/      # Persist threshold-crossing alerts & fan out notifications
  ev-scanner-refresh/        # Poll odds feeds and update edge_alerts with EV snapshots
  odds-assistant/            # Blend The Odds API data with bettor context for chat summaries
  on-auth-profile/           # Bootstrap bettor profiles from auth webhooks
```

## Environment variables

All functions rely on the Supabase service role configuration plus feature-specific variables:

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Project REST endpoint (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used for server-side operations (required) |
| `ODDS_API_KEY` | The Odds API key consumed by `odds-assistant` |
| `OPENAI_API_KEY` | Server-side OpenAI key used by `odds-assistant` |
| `ODDS_FEED_URLS` | Comma-separated odds feed URLs for `ev-scanner-refresh` (optional during manual testing) |
| `EV_MIN_THRESHOLD` | Override for minimum EV percentage surfaced by `ev-scanner-refresh` |

Client-facing keys remain in `web/.env.example`; only privileged keys are loaded here.

## Local development workflow

1. Start Supabase locally and apply the schema prompts:
   ```bash
   supabase start
   # Run the statements in ../sql-prompts.md inside the Supabase SQL editor or CLI
   ```
2. Serve an individual function with seeded data. Examples:
   ```bash
   # Auth webhook bootstrap
   supabase functions serve on-auth-profile --env-file ../.env

   # Bankroll recalculation after inserting a bet
   supabase functions serve bankroll-metrics-sync --env-file ../.env --debug

   # Refresh odds snapshot with a mock payload
   supabase functions serve ev-scanner-refresh --env-file ../.env
   curl -i -X POST -H "Content-Type: application/json" \
     -d @supabase/functions/ev-scanner-refresh/mock-payload.json \
     http://localhost:54321/functions/v1/ev-scanner-refresh
   ```
3. Use the JSON payloads documented inside each function folder (`README.md`) to exercise the endpoints.

## Scheduling & observability

- **EV scanner:** schedule `ev-scanner-refresh` every 10 minutes (`supabase functions schedule new ... --cron "*/10 * * * *"`). Logs include refresh summaries plus any feed failures.
- **Bankroll analytics:** trigger `bankroll-metrics-sync` on `INSERT`/`UPDATE` of `public.bets` via `supabase functions trigger`. Pair with Supabase Log Explorer filters (`edge-alerts` label) to monitor recalculation errors.
- **Daily digests:** call `chat-digest` from cron jobs or the Next.js API using the bettor's profile id. Capture the JSON response to populate chat summaries.
- **Edge alerts:** wire `edge-alerts-dispatch` to upstream scanners (e.g., LLM orchestrator) and use `edge-alerts-ack` for chat acknowledgements. Both functions log to `alert_events`, giving you a full lifecycle trail for analytics.

For production deployments, run `supabase functions deploy <name> --env-file ../.env` and validate logs in the Supabase dashboard (`Project Settings → Logs → Edge Functions`).

## Testing

Run the shared helper unit tests (covering alert normalization and notification formatting) with:

```bash
npm run test:functions
```

The script compiles the reusable TypeScript utilities under `supabase/functions/` and then executes the Node.js test suite in `supabase/functions/tests/`.
