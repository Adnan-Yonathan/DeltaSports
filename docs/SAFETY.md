# Safety & Responsible Betting Guardrails

Delta exists to inform, not to predict outcomes with certainty. The following guidelines are embedded in both the product experience and the backend orchestration:

## Messaging Principles

- Every assistant reply includes a disclaimer that Delta provides informational context only.
- The UI surfaces sportsbook availability caveats and encourages users to verify jurisdictional rules.
- The assistant avoids deterministic language such as "lock" or "guaranteed" and instead highlights confidence bands or assumptions.

## Responsible Betting Banner

A persistent banner in the chat experience states "Delta is informational only; not betting advice" and links to state-level responsible gaming resources. This message also appears near the composer footer for reinforcement.

## Geo & Time Awareness

- Tool responses contain `fetchedAt` timestamps. The client renders local time to help users understand data freshness.
- Sportsbook availability varies by region; the assistant reminds users to confirm legality in their location.

## Data Handling

- API keys are never logged. Sensitive fields are redacted prior to persistence.
- Conversations are stored in SQLite/Postgres via Prisma. Data retention windows can be managed by setting environment flags (e.g., `DELTA_OFFLINE=1` disables external calls and uses mock data).
- Logs capture aggregate metrics (latency, token counts) without storing personally identifiable information.

## Streaming Safety

Streaming responses are monitored for tool errors. If the sports provider returns stale or missing data the assistant explains the gap instead of fabricating numbers.

## Future Enhancements

- Integrate risk-scoring that throttles high-risk queries (e.g., martingale strategies).
- Expand language filtering to flag self-harm or underage betting references and route to support resources.
