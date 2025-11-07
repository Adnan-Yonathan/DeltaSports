'use client';

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

import { publicEnv } from '@/lib/env';

let client: SupabaseClient | null = null;

export const getBrowserSupabaseClient = () => {
  if (client) {
    return client;
  }

  client = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true
    }
  });

  return client;
};
