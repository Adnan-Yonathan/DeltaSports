export type UserProfile = {
  id: string;
  auth_user_id: string;
  preferred_timezone: string | null;
  favorite_sports: string[] | null;
  bankroll_goal: number | null;
  created_at: string;
  updated_at: string;
};

export type ChatSession = {
  id: string;
  user_id: string;
  title: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  session_id: string;
  role: ChatMessageRole;
  content: Record<string, unknown>;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type AlertEvent = {
  id: string;
  alert_id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { auth_user_id: string };
        Update: Partial<UserProfile>;
      };
      chat_sessions: {
        Row: ChatSession;
        Insert: Partial<ChatSession> & { user_id: string };
        Update: Partial<ChatSession>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage> & { session_id: string; role: ChatMessageRole };
        Update: Partial<ChatMessage>;
      };
      alert_events: {
        Row: AlertEvent;
        Insert: Partial<AlertEvent> & { alert_id: string; action: string };
        Update: Partial<AlertEvent>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName];

export type TablesRow<TableName extends keyof Database["public"]["Tables"]> =
  Tables<TableName>["Row"];

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Tables<TableName>["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Tables<TableName>["Update"];
