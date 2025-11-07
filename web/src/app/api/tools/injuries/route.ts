import { NextRequest } from "next/server";
import { z } from "zod";

import { callInjuriesTool } from "@/lib/tools/sportsTools";

const querySchema = z.object({
  team: z.string().optional(),
  gameId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const result = await callInjuriesTool(parsed.data);
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
