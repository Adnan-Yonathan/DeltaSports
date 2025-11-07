import type {
  AssistantStatus,
  AssistantWidget,
  SourceAttribution,
  ToolTrace,
} from "@/components/chat/types";

export type AssistantStreamPatch = {
  headline?: string;
  summary?: string;
  summaryDelta?: string;
  answer?: string;
  widgets?: readonly AssistantWidget[];
  sources?: readonly SourceAttribution[];
  warnings?: readonly string[];
  confidence?: number;
  caveats?: readonly string[];
  trace?: readonly ToolTrace[];
  status?: AssistantStatus;
  error?: string;
};
