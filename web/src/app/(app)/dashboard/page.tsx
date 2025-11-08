import { ConversationPane } from "@/components/chat/ConversationPane";
import { EdgePreview } from "@/components/edge-preview";

const operations = [
  {
    title: "Latency",
    value: "742 ms",
    helper: "Avg. LLM response time over last 20 requests"
  },
  {
    title: "Win rate delta",
    value: "+6.3%",
    helper: "Performance vs. sportsbook closing lines"
  },
  {
    title: "Data providers",
    value: "2 / 2",
    helper: "All odds endpoints and backups responsive"
  }
] as const;

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-6 lg:flex-row">
      <div className="flex flex-1">
        <ConversationPane />
      </div>
      <aside className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-white/5 bg-black/20 p-6">
        <section className="space-y-3">
          <header className="space-y-1">
            <h3 className="text-base font-semibold text-white">Operational telemetry</h3>
            <p className="text-sm text-slate-300">
              Track the orchestration health for the streaming chat experience.
            </p>
          </header>
          <ul className="grid gap-3 text-xs sm:grid-cols-2">
            {operations.map((metric) => (
              <li key={metric.title} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-slate-400">{metric.title}</p>
                <p className="mt-1 text-lg font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{metric.helper}</p>
              </li>
            ))}
          </ul>
        </section>
        <EdgePreview />
      </aside>
    </div>
  );
}
