import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

const getEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials are missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured."
    );
  }

  return { supabaseUrl, supabaseAnonKey } as const;
};

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
  const store = cookies();
  const authCookie = store
    .getAll()
    .find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (!authCookie) {
    return null;
  }

  return parseAccessToken(authCookie.value);
};

export const createServerSupabaseClient = (accessToken?: string | null): SupabaseClient<Database> => {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const token = accessToken ?? readAccessTokenFromCookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  const { data, error } = await client.auth.getSession();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to load Supabase session", error);
    }
    return { client, session: null } as const;
  }

  return { client, session: data.session } as const;
};

export type ServerSupabaseClient = SupabaseClient<Database>;
