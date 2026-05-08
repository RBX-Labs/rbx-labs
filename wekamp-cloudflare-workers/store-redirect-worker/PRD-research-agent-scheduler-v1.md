# PRD: Research Agent Scheduler (V1)

## Objective
Add a thin Cloudflare Worker scheduler that triggers the backend-owned
`Ecosystm Research Agent` every 12 hours without moving research logic,
memory, or LLM calls into the Worker.

## Scope
- Cron trigger every 12 hours.
- Build the bounded research tick payload.
- Call backend `POST /ampy/agent/research/tick`.
- Pass audit metadata:
  - `kampId`
  - `personaId`
  - `runType`
  - `maxThemes`
  - `dryRun`
  - `autoPublish`
  - `traceId`
  - `scheduledFor`
  - `idempotencyKey`
- Fail closed when required configuration is missing.

## Non-Goals
- Source fetching in the Worker.
- LLM calls in the Worker.
- Theme scoring in the Worker.
- Worker-owned memory or audit persistence.

## Runtime Contract
- Cron: `0 */12 * * *`
- Required env:
  - `RESEARCH_AGENT_TICK_URL`
  - `RESEARCH_AGENT_KAMP_ID`
- Optional env:
  - `RESEARCH_AGENT_KEY`
  - `RESEARCH_AGENT_PERSONA_ID`
  - `RESEARCH_AGENT_MAX_THEMES`
  - `RESEARCH_AGENT_DRY_RUN`
  - `RESEARCH_AGENT_AUTO_PUBLISH`
  - `RESEARCH_AGENT_SHARED_SECRET`

## Status
Implemented in:
- `src/index.js`
- `wrangler.toml`
- `test/index.test.js`
