const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;
const SSN_REGEX = /(?<!\d)\d{3}[-\s]?\d{2}[-\s]?\d{4}(?!\d)/g;
const CREDIT_CARD_REGEX = /(?<!\d)(?:\d[ -]?){13,16}(?!\d)/g;

const PII_PATTERNS = [
  { regex: EMAIL_REGEX, label: "email address" },
  { regex: PHONE_REGEX, label: "phone number" },
  { regex: SSN_REGEX, label: "government identifier" },
  { regex: CREDIT_CARD_REGEX, label: "payment number" },
] as const;

const GUARANTEE_KEYWORDS = [
  "guarantee",
  "guaranteed",
  "sure thing",
  "lock of the day",
  "can't lose",
  "risk free win",
  "risk-free win",
  "riskfree win",
  "mortgage payment",
  "bet the house",
];

export type PromptGuardrailOutcome = {
  sanitizedPrompt: string;
  redactions: readonly string[];
  blocked?: {
    reason: string;
    message: string;
    code: "guarantee" | "empty";
  };
};

export const applyPromptGuardrails = (prompt: string): PromptGuardrailOutcome => {
  let sanitizedPrompt = prompt;
  const redactions: string[] = [];

  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(sanitizedPrompt)) {
      sanitizedPrompt = sanitizedPrompt.replace(pattern.regex, "[redacted]");
      redactions.push(pattern.label);
    }
    pattern.regex.lastIndex = 0;
  }

  const normalizedPrompt = prompt.toLowerCase();
  const guaranteeMatch = GUARANTEE_KEYWORDS.find((keyword) => normalizedPrompt.includes(keyword));
  if (guaranteeMatch) {
    return {
      sanitizedPrompt,
      redactions,
      blocked: {
        reason: "guarantee_request",
        message:
          "We can highlight trends and odds, but we can't provide guaranteed wins or risk-free betting advice.",
        code: "guarantee",
      },
    };
  }

  if (!sanitizedPrompt.trim().length) {
    return {
      sanitizedPrompt,
      redactions,
      blocked: {
        reason: "empty_prompt",
        message: "Please include a bit more context so we can research the market.",
        code: "empty",
      },
    };
  }

  return { sanitizedPrompt, redactions };
};

const REQUEST_WINDOW_MS = 30_000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestBuckets = new Map<string, number[]>();

export type ThrottleResult =
  | { allowed: true; count: number }
  | { allowed: false; retryAfterMs: number };

export const registerRequest = (key: string, now = Date.now()): ThrottleResult => {
  const timestamps = requestBuckets.get(key) ?? [];
  const filtered = timestamps.filter((timestamp) => now - timestamp < REQUEST_WINDOW_MS);
  filtered.push(now);
  requestBuckets.set(key, filtered);

  if (filtered.length > MAX_REQUESTS_PER_WINDOW) {
    const earliest = filtered[0];
    const retryAfterMs = Math.max(REQUEST_WINDOW_MS - (now - earliest), 0);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, count: filtered.length };
};

export const resolveThrottleKey = (
  sessionId?: string | null,
  distinctId?: string | null,
  fallback?: string | null
) => {
  if (typeof sessionId === "string" && sessionId.trim().length > 0) {
    return `session:${sessionId.trim()}`;
  }
  if (typeof distinctId === "string" && distinctId.trim().length > 0) {
    return `user:${distinctId.trim()}`;
  }
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return `ip:${fallback.trim()}`;
  }
  return "anonymous";
};
