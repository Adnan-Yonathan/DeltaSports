const bankrollMetrics = [
  { label: "Bankroll", value: "$12,430", change: "+8.3%" },
  { label: "ROI (30d)", value: "+12.5%", change: "+4.1%" },
  { label: "Hit Rate", value: "57%", change: "+6%" }
];

const behaviorTags = [
  { name: "Aggressive MLB", detail: "+$420 EV last 7d" },
  { name: "NFL Futures", detail: "Confidence trending up" }
];

export const BankrollPreview = () => (
  <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
    <header>
      <h3 className="text-lg font-semibold text-white">Bankroll Intelligence</h3>
      <p className="text-xs text-slate-300">ROI analytics and behavioral tagging ready for Supabase data sources.</p>
    </header>
    <div className="grid gap-3 md:grid-cols-3">
      {bankrollMetrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-white/5 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
          <p className="text-xs text-emerald-400">{metric.change}</p>
        </div>
      ))}
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">Behavioral Tags</p>
      <ul className="mt-3 space-y-2">
        {behaviorTags.map((tag) => (
          <li key={tag.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 px-4 py-2">
            <span className="text-sm text-white">{tag.name}</span>
            <span className="text-xs text-slate-300">{tag.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
