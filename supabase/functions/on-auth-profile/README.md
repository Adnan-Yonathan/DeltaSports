# on-auth-profile

Creates or updates a bettor profile when Supabase Auth events fire. Configure an Auth webhook to call this function after the SQL prompts are applied so every user starts with consistent defaults.

## Expected Payload

This function accepts the default Supabase Auth hook payload:

```json
{
  "type": "SIGNED_IN",
  "record": {
    "id": "00000000-0000-0000-0000-000000000000",
    "raw_user_meta_data": {
      "preferred_timezone": "America/New_York",
      "favorite_sports": ["NBA", "NFL"],
      "bankroll_goal": 2500
    }
  }
}
```

The metadata fields are optional—missing values fall back to safe defaults noted in `index.ts`.
