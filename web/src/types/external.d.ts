declare module "@posthog/ai" {
  type InstrumentedPostHog = unknown;

  export class OpenAI {
    constructor(config: { apiKey: string; posthog?: InstrumentedPostHog });
    responses: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
      stream?: (payload: Record<string, unknown>) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
    };
  }
}

declare module "posthog-node" {
  export type PostHogOptions = {
    host?: string;
  };

  export type CaptureOptions = {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  };

  export class PostHog {
    constructor(apiKey: string, options?: PostHogOptions);
    capture(message: CaptureOptions): void;
    shutdown(): Promise<void> | void;
  }
}
