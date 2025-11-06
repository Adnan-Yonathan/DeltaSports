"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }

      const redirectTo = searchParams?.get("redirectedFrom") ?? "/dashboard";
      router.replace(redirectTo);
    },
    [email, password, router, searchParams, supabase.auth]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="text-sm text-slate-300">
          Sign in with the credentials tied to your DeltaSports workspace.
        </p>
      </div>
      <div className="space-y-4">
        <label className="block text-left text-sm text-slate-300">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </label>
        <label className="block text-left text-sm text-slate-300">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </label>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-brand-accent py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Need an account?{" "}
        <Link href="/sign-up" className="font-medium text-brand-accent hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
