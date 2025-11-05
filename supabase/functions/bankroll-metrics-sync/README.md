# bankroll-metrics-sync

Calculates bankroll aggregates, ROI snapshots, and behavioral tag summaries whenever a bet is inserted or updated. The function i
s designed to be triggered from a Supabase database webhook on the `bets` table.

## Trigger configuration

```bash
supabase functions deploy bankroll-metrics-sync --env-file ../.env
supabase functions trigger new --function bankroll-metrics-sync \
  --table public.bets --event-type INSERT --event-type UPDATE
```

## Expected payload

The webhook sends a JSON envelope that includes the new bet record:

```json
{
  "type": "INSERT",
  "table": "bets",
  "record": {
    "id": "2f1...",
    "user_id": "83d...",
    "bankroll_id": "50e...",
    "wager_amount": 250,
    "status": "pending"
  }
}
```

## Response shape

```json
{
  "status": "ok",
  "metrics": {
    "totalBets": 42,
    "activeBets": 11,
    "settledBets": 31,
    "winRate": 0.58,
    "roi30d": 0.17,
    "bankrolls": [
      {
        "id": "50e...",
        "label": "MLB Futures",
        "currency": "USD",
        "startingBalance": 5000,
        "currentBalance": 6125,
        "profit": 1125
      }
    ],
    "topTags": [
      { "tag": "line_shopper", "count": 8 },
      { "tag": "live_bet", "count": 5 }
    ]
  }
}
```

The updated bankroll balances are persisted back to `bankroll_accounts`, while the metrics payload can be consumed directly by th
e web dashboard or downstream edge functions.
