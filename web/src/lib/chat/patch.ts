import type {
  AssistantOdds,
  AssistantSection,
  AssistantStatus,
  SourceBadge,
} from "@/components/chat/types";

export type AssistantStreamPatch = {
  headline?: string;
  summary?: string;
  summaryDelta?: string;
  odds?: AssistantOdds;
  sections?: readonly AssistantSection[];
  section?: AssistantSection;
  sources?: readonly SourceBadge[];
  status?: AssistantStatus;
  error?: string;
};
