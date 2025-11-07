'use client';

import Link from 'next/link';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';

export function EmailVerificationBanner() {
  const { session } = useSupabaseAuth();

  if (!session?.user || session.user.email_confirmed_at) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-medium">Verify your email to unlock the Command Center.</p>
      <p className="mt-1 text-xs text-amber-200">
        Check your inbox for a confirmation link. Need another?{' '}
        <Link href="/login" className="underline">
          Resend from the login page
        </Link>
        .
      </p>
    </div>
  );
}
