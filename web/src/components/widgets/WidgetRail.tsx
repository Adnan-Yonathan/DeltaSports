"use client";

import { useMemo } from "react";

import { useChatSession } from "@/lib/chat/useChatSession";

import { InjuriesCard } from "./InjuriesCard";
import { LineMovementCard } from "./LineMovementCard";
import { OddsCard } from "./OddsCard";
import { PlayerFormCard } from "./PlayerFormCard";

export const WidgetRail = () => {
  const { latestWidgets, latestAssistant } = useChatSession();

  const widgets = useMemo(() => latestWidgets ?? [], [latestWidgets]);

  if (!widgets || widgets.length === 0) {
    return (
      <aside className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-6 text-sm text-slate-300">
        <p className="font-semibold text-white">Awaiting grounded widgets</p>
        <p>
          Ask about odds, player form, or injuries to populate real-time cards grounded in tool responses.
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-white">Live widgets</h3>
        <p className="text-sm text-slate-300">
          Powered by sports data tools and grounded LLM reasoning.
        </p>
        {typeof latestAssistant?.confidence === "number" ? (
          <p className="text-xs uppercase tracking-wide text-slate-500">Answer confidence {Math.round(latestAssistant.confidence * 100)}%</p>
        ) : null}
      </header>
      <div className="space-y-4">
        {widgets.map((widget) => {
          switch (widget.kind) {
            case "odds":
              return <OddsCard key={`odds-${widget.gameId}`} widget={widget} />;
            case "playerForm":
              return <PlayerFormCard key={`form-${widget.playerId}-${widget.stat}`} widget={widget} />;
            case "injuries":
              return <InjuriesCard key={`injuries-${widget.team}`} widget={widget} />;
            case "lineMovement":
              return <LineMovementCard key={`line-${widget.gameId}`} widget={widget} />;
            default:
              return null;
          }
        })}
      </div>
    </aside>
  );
};

export default WidgetRail;
