import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type {
  EdgeAlert,
  TablesInsert,
  TablesUpdate,
} from "../shared/types.ts";

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

type ExternalOddsFeed = {
  eventId: string;
  market: string;
  trueProbability?: number;
  consensusDecimalOdds?: number;
  books: Array<{
    sportsbook: string;
    decimalOdds: number;
    url?: string;
  }>;
};

type RefreshPayload = {
  markets?: ExternalOddsFeed[];
  tone?: "concise" | "engaging";
};

type EdgeCandidate = {
  market: string;
  sportsbook: string;
  decimalOdds: number;
  consensusDecimalOdds: number;
  trueProbability: number;
  edgeValue: number;
  url?: string;
};

const DEFAULT_THRESHOLD = Number(Deno.env.get("EV_MIN_THRESHOLD") ?? 0.02);
const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function loadExternalFeeds(urls: string[]): Promise<ExternalOddsFeed[]> {
  const results: ExternalOddsFeed[] = [];
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        console.error("ev-scanner-refresh: feed responded with status", url, response.status);
        continue;
      }
      const body = await response.json();
      if (Array.isArray(body)) {
        for (const item of body) {
          if (item && typeof item === "object" && Array.isArray(item.books)) {
            results.push(item as ExternalOddsFeed);
          }
        }
      }
    } catch (error) {
      console.error("ev-scanner-refresh: failed to fetch feed", url, error);
    }
  }
  return results;
}

function computeEdgeCandidates(markets: ExternalOddsFeed[], threshold: number): EdgeCandidate[] {
  const candidates: EdgeCandidate[] = [];
  for (const market of markets) {
    if (!market.books || market.books.length === 0) {
      continue;
    }
    const consensusDecimal = typeof market.consensusDecimalOdds === "number" && market.consensusDecimalOdds > 1
      ? market.consensusDecimalOdds
      : averageDecimalOdds(market.books.map((book) => book.decimalOdds));
    const trueProbability = typeof market.trueProbability === "number" && market.trueProbability > 0
      ? market.trueProbability
      : 1 / consensusDecimal;

    for (const book of market.books) {
      if (typeof book.decimalOdds !== "number" || book.decimalOdds <= 1) {
        continue;
      }
      const edgeValue = calculateExpectedValue(book.decimalOdds, trueProbability);
      if (edgeValue >= threshold) {
        candidates.push({
          market: market.market,
          sportsbook: book.sportsbook,
          decimalOdds: book.decimalOdds,
          consensusDecimalOdds: consensusDecimal,
          trueProbability,
          edgeValue,
          url: book.url,
        });
      }
    }
  }
  return candidates.sort((a, b) => b.edgeValue - a.edgeValue);
}

function averageDecimalOdds(odds: number[]): number {
  const valid = odds.filter((value) => typeof value === "number" && value > 1);
  if (valid.length === 0) {
    return 1;
  }
  const sum = valid.reduce((total, value) => total + value, 0);
  return sum / valid.length;
}

function calculateExpectedValue(decimalOdds: number, trueProbability: number): number {
  return decimalOdds * trueProbability - 1;
}

function buildAlertMessage(candidate: EdgeCandidate, tone: "concise" | "engaging"): string {
  const pctEdge = (candidate.edgeValue * 100).toFixed(1);
  const impliedProb = (1 / candidate.decimalOdds) * 100;
  if (tone === "engaging") {
    return `🔥 ${candidate.market}: ${candidate.sportsbook} is hanging ${candidate.decimalOdds.toFixed(2)} (${pctEdge}% edge vs market). Implied hit rate ${(impliedProb).toFixed(1)}%.`;
  }
  return `${candidate.market} @ ${candidate.sportsbook}: ${candidate.decimalOdds.toFixed(2)} (${pctEdge}% edge, implied ${impliedProb.toFixed(1)}%).`;
}

async function upsertEdgeAlert(
  supabase: SupabaseClient,
  candidate: EdgeCandidate,
  tone: "concise" | "engaging",
  threshold: number,
) {
  const message = buildAlertMessage(candidate, tone);

  const { data: existing, error: selectError } = await supabase
    .from("edge_alerts")
    .select("*")
    .eq("market", candidate.market)
    .eq("sportsbook", candidate.sportsbook)
    .eq("origin", "model")
    .eq("status", "active")
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    throw new Error(`Failed to lookup existing alert: ${selectError.message}`);
  }

  const existingAlert = existing as EdgeAlert | null;

  if (existingAlert) {
    const updatePayload: TablesUpdate<"edge_alerts"> = {
      edge_value: candidate.edgeValue,
      trigger_threshold: threshold,
      message,
      resolved_at: null,
    };
    const { data, error } = await supabase
      .from("edge_alerts")
      .update(updatePayload)
      .eq("id", existingAlert.id)
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to update edge alert ${existingAlert.id}: ${error.message}`);
    }
    return data as EdgeAlert;
  }

  const insertPayload: TablesInsert<"edge_alerts"> = {
    origin: "model",
    market: candidate.market,
    sportsbook: candidate.sportsbook,
    edge_value: candidate.edgeValue,
    trigger_threshold: threshold,
    message,
    status: "active",
    user_id: null,
    source_handle: null,
  };

  const { data, error } = await supabase
    .from("edge_alerts")
    .insert(insertPayload)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to insert edge alert: ${error.message}`);
  }
  return data as EdgeAlert;
}

async function recordRefreshEvent(
  supabase: SupabaseClient,
  alert: EdgeAlert,
  tone: "concise" | "engaging",
  candidate: EdgeCandidate,
) {
  const metadata = {
    tone,
    decimal_odds: candidate.decimalOdds,
    consensus_decimal_odds: candidate.consensusDecimalOdds,
    true_probability: candidate.trueProbability,
    edge_value: candidate.edgeValue,
  };
  const eventPayload: TablesInsert<"alert_events"> = {
    alert_id: alert.id,
    user_id: alert.user_id,
    action: "refreshed",
    metadata,
  };
  const { error } = await supabase
    .from("alert_events")
    .insert(eventPayload);
  if (error) {
    console.error("ev-scanner-refresh: failed to record refresh event", alert.id, error);
  }
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: RefreshPayload = {};
  try {
    if (req.headers.get("content-length") && Number(req.headers.get("content-length")) > 0) {
      payload = await req.json();
    }
  } catch (error) {
    console.error("ev-scanner-refresh: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  const tone = payload.tone ?? "concise";
  let markets = payload.markets ?? [];

  if (markets.length === 0) {
    const urls = (Deno.env.get("ODDS_FEED_URLS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (urls.length === 0) {
      return errorResponse("No markets provided and ODDS_FEED_URLS not configured", 400);
    }
    markets = await loadExternalFeeds(urls);
  }

  if (markets.length === 0) {
    return errorResponse("No odds data available", 422);
  }

  const threshold = Number.isFinite(DEFAULT_THRESHOLD) ? DEFAULT_THRESHOLD : 0.02;
  const candidates = computeEdgeCandidates(markets, threshold);

  if (candidates.length === 0) {
    return jsonResponse({ status: "ok", alerts: [], summary: "No edges above threshold" });
  }

  const supabase = createServiceRoleClient();
  const alerts: EdgeAlert[] = [];
  for (const candidate of candidates) {
    try {
      const alert = await upsertEdgeAlert(supabase, candidate, tone, threshold);
      alerts.push(alert);
      await recordRefreshEvent(supabase, alert, tone, candidate);
    } catch (error) {
      console.error("ev-scanner-refresh: failed to persist candidate", candidate.market, candidate.sportsbook, error);
    }
  }

  const summary = `${alerts.length} edge${alerts.length === 1 ? "" : "s"} refreshed above ${(threshold * 100).toFixed(1)}% EV.`;
  return jsonResponse({ status: "ok", alerts, summary });
};

if (import.meta.main) {
  serve(handler);
}
