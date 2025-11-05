"use client";

type Citation = {
  id: string;
  label: string;
  url?: string;
  fetchedAt?: string;
};

type CitationsProps = {
  citations?: Citation[];
};

export function Citations({ citations }: CitationsProps) {
  if (!citations || citations.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2 text-xs" aria-label="Citations">
      {citations.map((citation) => (
        <li key={citation.id}>
          <a
            href={citation.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-1 text-slate-300 hover:border-sky-400 hover:text-sky-200"
          >
            <span>{citation.label}</span>
            {citation.fetchedAt && <time className="text-slate-500">{new Date(citation.fetchedAt).toLocaleString()}</time>}
          </a>
        </li>
      ))}
    </ul>
  );
}
