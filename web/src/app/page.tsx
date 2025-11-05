import Link from "next/link";

const featureHighlights = [
  {
    title: "Conversational Home Hub",
    description:
      "Chat-first command center delivering bankroll summaries, creator alerts, and live market movers in one stream.",
    cta: "Preview the chat flow",
    href: "#chat-flow"
  },
  {
    title: "Bankroll Intelligence",
    description:
      "Track bets via manual or NLP input, surface ROI analytics, streaks, and behavioral tags to refine strategy.",
    cta: "View analytics",
    href: "#bankroll"
  },
  {
    title: "Edge Scanner",
    description:
      "Aggregate multi-book odds, calculate EV, and push edge cards when discrepancies emerge in your markets.",
    cta: "See live edges",
    href: "#edges"
  }
];

const integrations = [
  { name: "Vercel", detail: "Instant deploy previews for every branch." },
  { name: "Supabase", detail: "Auth, Postgres storage, and realtime channels." },
  { name: "LLM Providers", detail: "OpenAI-compatible interface for chat and analysis." },
  { name: "Odds APIs", detail: "Ingest line movements for EV calculations." }
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-16 pb-16">
      <section id="features" className="grid gap-8 rounded-2xl bg-brand-subtle/60 p-8 shadow-lg shadow-black/30">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-brand-accent">Core Experience</p>
          <h2 className="text-3xl font-semibold">Designing a Bloomberg-grade betting copilot</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Step one complete: product alignment captured in the design kickoff doc. Next up is building the
            conversational foundation that ties bankroll intelligence, edge scanning, and creator feeds together.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-white/5 bg-black/20 p-6">
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              <Link className="mt-4 inline-flex text-sm font-medium text-brand-accent" href={feature.href}>
                {feature.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="integrations" className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-8">
          <h2 className="text-2xl font-semibold">Deployment Blueprint</h2>
          <p className="mt-2 text-sm text-slate-300">
            Vercel hosts the Next.js front-end, Supabase powers auth, storage, and realtime alerts, while
            integrations with odds providers and LLMs feed adaptive betting intelligence loops.
          </p>
          <ul className="mt-6 space-y-4">
            {integrations.map((integration) => (
              <li key={integration.name} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-accent" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">{integration.name}</p>
                  <p className="text-xs text-slate-400">{integration.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-8">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-slate-300">
            <li>Implement Supabase auth scaffolding and session-aware chat layout.</li>
            <li>Wire EV scanner service skeleton with odds ingestion adapters.</li>
            <li>Prototype creator feed subscriptions and alert triggers.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            Progress is tracked sequentially per the implementation plan.
          </p>
        </div>
      </section>

      <section id="cta" className="rounded-2xl border border-brand-accent/30 bg-brand-subtle/80 p-8 text-center">
        <h2 className="text-3xl font-semibold">Be first in line for DeltaSports</h2>
        <p className="mt-2 text-sm text-slate-300">
          Secure beta access as we activate realtime edge cards, bankroll analytics, and creator-driven alerts.
        </p>
        <a
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-2 text-sm font-semibold text-brand"
          href="mailto:hello@deltasports.ai"
        >
          Request Beta Access
        </a>
      </section>
    </main>
  );
}
