"use client";

import { useCallback } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import type { QuickPrompt } from "./types";

type ComposerSubmitPayload = {
  prompt: string;
  quickPromptId?: string;
};

type ComposerProps = {
  value: string;
  disabled?: boolean;
  quickPrompts: readonly QuickPrompt[];
  onChange: (value: string) => void;
  onSubmit: (payload: ComposerSubmitPayload) => void;
};

export function Composer({ value, disabled, quickPrompts, onChange, onSubmit }: ComposerProps) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) {
        return;
      }

      onSubmit({ prompt: trimmed });
    },
    [disabled, onSubmit, value]
  );

  const handleQuickPrompt = useCallback(
    (prompt: QuickPrompt) => {
      onSubmit({ prompt: prompt.prompt, quickPromptId: prompt.id });
    },
    [onSubmit]
  );

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-black/70 p-4 text-sm text-slate-200 shadow-xl">
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-white/40 hover:text-white"
            onClick={() => handleQuickPrompt(prompt)}
            disabled={disabled}
          >
            {prompt.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 px-3 py-2">
          <label htmlFor="chat-composer" className="sr-only">
            Ask the DeltaSports assistant
          </label>
          <textarea
            id="chat-composer"
            rows={1}
            className="h-12 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Ask for odds, injury reports, or matchup context…"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                const trimmed = value.trim();
                if (!trimmed || disabled) {
                  return;
                }
                onSubmit({ prompt: trimmed });
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white"
            aria-label="Voice input coming soon"
            disabled={disabled}
          >
            🎙️
          </button>
          <button
            type="submit"
            className="flex h-10 min-w-[3rem] items-center justify-center rounded-full bg-brand-accent px-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || !value.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Composer;
