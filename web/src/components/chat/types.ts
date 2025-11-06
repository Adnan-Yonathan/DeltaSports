export type OddsFormat = "american" | "decimal" | "fractional";

export type BaseMessage = {
  id: string;
  createdAt: string;
};

export type UserMessage = BaseMessage & {
  role: "user";
  content: string;
};

export type AssistantSection = {
  id: string;
  title: string;
  items: readonly string[];
};

export type SourceBadge = {
  id: string;
  label: string;
  href?: string;
};

export type AssistantOdds = {
  american?: string;
  decimal?: string;
  fractional?: string;
  impliedProbability?: string;
};

export type AssistantStatus = "draft" | "complete" | "error";

export type AssistantMessage = BaseMessage & {
  role: "assistant";
  headline?: string;
  summary?: string;
  odds?: AssistantOdds;
  sections?: readonly AssistantSection[];
  sources?: readonly SourceBadge[];
  status: AssistantStatus;
  error?: string;
};

export type ConversationMessage = UserMessage | AssistantMessage;

export type QuickPrompt = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};
