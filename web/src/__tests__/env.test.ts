import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Env = NodeJS.ProcessEnv;

const originalEnv = { ...process.env } as Env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('env', () => {
  it('validates and exposes public environment variables', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.ADMIN_EMAILS = 'founder@delta.app,ops@delta.app';
    process.env.REDIRECT_AFTER_LOGIN = '/command-center';
    process.env.REDIRECT_AFTER_LOGOUT = '/login';

    const { publicEnv, adminEmailSet } = await import('@/lib/env');

    expect(publicEnv.supabaseUrl).toBe('https://example.supabase.co');
    expect(publicEnv.redirectAfterLogin).toBe('/command-center');
    expect(adminEmailSet.has('ops@delta.app')).toBe(true);
  });

  it('throws when required env values are missing', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    await expect(import('@/lib/env')).rejects.toThrow();
  });
});
