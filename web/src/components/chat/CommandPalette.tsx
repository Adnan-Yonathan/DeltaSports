"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: Command) => void;
}

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  league?: string;
}

const BASE_COMMANDS: Command[] = [
  { id: "injuries-today", title: "Today's injuries", subtitle: "Latest injury report", league: "NBA" },
  { id: "line-moves", title: "Top line moves 24h", subtitle: "Track line movement", league: "ALL" },
  { id: "player-props", title: "Player prop insights", subtitle: "Identify prop edges", league: "NBA" },
];

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<string>("ALL");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setLeagueFilter("ALL");
    }
  }, [isOpen]);

  const commands = useMemo(() => {
    return BASE_COMMANDS.filter((command) => {
      const matchesQuery = command.title
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesLeague =
        leagueFilter === "ALL" || command.league === "ALL" || command.league === leagueFilter;
      return matchesQuery && matchesLeague;
    });
  }, [query, leagueFilter]);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 p-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search commands or teams"
          />
          <div className="mt-3 flex gap-2 text-xs">
            {[
              "ALL",
              "NBA",
              "NFL",
              "MLB",
              "NHL",
              "EPL",
              "UFC",
            ].map((league) => (
              <button
                key={league}
                onClick={() => setLeagueFilter(league)}
                className={`rounded-full px-3 py-1 ${
                  leagueFilter === league
                    ? "bg-brand-accent text-brand"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        </div>
        <ul className="max-h-64 overflow-y-auto p-4" role="listbox">
          {commands.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">
              No commands match your search
            </li>
          ) : (
            commands.map((command) => (
              <li key={command.id}>
                <button
                  className="flex w-full flex-col items-start rounded px-3 py-2 text-left hover:bg-slate-800"
                  onClick={() => onExecute(command)}
                >
                  <span className="text-sm font-semibold">{command.title}</span>
                  {command.subtitle ? (
                    <span className="text-xs text-slate-400">{command.subtitle}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
