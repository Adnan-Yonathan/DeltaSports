import { BankrollPreview } from "@/components/bankroll-preview";
import { ChatPreview } from "@/components/chat-preview";
import { EdgePreview } from "@/components/edge-preview";

const modules = [
  {
    title: "Conversational Hub",
    status: "In Progress",
    description:
      "Integrate chat interface with tone toggle, memory persistence, and real-time edge alerts via Supabase channels."
  },
  {
    title: "Bankroll Tracker",
    status: "Planned",
    description: "Build ROI analytics, streak visualizations, and behavioral tagging logic."
  },
  {
    title: "Edge Scanner",
    status: "Planned",
    description: "Aggregate odds APIs, compute EV differentials, and surface actionable edge cards."
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <ChatPreview />
        <BankrollPreview />
      </div>
      <EdgePreview />
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <article key={module.title} className="rounded-xl border border-white/5 bg-black/20 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{module.title}</h3>
              <span className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent">
                {module.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{module.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
