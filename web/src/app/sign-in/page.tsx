'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Authentication is no longer required - redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-black/50 p-8 text-center text-white">
        <p className="text-sm text-slate-300">
          Redirecting to Command Center...
        </p>
      </div>
    </div>
  );
}
