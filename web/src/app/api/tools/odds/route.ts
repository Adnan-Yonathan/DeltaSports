import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

import { callOddsTool } from "@/lib/tools/sportsTools";

type Market = "moneyline" | "spread" | "total" | "player_prop";
const allowedMarkets = new Set<Market>(["moneyline", "spread", "total", "player_prop"]);

const parseQuery = (params: Record<string, string>) => {
  const trimmed = (value: string | undefined) => {
    if (!value) return undefined;
    const result = value.trim();
    return result.length > 0 ? result : undefined;
  };

  const marketRaw = trimmed(params.market)?.toLowerCase();
  const market = allowedMarkets.has(marketRaw as Market)
    ? (marketRaw as Market)
    : ("moneyline" as const);

  return {
    gameId: trimmed(params.gameId),
    home: trimmed(params.home),
    away: trimmed(params.away),
    market,
    sportsbook: trimmed(params.sportsbook),
  };
};

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseQuery(params);

  const { gameId, home, away, market, sportsbook } = parsed;
  const teams = home || away ? { home: home ?? "", away: away ?? "" } : undefined;
  const result = await callOddsTool({
    gameId,
    teams: teams && (teams.home || teams.away) ? teams : undefined,
    market,
    sportsbook,
  });

  if (!result.data) {
    return Response.json({ error: "No odds found" }, { status: 404 });
  }

  return Response.json({
    ok: result.ok,
    cacheHit: result.cacheHit,
    durationMs: result.durationMs,
    data: result.data,
  });
}
