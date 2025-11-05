import React from "react";
import type { ChatToolCall } from "./MessageBubble";

interface ToolCallCardProps {
  toolCall: ChatToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  return (
    <div className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-xs text-slate-300">
      <div className="mb-2 flex items-center justify-between font-semibold text-slate-200">
        <span>{toolCall.name}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-slate-500">
            Args
          </h4>
          <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-950/60 p-2">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
        {toolCall.result ? (
          <div>
            <h4 className="text-[11px] uppercase tracking-wide text-slate-500">
              Result
            </h4>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-950/60 p-2">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
