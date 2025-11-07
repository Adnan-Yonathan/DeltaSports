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

  const {
    SPORTS_VENDOR,
    SPORTS_API_BASE,
    SPORTS_API_KEY,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
    FEATURE_FLAGS,
    CACHE_TTL_SECONDS,
  } = process.env;

  const openAiKey = OPENAI_API_KEY && OPENAI_API_KEY.trim().length > 0 ? OPENAI_API_KEY.trim() : null;
  if (!openAiKey && process.env.NODE_ENV !== "production") {
    console.warn("OPENAI_API_KEY not set; using placeholder key for local operations.");
  }

  const resolvedOpenAiKey = openAiKey ?? (process.env.NODE_ENV === "production" ? "" : "test-key");

  const cacheTtl = (() => {
    const parsed = Number(CACHE_TTL_SECONDS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  })();

  const featureFlags = new Set(
    (FEATURE_FLAGS ?? "")
      .split(",")
      .map((flag) => flag.trim())
      .filter((flag) => flag.length > 0)
  );

  cachedEnv = {
    sportsVendor: (SPORTS_VENDOR && SPORTS_VENDOR.trim()) || "mock",
    sportsApiBase: (SPORTS_API_BASE && SPORTS_API_BASE.trim()) || "https://api.example.com",
    sportsApiKey: SPORTS_API_KEY ?? "",
    openAiApiKey: resolvedOpenAiKey,
    openAiBaseUrl: (OPENAI_BASE_URL && OPENAI_BASE_URL.trim()) || "https://api.openai.com/v1",
    openAiModel: (OPENAI_MODEL && OPENAI_MODEL.trim()) || "gpt-4o-mini",
    featureFlags,
    cacheTtlSeconds: cacheTtl,
  } as const;

  return cachedEnv;
};

export const hasFeature = (flag: string): boolean => getServerEnv().featureFlags.has(flag);
