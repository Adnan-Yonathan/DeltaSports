"use client";

import type { AssistantWidget } from "@/components/chat/types";

type LineMovementWidget = Extract<AssistantWidget, { kind: "lineMovement" }>;

type LineMovementCardProps = {
  widget: LineMovementWidget;
};

export const LineMovementCard = ({ widget }: LineMovementCardProps) => {
  const latest = widget.series.at(-1);
  const earliest = widget.series[0];
  const delta = latest && earliest ? latest.value - earliest.value : null;

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line movement</p>
        <h4 className="text-lg font-semibold text-white">{widget.gameId}</h4>
      </header>
      <div className="space-y-2 text-sm text-slate-300">
        <p>
          Latest movement: {latest ? latest.value.toFixed(2) : "—"} ({delta ? `${delta > 0 ? "+" : ""}${delta.toFixed(2)} vs. open` : "flat"})
        </p>
        {widget.notable && widget.notable.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {widget.notable.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <footer className="text-[11px] uppercase tracking-wide text-slate-500">Provider-triggered deltas</footer>
    </section>
  );
};

export default LineMovementCard;
