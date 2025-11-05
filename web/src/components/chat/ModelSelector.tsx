import React from "react";

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const LEAGUES = [
  "NBA",
  "NFL",
  "MLB",
  "NHL",
  "EPL",
  "UFC",
];

interface ModelSelectorProps {
  model: string;
  temperature: number;
  league: string;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onLeagueChange: (league: string) => void;
}

export function ModelSelector({
  model,
  temperature,
  league,
  onModelChange,
  onTemperatureChange,
  onLeagueChange,
}: ModelSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-400">
          Model
        </span>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
        >
          {MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-400">
          Temperature
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(event) => onTemperatureChange(Number(event.target.value))}
        />
        <span className="text-right text-[11px] text-slate-500">
          {temperature.toFixed(1)}
        </span>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-400">
          League
        </span>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
          value={league}
          onChange={(event) => onLeagueChange(event.target.value)}
        >
          {LEAGUES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
