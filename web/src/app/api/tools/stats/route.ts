import { NextRequest } from "next/server";
import { z } from "zod";

import { callStatsTool } from "@/lib/tools/sportsTools";

const querySchema = z.object({
  playerId: z.string().optional(),
  playerName: z.string().optional(),
  stat: z.string().default("points"),
  lastNGames: z.coerce.number().optional(),
  since: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const { playerId, playerName, stat, lastNGames, since } = parsed.data;
  const result = await callStatsTool({
    player: { id: playerId, name: playerName },
    stat,
    range: { lastNGames, since },
  });

  if (!result.data) {
    return Response.json({ error: "No stats found" }, { status: 404 });
  }

  return Response.json({
    ok: result.ok,
    cacheHit: result.cacheHit,
    durationMs: result.durationMs,
    data: result.data,
  });
}
