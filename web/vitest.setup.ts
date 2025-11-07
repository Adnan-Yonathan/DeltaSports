process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";
process.env.OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "http://localhost";
process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
process.env.SPORTS_VENDOR = process.env.SPORTS_VENDOR ?? "mock";
process.env.SPORTS_API_BASE = process.env.SPORTS_API_BASE ?? "http://localhost";
process.env.SPORTS_API_KEY = process.env.SPORTS_API_KEY ?? "test";
process.env.FEATURE_FLAGS = process.env.FEATURE_FLAGS ?? "dashboard,llm_insights,line_movements";
process.env.CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS ?? "30";
