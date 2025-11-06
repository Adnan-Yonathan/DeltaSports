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
1. Copy `.env.example` in `web/` to `.env.local` and supply real credentials. Uncomment `NEXT_PUBLIC_CHAT_MODE=api` only if you are running a compatible `/api/chat` handler locally; otherwise the front-end will use the built-in mock stream for exports.
2. From the repository root run `npm install` (the workspace-aware root `package.json` installs the `web/` app dependencies) followed by `npm run dev` to start the Next.js dev server.
3. Deploy through Vercel; configure Supabase and odds provider environment variables in project settings. The included `vercel.json` points the Next.js builder at `web/package.json` so the correct workspace is installed and built during deploys.
4. In Supabase, run the queries in [supabase/sql-prompts.md](supabase/sql-prompts.md) to scaffold the initial database schema before enabling Row Level Security policies.
5. Configure the edge-function project by following the guidance in [supabase/functions/README.md](supabase/functions/README.md), then deploy `on-auth-profile` as the initial auth webhook to bootstrap bettor profiles.

### Operations checklist
1. Run `npm install` from the repository root to install the `web/` workspace dependencies before starting local development.
2. Copy `web/.env.example` to `web/.env.local` and provide real Supabase and odds provider credentials so the chat API can reach live data sources when enabled.
3. When rotating Supabase or odds provider keys, update the matching environment variables on Vercel and redeploy so the serverless runtime picks up the new values.
4. If you opt into `NEXT_PUBLIC_CHAT_MODE=api`, ensure a compatible `/api/chat` handler is running locally or on your deployment target before shipping the change.

> **Note:** Package installation may require network access which is unavailable in this environment, but the project structure is ready for local development.
