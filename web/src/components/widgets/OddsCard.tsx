"use client";

import useSWR from "swr";

import type { AssistantWidget } from "@/components/chat/types";

const formatMoneyline = (value: number | undefined) => {
  if (value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return value > 0 ? `+${value}` : `${value}`;
};

type OddsCardProps = {
  widget: Extract<AssistantWidget, { kind: "odds" }>;
};

export const OddsCard = ({ widget }: OddsCardProps) => {
  const params = widget.gameId ? new URLSearchParams({ gameId: widget.gameId }) : null;
  const fallbackData = widget.moneyline || widget.implied
    ? {
        data: {
          moneyline: widget.moneyline,
          implied: widget.implied,
          fetchedAt: new Date().toISOString(),
        },
      }
    : undefined;

  const { data, isLoading, error } = useSWR(
    params ? `/api/tools/odds?${params.toString()}` : null,
    {
      fallbackData,
      revalidateOnFocus: false,
    }
  );

  const result = (data as { data?: { moneyline?: { home?: number; away?: number }; implied?: { home?: number; away?: number }; fetchedAt?: string } } | undefined)?.data;
  const moneyline = result?.moneyline ?? widget.moneyline ?? {};
  const implied = result?.implied ?? widget.implied ?? {};
  const fetchedAt = result?.fetchedAt;

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Moneyline & implied probability</p>
        <h4 className="text-lg font-semibold text-white">{widget.gameId}</h4>
      </header>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1 rounded-xl border border-white/10 bg-black/50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Home</p>
          <p className="text-lg font-semibold text-white">{formatMoneyline(moneyline.home)}</p>
          <p className="text-xs text-slate-400">Implied {(implied.home ?? 0) > 0 ? `${Math.round((implied.home ?? 0) * 100)}%` : "—"}</p>
        </div>
        <div className="space-y-1 rounded-xl border border-white/10 bg-black/50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Away</p>
          <p className="text-lg font-semibold text-white">{formatMoneyline(moneyline.away)}</p>
          <p className="text-xs text-slate-400">Implied {(implied.away ?? 0) > 0 ? `${Math.round((implied.away ?? 0) * 100)}%` : "—"}</p>
        </div>
      </div>
      <footer className="text-[11px] uppercase tracking-wide text-slate-500">
        {isLoading ? "Refreshing odds…" : error ? "Odds unavailable" : `Updated ${new Date(fetchedAt ?? Date.now()).toLocaleTimeString()}`}
      </footer>
    </section>
  );
};

export default OddsCard;
