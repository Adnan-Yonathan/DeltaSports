# edge-alerts-ack

Acknowledgment webhook invoked by the chat hub or mobile clients when a bettor consumes an edge alert.

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
