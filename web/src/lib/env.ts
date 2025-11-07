import { cleanEnv, str, url } from "envalid";

type EnvShape = {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_EMAILS: string;
  REDIRECT_AFTER_LOGIN: string;
  REDIRECT_AFTER_LOGOUT: string;
};

const rawEnv = cleanEnv<EnvShape>(
  process.env,
  {
    NEXT_PUBLIC_SITE_URL: url(),
    NEXT_PUBLIC_SUPABASE_URL: url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str(),
    SUPABASE_SERVICE_ROLE_KEY: str({ desc: "Server-only Supabase service role key" }),
    ADMIN_EMAILS: str({ default: "" }),
    REDIRECT_AFTER_LOGIN: str({ default: "/command-center" }),
    REDIRECT_AFTER_LOGOUT: str({ default: "/login" })
  },
  { strict: true }
);

export const publicEnv = {
  supabaseUrl: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  siteUrl: rawEnv.NEXT_PUBLIC_SITE_URL,
  redirectAfterLogin: rawEnv.REDIRECT_AFTER_LOGIN,
  redirectAfterLogout: rawEnv.REDIRECT_AFTER_LOGOUT
} as const;

export const getServerEnv = () => {
  if (typeof window !== "undefined") {
    throw new Error("Attempted to access server env on the client");
  }

  return {
    serviceRoleKey: rawEnv.SUPABASE_SERVICE_ROLE_KEY,
    adminEmails: rawEnv.ADMIN_EMAILS
  } as const;
};

export const adminEmailSet = new Set(
  rawEnv.ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export type PublicEnv = typeof publicEnv;
