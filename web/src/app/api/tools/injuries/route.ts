import { NextRequest } from "next/server";

import { callInjuriesTool } from "@/lib/tools/sportsTools";

const parseQuery = (params: Record<string, string>) => {
  const trimmed = (value: string | undefined) => {
    if (!value) return undefined;
    const result = value.trim();
    return result.length > 0 ? result : undefined;
  };

  return {
    team: trimmed(params.team),
    gameId: trimmed(params.gameId),
  };
};

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseQuery(params);

  const result = await callInjuriesTool(parsed);
  if (!result.data) {
    return Response.json({ error: "No injuries found" }, { status: 404 });
  }

  return Response.json({
    ok: result.ok,
    cacheHit: result.cacheHit,
    durationMs: result.durationMs,
    data: result.data,
  });
}
