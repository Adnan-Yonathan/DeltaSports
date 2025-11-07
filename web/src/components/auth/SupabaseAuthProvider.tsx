'use client';

import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SignInOptions = {
  emailRedirectTo?: string;
};

type UserProfile = {
  id: string;
  auth_user_id: string;
  preferred_timezone: string;
  favorite_sports: string[];
  bankroll_goal: number | null;
  tone_preference: 'neutral' | 'confident' | 'cautious';
  created_at: string;
  updated_at: string;
};

type SupabaseAuthContextValue = {
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    options?: SignInOptions
  ) => ReturnType<ReturnType<typeof getSupabaseClient>['auth']['signInWithOtp']>;
  signOut: () => ReturnType<ReturnType<typeof getSupabaseClient>['auth']['signOut']>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(
  undefined
);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const hasAuthParams = url.searchParams.get('code') || url.searchParams.get('access_token');

          if (hasAuthParams) {
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

            if (error) {
              console.error('Failed to exchange code for session', error);
            }

            url.search = '';
            window.history.replaceState({}, document.title, url.toString());
          }
        }

        const {
          data: { session: initialSession }
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setSession(initialSession);
      } catch (error) {
        console.error('Failed to initialize Supabase session', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initialize();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      if (!session?.user?.id) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Failed to fetch user profile', error);
          return;
        }

        if (isMounted && data) {
          setUserProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile', error);
      }
    };

    void fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [session, supabase]);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      session,
      userProfile,
      loading,
      signInWithEmail: (email: string, options?: SignInOptions) => {
        const signInOptions = options?.emailRedirectTo
          ? { emailRedirectTo: options.emailRedirectTo, shouldCreateUser: true }
          : { shouldCreateUser: true };

        return supabase.auth.signInWithOtp({
          email,
          options: signInOptions
        });
      },
      signOut: () => supabase.auth.signOut()
    }),
    [loading, session, userProfile, supabase]
  );

  return (
    <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);

  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }

  return context;
};
