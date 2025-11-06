"use client";

const STORAGE_KEY = "deltasports:analytics:distinct-id";

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify?: (distinctId: string) => void;
      register?: (properties: Record<string, unknown>) => void;
    };
  }
}

let distinctId: string | null = null;
let attemptedIdentify = false;
let warnedMissingClient = false;

const getWindow = () => (typeof window !== "undefined" ? window : undefined);

const generateDistinctId = () => {
  const win = getWindow();
  if (!win) {
    return null;
  }

  if (win.crypto?.randomUUID) {
    return win.crypto.randomUUID();
  }

  // Fallback for environments without `crypto.randomUUID` support.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getDistinctId = () => {
  if (distinctId) {
    return distinctId;
  }

  const win = getWindow();
  if (!win) {
    return null;
  }

  try {
    const cached = win.localStorage.getItem(STORAGE_KEY);
    if (cached) {
      distinctId = cached;
      return distinctId;
    }

    const freshId = generateDistinctId();
    if (!freshId) {
      return null;
    }

    win.localStorage.setItem(STORAGE_KEY, freshId);
    distinctId = freshId;
    return distinctId;
  } catch (error) {
    if (process.env.NODE_ENV === "development" && !warnedMissingClient) {
      console.warn("Unable to persist PostHog distinct ID", error);
      warnedMissingClient = true;
    }
    return null;
  }
};

const identifyIfPossible = () => {
  if (attemptedIdentify) {
    return;
  }

  const win = getWindow();
  const client = win?.posthog;
  if (!client) {
    return;
  }

  const id = getDistinctId();
  if (id && typeof client.identify === "function") {
    client.identify(id);
  }

  attemptedIdentify = true;
};

export const captureClientEvent = (
  event: string,
  properties?: Record<string, unknown>
) => {
  const win = getWindow();
  const client = win?.posthog;

  const id = getDistinctId();
  const payload = {
    ...properties,
    distinctId: id ?? undefined
  };

  if (client?.capture) {
    identifyIfPossible();
    client.capture(event, payload);
    return;
  }

  if (process.env.NODE_ENV === "development") {
    if (!warnedMissingClient) {
      console.info("PostHog client not initialized; events are logged to console only.");
      warnedMissingClient = true;
    }
    console.info(`[analytics] ${event}`, payload);
  }
};

export const ensurePosthogClient = () => {
  identifyIfPossible();
  return typeof window !== "undefined" ? window.posthog ?? null : null;
};
