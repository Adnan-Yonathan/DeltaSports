'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AuthMode = 'password' | 'magic-link';

export default function SignInPage() {
  const { signInWithEmail, signInWithPassword, session, loading } = useSupabaseAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [router, session]);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await signInWithPassword(
        formData.email,
        formData.password
      );

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage('Sign in successful! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0
        ? process.env.NEXT_PUBLIC_SITE_URL
        : window.location.origin;

    try {
      const { error: signInError } = await signInWithEmail(formData.email, {
        emailRedirectTo: `${redirectTo}/dashboard`,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage('Check your inbox for the magic link to sign in.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-black/50 p-8 text-white">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to DeltaSports</h1>
          <p className="text-sm text-slate-300">
            Access your Command Center and betting intelligence
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition ${
              authMode === 'password'
                ? 'bg-brand-accent text-black'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('magic-link')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition ${
              authMode === 'magic-link'
                ? 'bg-brand-accent text-black'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Password Form */}
        {authMode === 'password' && (
          <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
              <input
                required
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Enter your password"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || loading}
              className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Magic Link Form */}
        {authMode === 'magic-link' && (
          <form className="flex flex-col gap-4" onSubmit={handleMagicLinkSubmit}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
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

            <p className="text-xs text-slate-400">
              We'll email you a secure link to access your account instantly.
            </p>
          </form>
        )}

        {message ? (
          <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>
        ) : null}

        <div className="border-t border-white/5 pt-4 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link href="/sign-up" className="font-medium text-brand-accent hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
