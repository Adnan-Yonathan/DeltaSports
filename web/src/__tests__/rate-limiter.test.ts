import { describe, expect, it } from 'vitest';

import { clearRateLimiters, enforceRateLimit } from '@/lib/auth/rateLimiter';

describe('rateLimiter', () => {
  it('allows a limited number of attempts before throttling', () => {
    clearRateLimiters();

    for (let i = 0; i < 5; i += 1) {
      const result = enforceRateLimit('login:1.1.1.1');
      expect(result.allowed).toBe(true);
    }

    const blocked = enforceRateLimit('login:1.1.1.1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('returns exponential backoff intervals', () => {
    clearRateLimiters();
    const first = enforceRateLimit('signup:1.1.1.2');
    const second = enforceRateLimit('signup:1.1.1.2');
    const third = enforceRateLimit('signup:1.1.1.2');

    expect(first.backoff).toBe(0);
    expect(second.backoff).toBeGreaterThan(first.backoff);
    expect(third.backoff).toBeGreaterThanOrEqual(second.backoff);
  });
});
