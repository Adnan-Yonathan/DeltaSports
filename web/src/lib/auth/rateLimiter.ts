const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 300;

type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
  backoff: number;
};

const attempts = new Map<string, number[]>();

const prune = (timestamps: number[], now: number, windowMs: number) =>
  timestamps.filter((timestamp) => now - timestamp < windowMs);

export const enforceRateLimit = (
  key: string,
  { windowMs = WINDOW_MS, maxAttempts = MAX_ATTEMPTS }: { windowMs?: number; maxAttempts?: number } = {}
): RateLimitResult => {
  const now = Date.now();
  const current = prune(attempts.get(key) ?? [], now, windowMs);

  const next = [...current, now];
  attempts.set(key, next);

  if (current.length >= maxAttempts) {
    const retryAfter = windowMs - (now - current[0]);
    return { allowed: false, retryAfter, backoff: BASE_BACKOFF_MS * 2 ** current.length };
  }

  const penalty = Math.max(0, next.length - 1);
  const backoff = penalty === 0 ? 0 : Math.min(BASE_BACKOFF_MS * 2 ** (penalty - 1), 8000);

  return { allowed: true, retryAfter: 0, backoff };
};

export const clearRateLimiters = () => {
  attempts.clear();
};
