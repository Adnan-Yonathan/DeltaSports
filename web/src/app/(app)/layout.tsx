import { Sidebar } from "@/components/chat/Sidebar";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex h-full w-full flex-col overflow-hidden bg-black/60">
      <header className="flex items-center gap-3 border-b border-white/5 bg-black/70 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 sm:px-6">
        <span className="inline-flex items-center gap-2 text-[11px] text-slate-300">
          <span className="h-2 w-2 rounded-full bg-brand-accent" aria-hidden="true" />
          Live session
        </span>
        <div className="hidden text-[11px] text-slate-500 sm:block">
          Command Center · Bankroll guardrails and odds intelligence streamed in real time
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-black/40 lg:block" />
          }
        >
          <Sidebar />
        </Suspense>
        <main className="flex min-w-0 flex-1 justify-center overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 justify-center gap-6 overflow-hidden px-3 pb-6 pt-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </section>
  );
}
