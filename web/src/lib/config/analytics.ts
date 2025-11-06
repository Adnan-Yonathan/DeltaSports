/**
 * Centralized accessor for analytics-related environment variables. This helper
 * keeps secret management in one place so both API routes and background jobs
 * can share configuration without duplicating logic.
 */
type AnalyticsConfig = {
  posthogApiKey: string;
  posthogHost: string;
  openaiApiKey: string;
};

let cachedConfig: AnalyticsConfig | null = null;

const REQUIRED_VARS = ["POSTHOG_API_KEY", "POSTHOG_HOST", "OPENAI_API_KEY"] as const;

type RequiredEnvVar = (typeof REQUIRED_VARS)[number];

const loadEnvVar = (key: RequiredEnvVar) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required analytics environment variable: ${key}`);
  }
  return value;
};

/**
 * Returns the analytics configuration, validating that the underlying
 * environment variables are present. Rotate keys by updating the values in
 * `.env.local`, redeploying serverless environments, and confirming that this
 * helper no longer throws.
 */
export const getAnalyticsConfig = (): AnalyticsConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    posthogApiKey: loadEnvVar("POSTHOG_API_KEY"),
    posthogHost: loadEnvVar("POSTHOG_HOST"),
    openaiApiKey: loadEnvVar("OPENAI_API_KEY"),
  };

  return cachedConfig;
};
