# chat-digest

Generates a conversational-ready summary that the home hub can display based on bankroll, bet, and alert data.

- Requires an `Authorization: Bearer <access_token>` header for the profile owner.
- Only the authenticated bettor can request a digest for their `userProfileId`.

## Payload

```json
{
  "userProfileId": "83d...",
  "tone": "engaging"
}
```

## Response

```json
{
  "status": "ok",
  "tone": "engaging",
  "summary": "Good day, NBA fan! In UTC time you're sitting on Bankroll 6125.00 (+1125.00 vs. start). 5 recent bets; latest won on Nuggets ML. 2 live edges queued.",
  "highlights": [
    { "type": "bankroll", "title": "Bankroll snapshot", "description": "Total balance 6125.00 (+1125.00 vs. start)." },
    { "type": "bet", "title": "Latest bet", "description": "Nuggets vs. Suns – Moneyline (won). Stake 250.00." }
  ],
  "context": {
    "profile": { "preferred_timezone": "UTC" },
    "bankrolls": [ { "label": "Main", "current_balance": 6125.0 } ],
    "recentBets": [ { "event_name": "Nuggets vs. Suns" } ],
    "activeAlerts": [ { "market": "Nuggets -3.5" } ]
  }
}
```

The caller can surface `summary` directly in the chat stream and use `highlights` to render supporting cards.
