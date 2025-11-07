'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type AuthMode = 'password' | 'magic-link';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Authentication is no longer required - redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-black/50 p-8 text-white">
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-300">
          Redirecting to Command Center...
        </p>
      </div>
    </div>
  );
}
