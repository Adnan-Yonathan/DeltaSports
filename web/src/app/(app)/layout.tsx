'use client';

import { Sidebar } from '@/components/chat/Sidebar';
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useMemo } from 'react';

function CommandCenterGuard({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/sign-in');
    }
  }, [loading, router, session]);

  const handleSignOut = useCallback(async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error during sign out', error);
      return;
    }

    router.replace('/sign-in');
  }, [router, signOut]);

  const userEmail = useMemo(() => {
    if (!session) {
      return 'Account';
    }

    const metadataEmail = session.user.user_metadata?.email;

    return session.user.email ?? (typeof metadataEmail === 'string' ? metadataEmail : 'Account');
  }, [session]);

  if (loading) {
    return (
      <section className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-sm text-slate-300">
        Loading Command Center...
      </section>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <section className="flex h-full w-full gap-6">
      <Suspense
        fallback={
          <aside className="hidden w-full max-w-xs rounded-2xl border border-white/5 bg-black/30 lg:flex" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/40">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-black/60 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Active session</p>
            <h2 className="text-xl font-semibold text-white">Command Center</h2>
            <p className="text-sm text-slate-300">Live bankroll guardrails and odds intelligence streamed in real time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-slate-400">Tone</span>
              <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5 text-xs">
                <button
                  type="button"
                  className="px-3 py-1 font-medium text-white"
                  aria-pressed="true"
                >
                  Neutral
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-pressed="false"
                >
                  Confident
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-pressed="false"
                >
                  Cautious
                </button>
              </div>
            </div>
            <div className="flex flex-col text-right text-xs text-slate-400">
              <span className="uppercase tracking-wide">Last synced</span>
              <span className="text-sm font-medium text-white">2:45 PM ET</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-slate-400">
                <span className="block uppercase tracking-wide">Signed in</span>
                <span className="text-sm font-medium text-white">{userEmail}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </section>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return <CommandCenterGuard>{children}</CommandCenterGuard>;
}
