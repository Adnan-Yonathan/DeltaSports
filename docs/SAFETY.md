# Safety & Compliance

Delta emphasizes responsible information delivery for bettors and analysts.

## Responsible betting banner

The chat UI surfaces a persistent banner: “Delta is informational only; not betting advice.” This links to external responsible gambling resources and appears above every conversation stream.

## Guidance & caveats

- Clearly state assumptions and data freshness in every response.
- Include timestamps and time zones when referencing events, odds, or injuries.
- Clarify that lines may vary by sportsbook and jurisdiction; availability depends on user location.
- Avoid deterministic guarantees, lock terminology, or aggressive wagering recommendations.
- Surface injury or lineup uncertainty warnings when data is stale or incomplete.

## Data handling

- PII is not collected. Chat transcripts and tool payloads exclude personal identifiers.
- API keys are redacted in logs and managed through environment variables.
- Data retention is configurable using environment flags; set `DELTA_OFFLINE=1` to run deterministic mocks locally.

## Logging & observability

- Log tool latency (`latencyMs`) and token counts per message for auditing.
- Capture cache hit/miss ratios for `/api/tools/sports` without storing sensitive payloads.
- Respect jurisdictional rules by flagging sportsbook availability changes within responses.
