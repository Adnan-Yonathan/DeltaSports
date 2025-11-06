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

export type BankrollAccount = {
  id: string;
  user_id: string;
  label: string;
  currency: string;
  starting_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
};

export type BetStatus = "pending" | "won" | "lost" | "push" | "void";

export type Bet = {
  id: string;
  user_id: string;
  bankroll_id: string | null;
  event_name: string;
  market: string;
  wager_amount: number;
  american_odds: number | null;
  decimal_odds: number | null;
  expected_value: number | null;
  status: BetStatus;
  settled_payout: number | null;
  notes: string | null;
  placed_at: string;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BetTag = {
  bet_id: string;
  tag: string;
  tagged_at: string;
};

export type AlertOrigin = "model" | "creator" | "manual";

export type EdgeAlert = {
  id: string;
  user_id: string | null;
  origin: AlertOrigin;
  source_handle: string | null;
  market: string;
  sportsbook: string | null;
  edge_value: number;
  trigger_threshold: number | null;
  message: string;
  status: string;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
};

export type AlertEvent = {
  id: string;
  alert_id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreatorProfile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[] | null;
  created_at: string;
};

export type CreatorPost = {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  market: string | null;
  published_at: string;
  metadata: Record<string, unknown> | null;
};

export type CreatorSubscription = {
  id: string;
  user_id: string;
  creator_id: string;
  status: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { auth_user_id: string };
        Update: Partial<UserProfile>;
        Relationships: [];
      };
      chat_sessions: {
        Row: ChatSession;
        Insert: Partial<ChatSession> & { user_id: string };
        Update: Partial<ChatSession>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage> & { session_id: string; role: ChatMessageRole };
        Update: Partial<ChatMessage>;
        Relationships: [];
      };
      bankroll_accounts: {
        Row: BankrollAccount;
        Insert: Partial<BankrollAccount> & { user_id: string; label: string };
        Update: Partial<BankrollAccount>;
        Relationships: [];
      };
      bets: {
        Row: Bet;
        Insert: Partial<Bet> & { user_id: string; event_name: string; market: string; wager_amount: number };
        Update: Partial<Bet>;
        Relationships: [];
      };
      bet_tags: {
        Row: BetTag;
        Insert: BetTag;
        Update: Partial<BetTag>;
        Relationships: [];
      };
      edge_alerts: {
        Row: EdgeAlert;
        Insert: Partial<EdgeAlert> & { origin: AlertOrigin; market: string; message: string; edge_value: number };
        Update: Partial<EdgeAlert>;
        Relationships: [];
      };
      alert_events: {
        Row: AlertEvent;
        Insert: Partial<AlertEvent> & { alert_id: string; action: string };
        Update: Partial<AlertEvent>;
        Relationships: [];
      };
      creator_profiles: {
        Row: CreatorProfile;
        Insert: Partial<CreatorProfile> & { handle: string; display_name: string };
        Update: Partial<CreatorProfile>;
        Relationships: [];
      };
      creator_posts: {
        Row: CreatorPost;
        Insert: Partial<CreatorPost> & { creator_id: string; title: string; content: string };
        Update: Partial<CreatorPost>;
        Relationships: [];
      };
      creator_subscriptions: {
        Row: CreatorSubscription;
        Insert: Partial<CreatorSubscription> & { user_id: string; creator_id: string };
        Update: Partial<CreatorSubscription>;
        Relationships: [];
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

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Tables<TableName>["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Tables<TableName>["Update"];
