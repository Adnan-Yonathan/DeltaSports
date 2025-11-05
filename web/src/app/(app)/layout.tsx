import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col gap-6 rounded-2xl border border-white/5 bg-black/40 p-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Command Center</h2>
        <p className="text-sm text-slate-300">
          Unified workspace for conversational guidance, bankroll insights, and live edge tracking.
        </p>
      </header>
      {children}
    </section>
  );
}
