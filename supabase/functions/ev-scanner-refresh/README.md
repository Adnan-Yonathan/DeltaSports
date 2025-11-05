# ev-scanner-refresh

Scheduled odds ingestion function that aggregates third-party lines, calculates expected value (EV) deltas, and synchronizes acti
ve entries in `edge_alerts` for the Edge Scanner UI.

## Scheduling

```bash
supabase functions deploy ev-scanner-refresh --env-file ../.env
supabase functions schedule new daily-odds \
  --function ev-scanner-refresh \
  --cron "*/10 * * * *" # run every 10 minutes
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `ODDS_FEED_URLS` | Comma-separated list of odds API endpoints returning arrays that match the payload below. |
| `EV_MIN_THRESHOLD` | Minimum EV percentage (e.g. `0.03` for 3%) to keep an alert active. Optional. |

## Payload contract

When invoked via schedule, the function will fetch from `ODDS_FEED_URLS`. For manual testing, you can post mock markets:

```json
{
  "tone": "engaging",
  "markets": [
    {
      "eventId": "nba-123",
      "market": "Lakers @ Warriors - Spread",
      "consensusDecimalOdds": 1.91,
      "books": [
        { "sportsbook": "BookA", "decimalOdds": 2.05 },
        { "sportsbook": "BookB", "decimalOdds": 1.88 }
      ]
    }
  ]
}
```

## Response

```json
{
  "status": "ok",
  "alerts": [
    {
      "id": "c644...",
      "market": "Lakers @ Warriors - Spread",
      "sportsbook": "BookA",
      "edge_value": 0.07
    }
  ],
  "summary": "1 edge refreshed above 3.0% EV."
}
```

Alerts are upserted (or inserted) into `edge_alerts`, and a matching `alert_events` row is logged with `action = "refreshed"` fo
r observability.
