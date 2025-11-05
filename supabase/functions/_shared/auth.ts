import { createServiceRoleClient } from "./client.ts";
import { requireEnv } from "./env.ts";
import type { User } from "https://esm.sh/@supabase/supabase-js@2";

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function extractToken(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }
  const value = headerValue.trim();
  if (value.length === 0) {
    return null;
  }
  const lower = value.toLowerCase();
  if (lower.startsWith("bearer ")) {
    return value.slice(7).trim();
  }
  return value;
}

export function requireSecret(
  req: Request,
  envVar: string,
  options: {
    headerNames?: string[];
  } = {},
): void {
  const expected = requireEnv(envVar);
  const headerNames = options.headerNames ?? ["authorization", "x-edge-secret"];

  for (const headerName of headerNames) {
    const token = extractToken(req.headers.get(headerName));
    if (token && token === expected) {
      return;
    }
  }

  throw new UnauthorizedError();
}

function getAccessToken(req: Request): string | null {
  const headerNames = ["authorization", "x-supabase-auth"];
  for (const headerName of headerNames) {
    const token = extractToken(req.headers.get(headerName));
    if (token) {
      return token;
    }
  }
  return null;
}

export async function requireUser(req: Request): Promise<User> {
  const accessToken = getAccessToken(req);
  if (!accessToken) {
    throw new UnauthorizedError("Missing access token");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw new UnauthorizedError("Invalid access token");
  }

  return data.user;
}
