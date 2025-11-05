# edge-alerts-dispatch

Receives threshold-crossing payloads from internal scanners or creators, persists them to `edge_alerts`, and emits notification 
objects that the chat hub can broadcast in realtime.

## Example request

```json
{
  "defaultTone": "engaging",
  "alerts": [
    {
      "market": "Chiefs @ Bills - Moneyline",
      "sportsbook": "BookA",
      "edgeValue": 0.045,
      "triggerThreshold": 0.03,
      "url": "https://booka.example/line",
      "metadata": { "reason": "Line lagged vs. consensus" }
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
      "id": "1c2...",
      "market": "Chiefs @ Bills - Moneyline",
      "edge_value": 0.045,
      "status": "active"
    }
  ],
  "notifications": [
    {
      "alertId": "1c2...",
      "message": "🚨 Chiefs @ Bills - Moneyline: BookA is hanging value (4.5% edge). Jump before it moves!",
      "tone": "engaging"
    }
  ]
}
```

Every dispatched alert also logs an `alert_events` row with `action = "dispatched"` so downstream analytics can track consumptio
n funnels.
