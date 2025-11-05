"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { ModelSelector } from "./ModelSelector";

type ComposerProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  model: string;
  onModelChange: (value: string) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  league: string;
  onLeagueChange: (value: string) => void;
  onAttach?: (file: File) => void;
  onRegenerate?: () => void;
};

const leagues = ["NBA", "NFL", "MLB", "NHL", "EPL", "UFC"];

export function Composer({
  prompt,
  onPromptChange,
  onSubmit,
  disabled,
  model,
  onModelChange,
  temperature,
  onTemperatureChange,
  league,
  onLeagueChange,
  onAttach,
  onRegenerate,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-slate-200">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <ModelSelector model={model} onChange={onModelChange} />
        <label className="flex flex-col">
          Temperature
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(event) => onTemperatureChange(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col">
          League
          <select
            value={league}
            onChange={(event) => onLeagueChange(event.target.value)}
            className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
          >
            <option value="">All</option>
            {leagues.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="self-end rounded border border-slate-700 px-2 py-1 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          Attach
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && onAttach) onAttach(file);
          }}
        />
        {onRegenerate && (
          <button
            type="button"
            className="self-end rounded border border-slate-700 px-2 py-1 text-xs"
            onClick={onRegenerate}
          >
            Regenerate
          </button>
        )}
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Delta about odds, injuries, or projections…"
        className="h-32 w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-label="Chat prompt"
        disabled={disabled}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded bg-slate-800 px-4 py-2 text-sm"
          onClick={onSubmit}
          disabled={disabled}
        >
          Submit (⌘↵)
        </button>
      </div>
    </div>
  );
}
