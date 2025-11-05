const edges = [
  {
    market: "MLB: Phillies vs. Mets",
    value: "+4.2% EV",
    detail: "Line moved from -115 to -104 after bullpen update."
  },
  {
    market: "NBA: Lakers vs. Suns",
    value: "+3.1% EV",
    detail: "Injury adjustment triggered momentum alert from Creator EdgeLab."
  }
];

export const EdgePreview = () => (
  <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
    <header>
      <h3 className="text-lg font-semibold text-white">Edge Scanner</h3>
      <p className="text-xs text-slate-300">Odds aggregation and differential calculations queued for integration.</p>
    </header>
    <ul className="space-y-3">
      {edges.map((edge) => (
        <li key={edge.market} className="rounded-xl border border-white/5 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{edge.market}</span>
            <span className="text-xs text-emerald-400">{edge.value}</span>
          </div>
          <p className="mt-2 text-xs text-slate-300">{edge.detail}</p>
        </li>
      ))}
    </ul>
  </div>
);
