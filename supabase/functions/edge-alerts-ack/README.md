# edge-alerts-ack

Acknowledgment webhook invoked by the chat hub or mobile clients when a bettor consumes an edge alert.

- Requires an `Authorization: Bearer <access_token>` header for the bettor acknowledging the alert.
- The bettor must own the alert in order to resolve it; global alerts can only be acknowledged for logging purposes.

## Example

```json
{
  "alertId": "1c2...",
  "userId": "83d...",
  "metadata": { "cta": "tailed" },
  "resolveAlert": true
}
```

- Persists an `alert_events` row with `action = "acknowledged"` (or a custom action if provided).
- Optionally updates `edge_alerts.status` to `acknowledged` and stamps `resolved_at` when `resolveAlert` is `true`.

## Response

```json
{
  "status": "ok",
  "alert": {
    "id": "1c2...",
    "status": "acknowledged",
    "resolved_at": "2024-05-01T12:00:00Z"
  }
}
```
