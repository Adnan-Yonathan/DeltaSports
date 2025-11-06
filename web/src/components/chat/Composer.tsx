"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }

    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 240)}px`;
  }, [value]);

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/70 p-4 text-sm text-slate-200 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20"
            onClick={() => handleQuickPrompt(prompt)}
            disabled={disabled}
          >
            {prompt.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-end gap-3 sm:gap-4">
        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white sm:flex"
          aria-label="Add attachments (coming soon)"
          disabled
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M10 4v12M4 10h12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 px-3 py-2">
          <label htmlFor="chat-composer" className="sr-only">
            Ask the DeltaSports assistant
          </label>
          <textarea
            id="chat-composer"
            rows={1}
            ref={textareaRef}
            className="max-h-60 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
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
            type="submit"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || !value.trim()}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M2.705 10.289l13-7a1 1 0 0 1 1.441 1.086l-1.65 6.605a1 1 0 0 1-.708.729l-4.32 1.236a.25.25 0 0 0-.059.045l-2.62 2.62a.75.75 0 0 1-1.28-.53V12.53a.25.25 0 0 0-.073-.177l-3.731-3.73a1 1 0 0 1 .001-1.334z" />
            </svg>
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default Composer;
