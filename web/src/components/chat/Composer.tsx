"use client";

import React, { useCallback, useRef, useState } from "react";
import { ModelSelector } from "./ModelSelector";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onRegenerate?: () => void;
  onEditLast?: () => void;
  disabled?: boolean;
  model: string;
  temperature: number;
  league: string;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onLeagueChange: (league: string) => void;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onRegenerate,
  onEditLast,
  disabled,
  model,
  temperature,
  league,
  onModelChange,
  onTemperatureChange,
  onLeagueChange,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  const handleFileChange = () => {
    const files = fileInputRef.current?.files;
    if (!files) return;
    setAttachments(Array.from(files));
  };

  return (
    <div className="space-y-4 border-t border-slate-800 bg-slate-950/40 p-4">
      <ModelSelector
        model={model}
        temperature={temperature}
        league={league}
        onModelChange={onModelChange}
        onTemperatureChange={onTemperatureChange}
        onLeagueChange={onLeagueChange}
      />
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="Ask Delta about odds, injuries, or matchup edges..."
          className="w-full resize-none bg-transparent text-sm outline-none"
          disabled={disabled}
          aria-label="Message input"
        />
        {attachments.length > 0 ? (
          <div className="mt-2 text-xs text-slate-400">
            Attachments: {attachments.map((file) => file.name).join(", ")}
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
            >
              Attach CSV/JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
            {onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
              >
                Regenerate
              </button>
            ) : null}
            {onEditLast ? (
              <button
                type="button"
                onClick={onEditLast}
                className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
              >
                Edit &amp; Resend
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || value.trim().length === 0}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand disabled:opacity-50"
          >
            Send ↵
          </button>
        </div>
      </div>
    </div>
  );
}
