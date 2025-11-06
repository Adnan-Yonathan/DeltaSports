import type { PostHog } from "posthog-node";

import { getAnalyticsConfig } from "@/lib/config/analytics";

export type InstrumentedOpenAI = {
  responses?: {
    create?: (input: Record<string, unknown>) => Promise<unknown>;
    stream?: (input: Record<string, unknown>) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
  };
};

export type InstrumentedClients = {
  openai: InstrumentedOpenAI | null;
  posthog: PostHog | null;
};

type InitializeOptions = {
  /** Enables verbose logging in development when instrumentation fails. */
  debug?: boolean;
};

const activeClients = new Set<PostHog>();
let shutdownHooksRegistered = false;

const registerProcessShutdown = () => {
  if (shutdownHooksRegistered || typeof process === "undefined") {
    return;
  }

  shutdownHooksRegistered = true;

  const flushClients = async () => {
    const clients = Array.from(activeClients.values());
    activeClients.clear();
    await Promise.allSettled(
      clients.map(async (client) => {
        try {
          await client.shutdown();
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("PostHog shutdown during process exit failed", error);
          }
        }
      })
    );
  };

  process.once("beforeExit", (_code) => {
    void flushClients();
  });

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.once(signal, () => {
      void flushClients();
    });
  });
};

const loadClients = async ({ debug = process.env.NODE_ENV === "development" }: InitializeOptions = {}): Promise<InstrumentedClients> => {
  try {
    const config = getAnalyticsConfig();

    const [{ PostHog }, { OpenAI }] = await Promise.all([
      import("posthog-node"),
      import("@posthog/ai"),
    ]);

    const posthog = new PostHog(config.posthogApiKey, {
      host: config.posthogHost,
    });

    activeClients.add(posthog);
    registerProcessShutdown();

    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
      posthog,
    }) as InstrumentedOpenAI;

    return { openai, posthog };
  } catch (error) {
    if (debug) {
      console.warn("Failed to initialize PostHog/OpenAI instrumentation", error);
    }
    return { openai: null, posthog: null };
  }
};

export const initializeInstrumentation = async (options?: InitializeOptions): Promise<InstrumentedClients> => {
  return loadClients(options);
};

export const captureServerEvent = (
  clients: InstrumentedClients,
  event: string,
  properties: Record<string, unknown>
) => {
  const { posthog } = clients;
  if (!posthog) {
    return;
  }

  const distinctId =
    typeof properties.distinctId === "string" && properties.distinctId.trim().length > 0
      ? (properties.distinctId as string)
      : typeof properties.sessionId === "string" && properties.sessionId.trim().length > 0
        ? (properties.sessionId as string)
        : "anonymous-server";

  posthog.capture({
    distinctId,
    event,
    properties,
  });
};

export const shutdownInstrumentation = async (clients: InstrumentedClients) => {
  const { posthog } = clients;
  if (!posthog) {
    return;
  }

  try {
    const maybePromise = posthog.shutdown();
    if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
      await maybePromise;
    }
    activeClients.delete(posthog);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PostHog shutdown encountered an error", error);
    }
  }
};
