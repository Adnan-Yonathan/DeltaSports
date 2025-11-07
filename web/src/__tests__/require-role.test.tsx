import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RequireRole } from '@/components/RequireRole';
import { SupabaseAuthProvider, type Profile } from '@/components/auth/SupabaseAuthProvider';

vi.mock('@supabase/ssr', () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  const mockClient = {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: null, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: mockSubscription } }),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
  };

  return {
    createBrowserClient: () => mockClient
  };
});

const baseSession = {
  access_token: 'token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'refresh',
  user: {
    id: 'user-1',
    email: 'user@example.com',
    email_confirmed_at: new Date().toISOString()
  }
} as const;

describe('RequireRole', () => {
  it('renders children when the profile role matches', () => {
    const profile: Profile = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'admin',
      created_at: new Date().toISOString()
    };

    render(
      <SupabaseAuthProvider initialSession={baseSession as any} initialProfile={profile}>
        <RequireRole role="admin">
          <p>Secret console</p>
        </RequireRole>
      </SupabaseAuthProvider>
    );

    expect(screen.getByText('Secret console')).toBeInTheDocument();
  });

  it('renders fallback when the role does not match', () => {
    const profile: Profile = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'user',
      created_at: new Date().toISOString()
    };

    render(
      <SupabaseAuthProvider initialSession={baseSession as any} initialProfile={profile}>
        <RequireRole role="admin" fallback={<span>No access</span>}>
          <p>Secret console</p>
        </RequireRole>
      </SupabaseAuthProvider>
    );

    expect(screen.getByText('No access')).toBeInTheDocument();
  });
});
