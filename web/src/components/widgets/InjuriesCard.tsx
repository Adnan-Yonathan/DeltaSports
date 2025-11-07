"use client";

import type { AssistantWidget } from "@/components/chat/types";
import { useToolData } from "@/lib/hooks/useToolData";

type InjuriesWidget = Extract<AssistantWidget, { kind: "injuries" }>;

type InjuriesCardProps = {
  widget: InjuriesWidget;
};

export const InjuriesCard = ({ widget }: InjuriesCardProps) => {
  const params = new URLSearchParams({ team: widget.team });
  const { data } = useToolData<{ data?: InjuriesWidget }>(`/api/tools/injuries?${params.toString()}`, {
    fallbackData: { data: widget },
  });

  const injuries = data?.data?.list ?? widget.list;

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Injury report</p>
        <h4 className="text-lg font-semibold text-white">{widget.team.toUpperCase()}</h4>
      </header>
      <ul className="space-y-2 text-sm">
        {injuries.length === 0 ? (
          <li className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-slate-400">No reported injuries.</li>
        ) : (
          injuries.map((entry) => (
            <li key={`${entry.player}-${entry.status}`} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2">
              <p className="text-sm font-semibold text-white">{entry.player}</p>
              <p className="text-xs text-slate-400">{entry.status}{entry.impact ? ` · Impact ${entry.impact}` : ""}</p>
            </li>
          ))
        )}
      </ul>
      <footer className="text-[11px] uppercase tracking-wide text-slate-500">Official injury feed</footer>
    </section>
  );
};

export default InjuriesCard;
