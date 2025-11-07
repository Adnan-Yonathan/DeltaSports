-- ============================================================================
-- DeltaSports Database Schema - Complete Deployment Script
-- ============================================================================
-- Execute this script in Supabase SQL Editor to create all tables and types
-- ============================================================================

-- 1. ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DOMAIN & ENUM TYPES
-- ============================================================================

-- Normalized currency code type (ISO-4217)
DO $$ BEGIN
  CREATE DOMAIN currency_code AS TEXT
    CHECK (value ~ '^[A-Z]{3}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Track bet outcomes
DO $$ BEGIN
  CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'push', 'void');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Identify how an alert was generated
DO $$ BEGIN
  CREATE TYPE alert_origin AS ENUM ('model', 'creator', 'manual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AI assistant tone preferences
DO $$ BEGIN
  CREATE TYPE tone_preference AS ENUM ('neutral', 'confident', 'cautious');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. CORE TABLES - USER PROFILES
-- ============================================================================

-- Link authenticated users to betting preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  preferred_timezone TEXT DEFAULT 'UTC',
  favorite_sports TEXT[] DEFAULT ARRAY[]::TEXT[],
  bankroll_goal NUMERIC(12,2),
  tone_preference tone_preference NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(auth_user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id
  ON public.user_profiles (auth_user_id);

-- 4. CHAT HISTORY
-- ============================================================================

-- Persistent chat sessions linked to users
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual messages within chat sessions
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient message retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON public.chat_messages (session_id, created_at);

-- Index for user's session list
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
  ON public.chat_sessions (user_id, last_message_at DESC);

-- 5. BANKROLL TRACKING
-- ============================================================================

-- Track bankroll accounts a bettor manages
CREATE TABLE IF NOT EXISTS public.bankroll_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  currency currency_code NOT NULL DEFAULT 'USD',
  starting_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user's bankroll lookup
CREATE INDEX IF NOT EXISTS idx_bankroll_accounts_user
  ON public.bankroll_accounts (user_id, updated_at DESC);

-- Individual bets tied to bankrolls
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  bankroll_id UUID REFERENCES public.bankroll_accounts (id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  market TEXT NOT NULL,
  wager_amount NUMERIC(12,2) NOT NULL,
  american_odds INTEGER,
  decimal_odds NUMERIC(8,4),
  expected_value NUMERIC(8,4),
  status bet_status NOT NULL DEFAULT 'pending',
  settled_payout NUMERIC(12,2),
  notes TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for bet queries
CREATE INDEX IF NOT EXISTS idx_bets_user
  ON public.bets (user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_bankroll
  ON public.bets (bankroll_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_status
  ON public.bets (user_id, status, placed_at DESC);

-- Optional tags that drive behavioral insights
CREATE TABLE IF NOT EXISTS public.bet_tags (
  bet_id UUID REFERENCES public.bets (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bet_id, tag)
);

-- Index for tag queries
CREATE INDEX IF NOT EXISTS idx_bet_tags_tag
  ON public.bet_tags (tag, tagged_at DESC);

-- 6. EDGE INTELLIGENCE
-- ============================================================================

-- Alerts emitted from the value models or creators
CREATE TABLE IF NOT EXISTS public.edge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  origin alert_origin NOT NULL DEFAULT 'model',
  source_handle TEXT,
  market TEXT NOT NULL,
  sportsbook TEXT,
  edge_value NUMERIC(8,4) NOT NULL,
  trigger_threshold NUMERIC(8,4),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active alerts
CREATE INDEX IF NOT EXISTS idx_edge_alerts_user_active
  ON public.edge_alerts (user_id, status, triggered_at DESC);

-- Immutable log of alert consumption for accountability reports
CREATE TABLE IF NOT EXISTS public.alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.edge_alerts (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for alert event queries
CREATE INDEX IF NOT EXISTS idx_alert_events_alert
  ON public.alert_events (alert_id, created_at);
CREATE INDEX IF NOT EXISTS idx_alert_events_user
  ON public.alert_events (user_id, created_at DESC);

-- 7. CREATOR NETWORK
-- ============================================================================

-- Registered creators that bettors can follow
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for handle lookup
CREATE INDEX IF NOT EXISTS idx_creator_profiles_handle
  ON public.creator_profiles (handle);

-- Posts that populate the creator feed
CREATE TABLE IF NOT EXISTS public.creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  market TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Index for creator's posts
CREATE INDEX IF NOT EXISTS idx_creator_posts_creator
  ON public.creator_posts (creator_id, published_at DESC);

-- Subscription relationship between bettors and creators
CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, creator_id)
);

-- Index for user's subscriptions
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_user
  ON public.creator_subscriptions (user_id, status, created_at DESC);

-- 8. UTILITY TRIGGERS
-- ============================================================================

-- Keep updated_at columns current without manual writes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS user_profiles_updated ON public.user_profiles;
CREATE TRIGGER user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS bankroll_accounts_updated ON public.bankroll_accounts;
CREATE TRIGGER bankroll_accounts_updated
  BEFORE UPDATE ON public.bankroll_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS bets_updated ON public.bets;
CREATE TRIGGER bets_updated
  BEFORE UPDATE ON public.bets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS chat_sessions_updated ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after executing the script to verify everything was created:

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- Check all enums exist
-- SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;

-- Check all indexes exist
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Next step: Execute 02-rls-policies.sql to configure Row Level Security
-- ============================================================================
