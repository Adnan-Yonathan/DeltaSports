"use client";

import useSWR from "swr";

import type { AssistantWidget } from "@/components/chat/types";

type PlayerFormWidget = Extract<AssistantWidget, { kind: "playerForm" }>;

type PlayerFormCardProps = {
  widget: PlayerFormWidget;
};

export const PlayerFormCard = ({ widget }: PlayerFormCardProps) => {
  const params = new URLSearchParams({
    playerId: widget.playerId,
    stat: widget.stat,
    lastNGames: String(widget.points.length || 5),
  });

  const fallback = {
    data: {
      series: widget.points,
      average: widget.points.reduce((acc, value) => acc + value, 0) / Math.max(widget.points.length, 1),
    },
  };

  const { data } = useSWR(`/api/tools/stats?${params.toString()}`, {
    fallbackData: fallback,
  });

  const result = (data as { data?: { series: number[]; average: number } } | undefined)?.data;
  const series = result?.series ?? widget.points;
  const average = result?.average ?? fallback.data.average;

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent form</p>
        <h4 className="text-lg font-semibold text-white">{widget.playerId}</h4>
        <p className="text-xs text-slate-400">{widget.summary}</p>
      </header>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-white">{average.toFixed(1)}</span>
          <span className="text-xs uppercase tracking-wide text-slate-400">Avg {widget.stat}</span>
        </div>
        <div className="flex gap-1 text-xs text-slate-300">
          {series.map((value, index) => (
            <span key={`${value}-${index}`} className="flex-1 rounded bg-white/10 py-1 text-center">
              {value}
            </span>
          ))}
        </div>
      </div>
      <footer className="text-[11px] uppercase tracking-wide text-slate-500">Grounded by provider</footer>
    </section>
  );
};

export default PlayerFormCard;
