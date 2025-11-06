# `odds-assistant`

Conversational helper that blends The Odds API snapshots with bettor context pulled from Supabase before asking OpenAI for a summary. The response is safe for in-app rendering and keeps raw odds data available for auditing.

## Request payload

```jsonc
{
  "query": "Any value angles on tonight's Lakers game?",
  "sportKey": "basketball_nba",
  "regions": "us,us2",
  "markets": "h2h,spreads,totals",
  "bookmakers": "draftkings,fanduel,betmgm",
  "userProfileId": "00000000-0000-4000-8000-000000000000"
}
```

- `sportKey` maps to the [sport key](https://the-odds-api.com/liveapi/guides/v4/#operation/get_sports) supported by The Odds API.
- `regions`, `markets`, and `bookmakers` fan out to the upstream query params; omit them to fall back to `us`, `h2h`, and all books.
- `userProfileId` is optional. When provided, the assistant loads the bettor’s profile, bankroll accounts, and 10 most recent bets to provide context for the model.
- `model` can be supplied to override the default `gpt-4o-mini` selection.

## Response shape

```jsonc
{
  "status": "ok",
  "odds_snapshot": {
    "sportKey": "basketball_nba",
    "fetchedAt": "2024-04-26T18:03:52.044Z",
    "filters": {
      "regions": "us,us2",
      "markets": "h2h,spreads,totals",
      "bookmakers": "draftkings,fanduel,betmgm",
      "oddsFormat": "american"
    },
    "warnings": [
      "Failed to fetch odds before timeout"
    ],
    "events": [
      {
        "id": "example-event-id",
        "sportKey": "basketball_nba",
        "sportTitle": "NBA",
        "commenceTime": "2024-04-27T00:00:00Z",
        "homeTeam": "Los Angeles Lakers",
        "awayTeam": "Denver Nuggets",
        "bookmakers": [
          {
            "key": "draftkings",
            "title": "DraftKings",
            "lastUpdate": "2024-04-26T17:59:13Z",
            "markets": [
              {
                "key": "spreads",
                "lastUpdate": "2024-04-26T17:59:13Z",
                "outcomes": [
                  { "name": "Los Angeles Lakers", "price": -110, "point": -4.5 },
                  { "name": "Denver Nuggets", "price": -110, "point": 4.5 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "model_summary": "DraftKings and FanDuel are aligned at Lakers -4.5 (-110). Your bankroll is concentrated on NBA sides, so scale entry modestly unless you have an injury angle."
}
```

Errors return the shared `{ "status": "error", "message": string, "details": any }` schema.

## Environment variables

| Variable | Description |
| --- | --- |
| `ODDS_API_KEY` | API key for [The Odds API](https://the-odds-api.com/) requests |
| `OPENAI_API_KEY` | Server-side OpenAI key used for chat completions |
| `SUPABASE_URL` | Project REST endpoint (validated before Supabase client instantiation) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used for privileged Supabase access |
