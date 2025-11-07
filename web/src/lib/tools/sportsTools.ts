import { SimpleCache } from "@/lib/cache";
import { getServerEnv } from "@/lib/env";
import { createSportsProvider, type InjuryRequest, type InjuryResult, type OddsRequest, type OddsResult, type SportsProvider, type StatsRequest, type StatsResult } from "@/lib/providers/sports";
import { getLogger } from "@/lib/telemetry/logger";

const env = getServerEnv();
const cache = new SimpleCache<unknown>(env.cacheTtlSeconds * 1000);
const provider: SportsProvider = createSportsProvider();
const logger = getLogger();

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export type ToolResult<T> = {
  id: string;
  ok: boolean;
  data: T | null;
  source?: string;
  durationMs: number;
  cacheHit: boolean;
};

const execute = async <T>(name: string, cacheKey: string, fn: () => Promise<T | null>): Promise<ToolResult<T>> => {
  const start = Date.now();
  const cached = cache.get(cacheKey) as T | null;
  if (cached) {
    return {
      id: createId(),
      ok: true,
      data: cached,
      source: "cache",
      durationMs: Date.now() - start,
      cacheHit: true,
    };
  }

  try {
    const data = await fn();
    if (data) {
      cache.set(cacheKey, data);
    }
    const durationMs = Date.now() - start;
    logger.info({ tool: name, durationMs, vendor: provider.name }, "sports tool executed");
    return {
      id: createId(),
      ok: Boolean(data),
      data: data ?? null,
      durationMs,
      cacheHit: false,
    };
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.error({ err: error, tool: name, durationMs, vendor: provider.name }, "sports tool failed");
    return { id: createId(), ok: false, data: null, durationMs, cacheHit: false };
  }
};

export const callOddsTool = async (request: OddsRequest): Promise<ToolResult<OddsResult>> =>
  execute("getOdds", `odds:${JSON.stringify(request)}`, () => provider.getOdds(request));

export const callStatsTool = async (request: StatsRequest): Promise<ToolResult<StatsResult>> =>
  execute("getStats", `stats:${JSON.stringify(request)}`, () => provider.getStats(request));

export const callInjuriesTool = async (request: InjuryRequest): Promise<ToolResult<InjuryResult>> =>
  execute("getInjuries", `injuries:${JSON.stringify(request)}`, () => provider.getInjuries(request));

export type ToolExecutionTrace = {
  id: string;
  name: string;
  cacheHit: boolean;
  durationMs: number;
  ok: boolean;
  source?: string;
};

export const toTrace = <T>(name: string, result: ToolResult<T>): ToolExecutionTrace => ({
  id: result.id,
  name,
  cacheHit: result.cacheHit,
  durationMs: result.durationMs,
  ok: result.ok,
  source: result.source,
});

export type DeltaToolPayload =
  | { name: "getOdds"; args: OddsRequest; result: ToolResult<OddsResult> }
  | { name: "getStats"; args: StatsRequest; result: ToolResult<StatsResult> }
  | { name: "getInjuries"; args: InjuryRequest; result: ToolResult<InjuryResult> };
