import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireEnv } from "./env.ts";
import { Database } from "./types.ts";

type ServiceRoleClient = SupabaseClient<Database>;

export function createServiceRoleClient(): ServiceRoleClient {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "X-Client-Info": "edge-functions",
      },
    },
  });
}
