import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const createStubClient = (): SupabaseClient => {
  const stub = {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signInWithOtp() {
        return { data: null, error: new Error("Supabase not configured") };
      },
      async signOut() {
        return { error: null };
      },
      async exchangeCodeForSession() {
        return { data: null, error: new Error("Supabase not configured") };
      },
      onAuthStateChange(_callback: () => void) {
        return {
          data: {
            subscription: {
              unsubscribe() {
                // noop
              },
            },
          },
          error: null,
        } as const;
      },
    },
  } as const;

  return stub as unknown as SupabaseClient;
};

export const getSupabaseClient = () => {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase credentials missing; using in-memory stub client.");
    }
    client = createStubClient();
    return client;
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "deltasports.auth"
    }
  });

  return client;
};
