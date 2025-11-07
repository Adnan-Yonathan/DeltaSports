'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { getBrowserSupabaseClient } from '@/lib/supabase/client';

export type Profile = {
  id: string;
  email: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

type SupabaseAuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

type SupabaseAuthProviderProps = {
  initialSession: Session | null;
  initialProfile: Profile | null;
  children: ReactNode;
};

export function SupabaseAuthProvider({ initialSession, initialProfile, children }: SupabaseAuthProviderProps) {
  const supabase = getBrowserSupabaseClient();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState<boolean>(!initialSession);

  const loadProfile = useCallback(
    async (user: User | null) => {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Unable to fetch profile', error);
        return;
      }

      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    const exchangeToken = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const url = new URL(window.location.href);
      const hasCode = url.searchParams.get('code') || url.searchParams.get('access_token');

      if (!hasCode) {
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error('Failed to exchange auth code for a session', error);
      }

      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    };

    void exchangeToken();
  }, [supabase]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    if (!profile) {
      void loadProfile(session.user);
    }
  }, [loadProfile, profile, session]);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      refreshProfile: () => loadProfile(session?.user ?? null)
    }),
    [loadProfile, loading, profile, session]
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);

  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }

  return context;
};
