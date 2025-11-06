# DeltaSports
Conversational sports intelligence platform. Everything from the best odds on a bet to advanced stats giving you an edge.

## Documentation
- [Product Requirements Document](docs/PRD.md)
- [Product Alignment & Design Kickoff](docs/design/kickoff.md)
- [Supabase SQL Prompts](supabase/sql-prompts.md)
- [Supabase Edge Functions Workspace](supabase/functions/README.md)

## Development

The `web` directory contains the Next.js + Tailwind front-end configured for deployment on Vercel with Supabase integration hooks.

### Getting Started
1. Copy `.env.example` in `web/` to `.env.local` and supply real credentials.
2. From the repository root run `npm install` (the workspace-aware root `package.json` installs the `web/` app dependencies) followed by `npm run dev` to start the Next.js dev server.
3. Deploy through Vercel; configure Supabase and odds provider environment variables in project settings. The included `vercel.json` points the Next.js builder at `web/package.json` so the correct workspace is installed and built during deploys.
4. In Supabase, run the queries in [supabase/sql-prompts.md](supabase/sql-prompts.md) to scaffold the initial database schema before enabling Row Level Security policies.
5. Configure the edge-function project by following the guidance in [supabase/functions/README.md](supabase/functions/README.md), then deploy `on-auth-profile` as the initial auth webhook to bootstrap bettor profiles.

### Operations checklist
1. Install the Python instrumentation dependencies used by the LLM analytics tooling: `pip install -r requirements.txt`. This ensures `posthog` and `openai` are available for local scripts and CI jobs that exercise the analytics pipeline.
2. Keep the analytics credentials in sync across environments by setting `POSTHOG_API_KEY`, `POSTHOG_HOST`, and `OPENAI_API_KEY` anywhere the chat orchestrator runs. Update deployment targets immediately after rotating any of the keys.
3. When rotating keys, update `.env.local`, the associated Vercel/Supabase environment variables, and notify the team via the runbook so stale sessions can be invalidated. Redeploy the affected services to guarantee the refreshed secrets are loaded.
4. For the client experience, embed the PostHog browser snippet (or initialize the React SDK) so chat events like `chat_prompt_submitted` and `odds_format_toggled` flow to analytics; otherwise events are logged to the console in development only.
5. Install the Node analytics bridge (`npm install @posthog/ai posthog-node` inside `web/`) so the server-side orchestrator can stream token usage and narrative metrics to PostHog. When packages are unavailable (e.g., in restricted sandboxes) the orchestrator will automatically fall back to deterministic copy.

Refer to [docs/analytics.md](docs/analytics.md) for the full event catalogue, retention guidance, and opt-out procedures.

> **Note:** Package installation may require network access which is unavailable in this environment, but the project structure is ready for local development.
