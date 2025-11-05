export type SSEEmitter = {
  send: (event: string, data: unknown) => void;
  close: () => void;
};

type SSEInit = {
  keepAliveMs?: number;
};

export function createSSEStream({ keepAliveMs = 15000 }: SSEInit = {}) {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const encoder = new TextEncoder();
  let keepAliveTimer: NodeJS.Timeout | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      controller.enqueue(encoder.encode(`event: ready\ndata: ok\n\n`));
      if (keepAliveMs > 0) {
        keepAliveTimer = setInterval(() => {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`));
        }, keepAliveMs);
      }
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  const emitter: SSEEmitter = {
    send(event, data) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${payload}\n\n`));
    },
    close() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      controller.close();
    },
  };

  return { stream, emitter };
}
