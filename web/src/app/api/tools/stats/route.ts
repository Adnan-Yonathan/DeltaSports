import { NextRequest } from "next/server";

import { callStatsTool } from "@/lib/tools/sportsTools";

type ParsedQuery = {
  playerId?: string;
  playerName?: string;
  stat: string;
  lastNGames?: number;
  since?: string;
};

const parseQuery = (params: Record<string, string>): ParsedQuery | { error: string } => {
  const trimmed = (value: string | undefined) => {
    if (!value) return undefined;
    const result = value.trim();
    return result.length > 0 ? result : undefined;
  };

  const stat = trimmed(params.stat) ?? "points";
  const since = trimmed(params.since);
  const playerId = trimmed(params.playerId);
  const playerName = trimmed(params.playerName);

  let lastNGames: number | undefined;
  if (params.lastNGames !== undefined) {
    const parsed = Number(params.lastNGames);
    if (Number.isNaN(parsed)) {
      return { error: "lastNGames must be a number" };
    }
    lastNGames = parsed;
  }

  return { playerId, playerName, stat, lastNGames, since };
};

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseQuery(params);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { playerId, playerName, stat, lastNGames, since } = parsed;
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
