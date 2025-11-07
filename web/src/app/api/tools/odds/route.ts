import { NextRequest } from "next/server";
import { z } from "zod";

import { callOddsTool } from "@/lib/tools/sportsTools";

const querySchema = z.object({
  gameId: z.string().optional(),
  home: z.string().optional(),
  away: z.string().optional(),
  market: z.enum(["moneyline", "spread", "total", "player_prop"]).default("moneyline"),
  sportsbook: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const { gameId, home, away, market, sportsbook } = parsed.data;
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
