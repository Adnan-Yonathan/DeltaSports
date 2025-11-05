import crypto from "crypto";
import { NextRequest } from "next/server";
import { impliedProbability } from "@/lib/odds/convert";

const memoryCache = new Map<string, { etag: string; expiresAt: number; payload: any }>();

function getCacheTtl() {
  const ttl = Number(process.env.DELTA_CACHE_TTL ?? "30");
  return Number.isFinite(ttl) ? ttl : 30;
}

function buildCacheKey(url: URL) {
  return [
    url.searchParams.get("q") ?? "",
    url.searchParams.get("league") ?? "",
    url.searchParams.get("market") ?? "",
    url.searchParams.get("team") ?? "",
    url.searchParams.get("player") ?? "",
  ].join(":");
}

function offlinePayload(params: URLSearchParams) {
  const fetchedAt = new Date().toISOString();
  const oddsAmerican = -110;
  const oddsDecimal = 1.91;
  return {
    cache: { hit: false, ttl: 0 },
    data: {
      source: "mock-offline",
      fetchedAt,
      league: params.get("league") ?? undefined,
      teams: params.get("team") ? [params.get("team")!] : undefined,
      players: params.get("player") ? [params.get("player")!] : undefined,
      markets: params.get("market")
        ? [
            {
              market: params.get("market")!,
              sportsbook: params.get("sportsbook") ?? "MockBook",
              label: "Offline mock odds",
              odds: {
                american: oddsAmerican,
                decimal: oddsDecimal,
                fractional: "10/11",
                impliedProb: Number(impliedProbability(oddsDecimal, "decimal").toFixed(4)),
              },
            },
          ]
        : undefined,
      meta: {
        query: params.get("q"),
        offline: true,
      },
    },
  };
}

async function fetchProvider(_: URL, params: URLSearchParams) {
  if (!process.env.SPORTS_API_KEY) {
    return offlinePayload(params);
  }
  // TODO: integrate real provider requests
  return {
    cache: { hit: false, ttl: getCacheTtl() },
    data: {
      source: "unconfigured-provider",
      fetchedAt: new Date().toISOString(),
      meta: {
        note: "Sports provider integration pending configuration.",
        query: params.get("q"),
      },
    },
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const cacheKey = buildCacheKey(url);
  const ttl = getCacheTtl();
  const now = Date.now();

  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    if (req.headers.get("if-none-match") === cached.etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: cached.etag,
          "Cache-Control": `public, max-age=${ttl}`,
        },
      });
    }
    return new Response(JSON.stringify({ ...cached.payload, cache: { hit: true, ttl } }), {
      headers: {
        "Content-Type": "application/json",
        ETag: cached.etag,
        "Cache-Control": `public, max-age=${ttl}`,
      },
    });
  }

  const payload = process.env.DELTA_OFFLINE === "1" ? offlinePayload(params) : await fetchProvider(url, params);
  const body = JSON.stringify(payload);
  const etag = `W/"${crypto.createHash("sha1").update(body).digest("base64")}"`;
  memoryCache.set(cacheKey, {
    payload,
    etag,
    expiresAt: now + ttl * 1000,
  });

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": `public, max-age=${ttl}`,
      },
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": `public, max-age=${ttl}`,
    },
  });
}
