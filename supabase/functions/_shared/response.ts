interface JsonResponseInit extends ResponseInit {
  headers?: HeadersInit;
}

export function jsonResponse<T>(body: T, init: JsonResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-headers", "authorization, content-type");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function emptyResponse(status = 204): Response {
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  });
  return new Response(null, { status, headers });
}

export function errorResponse(message: string, status = 400, details?: unknown): Response {
  return jsonResponse({
    status: "error",
    message,
    details,
  }, { status });
}
