"use client";

import { useEffect, useMemo, useState } from "react";

export type Command = {
  id: string;
  label: string;
  onSelect: () => void;
  keywords?: string[];
};

type CommandPaletteProps = {
  commands: Command[];
};

export function CommandPalette({ commands }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const normalized = query.toLowerCase();
    return commands.filter((command) => {
      const haystack = [command.label, ...(command.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [commands, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 text-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 px-4 py-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto px-2 py-2" role="listbox">
          {filtered.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-800"
                onClick={() => {
                  setOpen(false);
                  command.onSelect();
                }}
              >
                {command.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">No commands found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
