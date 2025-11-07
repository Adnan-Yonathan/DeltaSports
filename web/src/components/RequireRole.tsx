'use client';

import type { ReactNode } from 'react';

import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider';

type RequireRoleProps = {
  role: 'admin' | 'user';
  fallback?: ReactNode;
  children: ReactNode;
};

export function RequireRole({ role, fallback = null, children }: RequireRoleProps) {
  const { profile, loading } = useSupabaseAuth();

  if (loading) {
    return <div className="text-sm text-slate-300">Checking access…</div>;
  }

  if (!profile || profile.role !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
