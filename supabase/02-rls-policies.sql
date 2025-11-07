-- ============================================================================
-- DeltaSports Row Level Security (RLS) Policies
-- ============================================================================
-- Execute this script AFTER 01-schema.sql to configure security policies
-- ============================================================================

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- 2. CHAT SESSIONS & MESSAGES
-- ============================================================================

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own chat sessions
CREATE POLICY "Users can read own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own chat sessions
CREATE POLICY "Users can create own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can read messages from their own sessions
CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can create messages in their own sessions
CREATE POLICY "Users can create messages in own sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 3. BANKROLL ACCOUNTS
-- ============================================================================

ALTER TABLE public.bankroll_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own bankroll accounts
CREATE POLICY "Users can read own bankroll accounts"
  ON public.bankroll_accounts FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own bankroll accounts
CREATE POLICY "Users can create own bankroll accounts"
  ON public.bankroll_accounts FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own bankroll accounts
CREATE POLICY "Users can update own bankroll accounts"
  ON public.bankroll_accounts FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own bankroll accounts
CREATE POLICY "Users can delete own bankroll accounts"
  ON public.bankroll_accounts FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. BETS & BET TAGS
-- ============================================================================

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_tags ENABLE ROW LEVEL SECURITY;

-- Users can read their own bets
CREATE POLICY "Users can read own bets"
  ON public.bets FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own bets
CREATE POLICY "Users can create own bets"
  ON public.bets FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own bets
CREATE POLICY "Users can update own bets"
  ON public.bets FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own bets
CREATE POLICY "Users can delete own bets"
  ON public.bets FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can read tags on their own bets
CREATE POLICY "Users can read own bet tags"
  ON public.bet_tags FOR SELECT
  USING (
    bet_id IN (
      SELECT id FROM public.bets
      WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can create tags on their own bets
CREATE POLICY "Users can create own bet tags"
  ON public.bet_tags FOR INSERT
  WITH CHECK (
    bet_id IN (
      SELECT id FROM public.bets
      WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can delete tags from their own bets
CREATE POLICY "Users can delete own bet tags"
  ON public.bet_tags FOR DELETE
  USING (
    bet_id IN (
      SELECT id FROM public.bets
      WHERE user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 5. EDGE ALERTS & ALERT EVENTS
-- ============================================================================

ALTER TABLE public.edge_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own alerts (or global alerts with NULL user_id)
CREATE POLICY "Users can read own alerts"
  ON public.edge_alerts FOR SELECT
  USING (
    user_id IS NULL OR
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own manual alerts
CREATE POLICY "Users can create own alerts"
  ON public.edge_alerts FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts"
  ON public.edge_alerts FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can read alert events for their own alerts
CREATE POLICY "Users can read own alert events"
  ON public.alert_events FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create alert events for their own interactions
CREATE POLICY "Users can create own alert events"
  ON public.alert_events FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CREATOR NETWORK
-- ============================================================================

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read creator profiles
CREATE POLICY "Authenticated users can read creator profiles"
  ON public.creator_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- All authenticated users can read creator posts
CREATE POLICY "Authenticated users can read creator posts"
  ON public.creator_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON public.creator_subscriptions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON public.creator_subscriptions FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON public.creator_subscriptions FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON public.creator_subscriptions FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. SERVICE ROLE BYPASS
-- ============================================================================
-- Service role (used by edge functions) can bypass RLS for all operations
-- This is automatically handled by Supabase when using service_role_key

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify RLS is enabled on all tables:

-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN (
--   'user_profiles', 'chat_sessions', 'chat_messages', 'bankroll_accounts',
--   'bets', 'bet_tags', 'edge_alerts', 'alert_events',
--   'creator_profiles', 'creator_posts', 'creator_subscriptions'
-- )
-- ORDER BY tablename;

-- Check all policies exist (should see multiple policies per table):
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- SECURITY CONFIGURATION COMPLETE
-- ============================================================================
-- Next step: Configure environment variables and deploy edge functions
-- ============================================================================
