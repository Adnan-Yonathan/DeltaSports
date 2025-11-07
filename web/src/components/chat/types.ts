export type OddsFormat = "american" | "decimal" | "fractional";

export type BaseMessage = {
  id: string;
  createdAt: string;
};

export type UserMessage = BaseMessage & {
  role: "user";
  content: string;
};

export type SourceAttribution = {
  provider: string;
  endpoint: string;
  ids: readonly string[];
  fetchedAt: string;
};

export type AssistantWidget =
  | {
      kind: "odds";
      gameId: string;
      moneyline?: { home?: number; away?: number };
      implied?: { home?: number; away?: number };
    }
  | {
      kind: "playerForm";
      playerId: string;
      stat: string;
      points: number[];
      summary: string;
    }
  | {
      kind: "lineMovement";
      gameId: string;
      series: Array<{ t: number; value: number }>;
      notable?: string[];
    }
  | {
      kind: "injuries";
      team: string;
      list: Array<{ player: string; status: string; impact?: string }>;
    };

export type ToolTrace = {
  id: string;
  name: string;
  cacheHit: boolean;
  durationMs: number;
  ok: boolean;
  source?: string;
  args: Record<string, unknown>;
};

export type AssistantStatus = "draft" | "complete" | "error";

export type AssistantMessage = BaseMessage & {
  role: "assistant";
  headline?: string;
  summary?: string;
  answer?: string;
  widgets?: readonly AssistantWidget[];
  sources?: readonly SourceAttribution[];
  warnings?: readonly string[];
  trace?: readonly ToolTrace[];
  confidence?: number;
  caveats?: readonly string[];
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
