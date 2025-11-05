export interface SseController {
  send: (event: string, data?: string | object) => void;
  close: () => void;
}

export function createSseResponse(
  writer: (controller: SseController) => Promise<void> | void,
): Response {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let keepAlive: ReturnType<typeof setInterval> | undefined;

      const send: SseController["send"] = (event, data) => {
        const payload =
          typeof data === "string" ? data : JSON.stringify(data ?? {});
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${payload}\n\n`),
        );
      };

      const close = () => {
        if (keepAlive) clearInterval(keepAlive);
        controller.close();
      };

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`event: keepalive\n\n`));
      }, 30000);

      Promise.resolve(writer({ send, close })).catch((error) => {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: String(error) })}\n\n`,
          ),
        );
        close();
      });
    },
    cancel() {
      // nothing yet
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-store",
    },
  });
}
