"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 self-start rounded-2xl border border-dashed border-white/10 bg-black/40 px-4 py-3 text-xs text-slate-300">
      <span className="font-medium text-white">Assistant</span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
      </span>
      <span className="text-slate-500">Streaming insights…</span>
    </div>
  );
}

export default TypingIndicator;
