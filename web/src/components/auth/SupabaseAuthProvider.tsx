'use client';

import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SignInOptions = {
  emailRedirectTo?: string;
};

type SupabaseAuthContextValue = {
  session: Session | null;
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

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      session,
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
    [loading, session, supabase]
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
