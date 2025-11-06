import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type SupabaseServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
};

const resolveEnv = (): SupabaseServerEnv => {
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
  } satisfies SupabaseServerEnv;
};

const env = resolveEnv();

const parseAccessToken = (value: string): string | null => {
  try {
    const parsed = JSON.parse(value) as
      | { access_token?: unknown; currentSession?: { access_token?: unknown } }
      | null;

    if (parsed && typeof parsed === "object") {
      if (typeof parsed.access_token === "string" && parsed.access_token.length > 0) {
        return parsed.access_token;
      }

      if (
        parsed.currentSession &&
        typeof parsed.currentSession.access_token === "string" &&
        parsed.currentSession.access_token.length > 0
      ) {
        return parsed.currentSession.access_token;
      }
    }
  } catch {
    // ignore JSON parsing failures
  }

  return null;
};

const readAccessTokenFromCookies = (): string | null => {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  const store = cookies();
  const authCookie = store
    .getAll()
    .find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (!authCookie) {
    return null;
  }

  return parseAccessToken(authCookie.value);
};

export const createServerSupabaseClient = (
  accessToken?: string | null
): SupabaseClient<Database, "public"> => {
  const token = accessToken ?? readAccessTokenFromCookies();

  return createClient<Database, "public">(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
};

export const getServerSupabaseSession = async () => {
  const client = createServerSupabaseClient();
  if (!env.isConfigured) {
    return { client, session: null } as const;
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to load Supabase session", error);
      }
      return { client, session: null } as const;
    }

    return { client, session: data.session } as const;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Supabase session request failed", error);
    }
    return { client, session: null } as const;
  }
};

export const isServerSupabaseConfigured = env.isConfigured;

export type ServerSupabaseClient = SupabaseClient<Database, "public">;
