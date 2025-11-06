"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type SupabaseBrowserEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
};

const resolveEnv = (): SupabaseBrowserEnv => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  if (!isConfigured && process.env.NODE_ENV === "development") {
    console.warn(
      "Supabase credentials are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for full functionality."
    );
  }

  return {
    supabaseUrl: supabaseUrl ?? "http://127.0.0.1:54321",
    supabaseAnonKey: supabaseAnonKey ?? "public-anon-key",
    isConfigured,
  } satisfies SupabaseBrowserEnv;
};

const env = resolveEnv();

let browserClient: SupabaseClient<Database, "public"> | null = null;

export const isBrowserSupabaseConfigured = env.isConfigured;

export const getBrowserSupabaseClient = () => {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient<Database, "public">(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "deltasports.auth",
    },
  });

  return browserClient;
};

export type BrowserSupabaseClient = SupabaseClient<Database, "public">;
