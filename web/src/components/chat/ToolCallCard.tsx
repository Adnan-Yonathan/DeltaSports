"use client";

type ToolCallCardProps = {
  name: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  latencyMs?: number | null;
};

export function ToolCallCard({ name, args, result, latencyMs }: ToolCallCardProps) {
  return (
    <details className="rounded border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-300">
      <summary className="cursor-pointer font-semibold">
        Tool call: {name}
        {typeof latencyMs === "number" && <span className="ml-2 text-slate-500">{latencyMs} ms</span>}
      </summary>
      <div className="mt-2 space-y-2">
        <pre className="overflow-x-auto rounded bg-slate-950 p-2">{JSON.stringify(args, null, 2)}</pre>
        {result && <pre className="overflow-x-auto rounded bg-slate-950 p-2">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </details>
  );
}
