import { RequireRole } from '@/components/RequireRole';

export default function CommandCenterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Delta Command Center</h1>
        <p className="text-sm text-slate-300">
          Monitor bankroll health, ingest new bets, and react to live edge signals in one streamlined workspace.
        </p>
      </header>
      <RequireRole
        role="admin"
        fallback={<p className="text-sm text-rose-200">Waiting for access confirmation…</p>}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-lg font-semibold text-white">Operations feed</h2>
            <p className="mt-2 text-sm text-slate-300">
              Upcoming tasks and system health metrics appear here once your data sources are connected.
            </p>
          </section>
          <section className="rounded-xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-lg font-semibold text-white">Bankroll snapshot</h2>
            <p className="mt-2 text-sm text-slate-300">
              Hook this panel into bankroll analytics to watch exposure, EV, and streaks in real-time.
            </p>
          </section>
        </div>
      </RequireRole>
    </div>
  );
}
