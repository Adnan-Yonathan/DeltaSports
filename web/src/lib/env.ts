import { cleanEnv, num, str } from "envalid";

type ServerEnv = {
  sportsVendor: string;
  sportsApiBase: string;
  sportsApiKey: string;
  openAiApiKey: string;
  openAiBaseUrl: string;
  openAiModel: string;
  featureFlags: ReadonlySet<string>;
  cacheTtlSeconds: number;
};

let cachedEnv: ServerEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env = cleanEnv(process.env, {
    SPORTS_VENDOR: str({ default: "mock" }),
    SPORTS_API_BASE: str({ default: "https://api.example.com" }),
    SPORTS_API_KEY: str({ default: "" }),
    OPENAI_API_KEY: str(),
    OPENAI_BASE_URL: str({ default: "https://api.openai.com/v1" }),
    OPENAI_MODEL: str({ default: "gpt-4o-mini" }),
    FEATURE_FLAGS: str({ default: "" }),
    CACHE_TTL_SECONDS: num({ default: 30 }),
  });

  cachedEnv = {
    sportsVendor: env.SPORTS_VENDOR,
    sportsApiBase: env.SPORTS_API_BASE,
    sportsApiKey: env.SPORTS_API_KEY,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiBaseUrl: env.OPENAI_BASE_URL,
    openAiModel: env.OPENAI_MODEL,
    featureFlags: new Set(
      env.FEATURE_FLAGS
        .split(",")
        .map((flag) => flag.trim())
        .filter(Boolean)
    ),
    cacheTtlSeconds: env.CACHE_TTL_SECONDS,
  } as const;

  return cachedEnv;
};

export const hasFeature = (flag: string): boolean => getServerEnv().featureFlags.has(flag);
