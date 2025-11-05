import React from "react";
import type { ChatCitation } from "./MessageBubble";

interface CitationsProps {
  citations: ChatCitation[];
}

export function Citations({ citations }: CitationsProps) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {citations.map((citation, index) => (
        <a
          key={`${citation.label}-${index}`}
          href={citation.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-brand-accent px-3 py-1 text-brand-accent transition hover:bg-brand-accent hover:text-brand"
        >
          {citation.label}
          {citation.fetchedAt ? (
            <span className="ml-2 text-slate-400">{new Date(citation.fetchedAt).toLocaleTimeString()}</span>
          ) : null}
        </a>
      ))}
    </div>
  );
}
