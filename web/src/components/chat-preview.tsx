const messages = [
  {
    sender: "DeltaSports",
    tone: "Concise",
    content:
      "Bankroll is up 8.3% this week. Two pending MLB edges triggered by late line movement; odds drifted from -115 to -104."
  },
  {
    sender: "You",
    tone: "User",
    content: "Show me the confidence breakdown and why the Phillies edge moved."
  },
  {
    sender: "DeltaSports",
    tone: "Engaging",
    content:
      "Confidence driven by bullpen volatility index (0.62) and weather-adjusted xFIP. Creator EdgeLab doubled down 5m ago."
  }
];

export const ChatPreview = () => (
  <div className="space-y-4 rounded-2xl border border-white/5 bg-black/30 p-6">
    <header className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">Conversational Edge Stream</h3>
        <p className="text-xs text-slate-300">Realtime alerts with tone toggles and memory persistence.</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent">
        <span className="h-2 w-2 rounded-full bg-brand-accent" aria-hidden /> Live
      </div>
    </header>
    <ul className="space-y-3 text-sm">
      {messages.map((message) => (
        <li key={message.content} className="rounded-xl border border-white/5 bg-black/40 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>{message.sender}</span>
            <span>{message.tone}</span>
          </div>
          <p className="mt-2 text-sm text-slate-200">{message.content}</p>
        </li>
      ))}
    </ul>
  </div>
);
