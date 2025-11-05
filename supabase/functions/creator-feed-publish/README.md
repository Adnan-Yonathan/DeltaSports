# creator-feed-publish

Validates a creator submission, saves it to `creator_posts`, and fan-outs notifications for every active subscriber.

- Requires an `Authorization: Bearer <access_token>` header for the authenticated creator.
- Only the creator who owns the profile (via `auth_user_id`) can publish through this endpoint.

## Request

```json
{
  "creatorHandle": "sharpedge",
  "title": "Thursday Night Football Edges",
  "content": "3 legs I'm watching...",
  "market": "NFL",
  "metadata": { "tags": ["primetime", "sides"] }
}
```

## Response

```json
{
  "status": "ok",
  "post": {
    "id": "ed2...",
    "creator_id": "a11...",
    "title": "Thursday Night Football Edges"
  },
  "subscribersNotified": 128,
  "notifications": [
    {
      "subscriptionId": "sub-1",
      "userId": "83d...",
      "message": "SharpEdge dropped a new insight: Thursday Night Football Edges"
    }
  ]
}
```

Notifications can be piped to email, push, or the in-app feed. Any additional tagging logic can be handled upstream before the p
ayload reaches this function.
