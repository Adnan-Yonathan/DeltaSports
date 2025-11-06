'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const { signInWithEmail, session, loading } = useSupabaseAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [router, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0
        ? process.env.NEXT_PUBLIC_SITE_URL
        : window.location.origin;

    const { error: signInError } = await signInWithEmail(email, {
      emailRedirectTo: `${redirectTo}/dashboard`
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage('Check your inbox for the magic link to sign in.');
    }

    setSubmitting(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-black/50 p-8 text-white">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Sign in to DeltaSports</h1>
        <p className="text-sm text-slate-300">
          Enter your email address and we’ll send you a secure magic link to access the Command Center.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || loading}
          className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending magic link...' : 'Send magic link'}
        </button>
      </form>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
