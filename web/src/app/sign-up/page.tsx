'use client';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignUpPage() {
  const { signUpWithPassword, session, loading } = useSupabaseAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const { error: signUpError, data } = await signUpWithPassword(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
        }
      );

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Check if email confirmation is required
        if (data.user.confirmed_at) {
          setMessage('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          setMessage(
            'Account created! Please check your email to verify your account before signing in.'
          );
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
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
          <h1 className="text-2xl font-semibold">Create your DeltaSports account</h1>
          <p className="text-sm text-slate-300">
            Join the platform for intelligent sports betting analysis
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-slate-400">Full Name</span>
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              placeholder="John Doe"
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
          </label>

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
              placeholder="Min. 8 characters"
              minLength={8}
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Confirm Password
            </span>
            <input
              required
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Re-enter password"
              minLength={8}
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || loading}
            className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {message ? (
          <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>
        ) : null}

        <div className="border-t border-white/5 pt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-brand-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
