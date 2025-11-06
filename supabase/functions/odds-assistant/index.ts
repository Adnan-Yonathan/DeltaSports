import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { requireEnv } from "../shared/env.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type { BankrollAccount, Bet, UserProfile } from "../shared/types.ts";

type OddsAssistantPayload = {
  query: string;
  sportKey: string;
  regions?: string;
  markets?: string;
  bookmakers?: string;
  oddsFormat?: "american" | "decimal" | "fractional";
  model?: string;
  userProfileId?: string;
};

type NormalizedOutcome = {
  name: string;
  price: number | null;
  point: number | null;
};

type NormalizedMarket = {
  key: string;
  lastUpdate: string | null;
  outcomes: NormalizedOutcome[];
};

type NormalizedBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  markets: NormalizedMarket[];
};

type NormalizedEventOdds = {
  id: string;
  sportKey: string;
  sportTitle: string | null;
  commenceTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  bookmakers: NormalizedBookmaker[];
};

type OddsSnapshot = {
  sportKey: string;
  fetchedAt: string;
  filters: {
    regions: string;
    markets: string;
    bookmakers?: string;
    oddsFormat: string;
  };
  events: NormalizedEventOdds[];
  warnings?: string[];
};

type BettorContext = {
  profile: UserProfile | null;
  bankrolls: BankrollAccount[];
  recentBets: Bet[];
};

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchProfile(supabase: SupabaseClient, userProfileId: string) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userProfileId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("odds-assistant: failed to load profile", userProfileId, error);
      return null;
    }

    return (data ?? null) as UserProfile | null;
  } catch (error) {
    console.error("odds-assistant: error while loading profile", userProfileId, error);
    return null;
  }
}

async function fetchBankrolls(supabase: SupabaseClient, userProfileId: string) {
  try {
    const { data, error } = await supabase
      .from("bankroll_accounts")
      .select("*")
      .eq("user_id", userProfileId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("odds-assistant: failed to load bankrolls", userProfileId, error);
      return [] as BankrollAccount[];
    }

    return (data ?? []) as BankrollAccount[];
  } catch (error) {
    console.error("odds-assistant: error while loading bankrolls", userProfileId, error);
    return [] as BankrollAccount[];
  }
}

async function fetchRecentBets(supabase: SupabaseClient, userProfileId: string) {
  try {
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userProfileId)
      .order("placed_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("odds-assistant: failed to load recent bets", userProfileId, error);
      return [] as Bet[];
    }

    return (data ?? []) as Bet[];
  } catch (error) {
    console.error("odds-assistant: error while loading recent bets", userProfileId, error);
    return [] as Bet[];
  }
}

async function loadBettorContext(supabase: SupabaseClient, userProfileId: string): Promise<BettorContext> {
  const [profile, bankrolls, recentBets] = await Promise.all([
    fetchProfile(supabase, userProfileId),
    fetchBankrolls(supabase, userProfileId),
    fetchRecentBets(supabase, userProfileId),
  ]);

  return { profile, bankrolls, recentBets };
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNumberValue(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeOddsData(raw: unknown): NormalizedEventOdds[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const events: NormalizedEventOdds[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const bookmakersRaw = Array.isArray(record.bookmakers) ? record.bookmakers : [];
    const bookmakers: NormalizedBookmaker[] = [];

    for (const bookmakerEntry of bookmakersRaw) {
      if (!bookmakerEntry || typeof bookmakerEntry !== "object") {
        continue;
      }

      const bookmakerRecord = bookmakerEntry as Record<string, unknown>;
      const marketsRaw = Array.isArray(bookmakerRecord.markets) ? bookmakerRecord.markets : [];
      const markets: NormalizedMarket[] = [];

      for (const marketEntry of marketsRaw) {
        if (!marketEntry || typeof marketEntry !== "object") {
          continue;
        }
        const marketRecord = marketEntry as Record<string, unknown>;
        const outcomesRaw = Array.isArray(marketRecord.outcomes) ? marketRecord.outcomes : [];
        const outcomes: NormalizedOutcome[] = [];

        for (const outcomeEntry of outcomesRaw) {
          if (!outcomeEntry || typeof outcomeEntry !== "object") {
            continue;
          }
          const outcomeRecord = outcomeEntry as Record<string, unknown>;
          outcomes.push({
            name: toStringValue(outcomeRecord.name) ?? "",
            price: toNumberValue(outcomeRecord.price),
            point: toNumberValue(outcomeRecord.point),
          });
        }

        markets.push({
          key: toStringValue(marketRecord.key) ?? "",
          lastUpdate: toStringValue(marketRecord.last_update),
          outcomes,
        });
      }

      bookmakers.push({
        key: toStringValue(bookmakerRecord.key) ?? "",
        title: toStringValue(bookmakerRecord.title) ?? toStringValue(bookmakerRecord.key) ?? "",
        lastUpdate: toStringValue(bookmakerRecord.last_update),
        markets,
      });
    }

    events.push({
      id: toStringValue(record.id) ?? "",
      sportKey: toStringValue(record.sport_key) ?? "",
      sportTitle: toStringValue(record.sport_title),
      commenceTime: toStringValue(record.commence_time),
      homeTeam: toStringValue(record.home_team),
      awayTeam: toStringValue(record.away_team),
      bookmakers,
    });
  }

  return events;
}

async function fetchOddsSnapshot(options: {
  apiKey: string;
  sportKey: string;
  regions?: string;
  markets?: string;
  bookmakers?: string;
  oddsFormat?: string;
}): Promise<OddsSnapshot> {
  const regions = options.regions?.trim() || "us";
  const markets = options.markets?.trim() || "h2h";
  const oddsFormat = options.oddsFormat?.trim() || "american";
  const warnings: string[] = [];

  const url = new URL(`${ODDS_API_BASE_URL}/sports/${options.sportKey}/odds`);
  url.searchParams.set("apiKey", options.apiKey);
  url.searchParams.set("regions", regions);
  url.searchParams.set("markets", markets);
  url.searchParams.set("oddsFormat", oddsFormat);
  if (options.bookmakers) {
    url.searchParams.set("bookmakers", options.bookmakers);
  }

  let response: Response | null = null;
  try {
    response = await fetchWithTimeout(url.toString());
  } catch (error) {
    console.error("odds-assistant: request to The Odds API timed out", options.sportKey, error);
    warnings.push("Failed to fetch odds before timeout");
  }

  let events: NormalizedEventOdds[] = [];
  if (response) {
    if (!response.ok) {
      const body = await response.text();
      console.error("odds-assistant: The Odds API responded with status", response.status, body);
      warnings.push(`The Odds API responded with status ${response.status}`);
    } else {
      try {
        const data = await response.json();
        events = normalizeOddsData(data);
      } catch (error) {
        console.error("odds-assistant: failed to parse The Odds API payload", error);
        warnings.push("Unable to parse odds payload");
      }
    }
  }

  return {
    sportKey: options.sportKey,
    fetchedAt: new Date().toISOString(),
    filters: {
      regions,
      markets,
      bookmakers: options.bookmakers,
      oddsFormat,
    },
    events,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function generateModelSummary(params: {
  apiKey: string;
  query: string;
  oddsSnapshot: OddsSnapshot;
  bettorContext: BettorContext | null;
  model?: string;
}): Promise<string> {
  const systemPrompt = "You are DeltaSports' odds assistant. Use the provided betting context and odds snapshot to give actionable, responsible guidance. Highlight any value, but avoid guaranteeing outcomes.";

  const contextPayload: Record<string, unknown> = {
    odds_snapshot: params.oddsSnapshot,
  };
  if (params.bettorContext) {
    contextPayload.bettor_context = params.bettorContext;
  }

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Context:\n${JSON.stringify(contextPayload, null, 2)}\n\nUser query:\n${params.query}`,
    },
  ];

  const body = {
    model: params.model ?? "gpt-4o-mini",
    messages,
    temperature: 0.3,
  };

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("odds-assistant: failed to reach OpenAI", error);
    throw new Error("Failed to reach OpenAI");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("odds-assistant: OpenAI responded with status", response.status, errorBody);
    throw new Error(`OpenAI responded with status ${response.status}`);
  }

  let data: OpenAIResponse;
  try {
    data = (await response.json()) as OpenAIResponse;
  } catch (error) {
    console.error("odds-assistant: failed to parse OpenAI response", error);
    throw new Error("Unable to parse OpenAI response");
  }

  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    console.error("odds-assistant: OpenAI response missing message content", data);
    throw new Error("OpenAI response missing message content");
  }

  return summary;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: OddsAssistantPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("odds-assistant: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (typeof payload.query !== "string" || payload.query.trim().length === 0) {
    return errorResponse("query is required", 400);
  }

  if (typeof payload.sportKey !== "string" || payload.sportKey.trim().length === 0) {
    return errorResponse("sportKey is required", 400);
  }

  try {
    requireEnv("SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    console.error("odds-assistant: missing Supabase configuration", error);
    return errorResponse("Supabase configuration is missing", 500, error instanceof Error ? error.message : error);
  }

  let oddsApiKey: string;
  let openaiApiKey: string;
  try {
    oddsApiKey = requireEnv("ODDS_API_KEY");
    openaiApiKey = requireEnv("OPENAI_API_KEY");
  } catch (error) {
    console.error("odds-assistant: missing API configuration", error);
    return errorResponse("Required API keys are missing", 500, error instanceof Error ? error.message : error);
  }

  const supabase = createServiceRoleClient();

  let bettorContext: BettorContext | null = null;
  if (payload.userProfileId) {
    bettorContext = await loadBettorContext(supabase, payload.userProfileId);
  }

  const oddsSnapshot = await fetchOddsSnapshot({
    apiKey: oddsApiKey,
    sportKey: payload.sportKey,
    regions: payload.regions,
    markets: payload.markets,
    bookmakers: payload.bookmakers,
    oddsFormat: payload.oddsFormat,
  });

  let modelSummary: string;
  try {
    modelSummary = await generateModelSummary({
      apiKey: openaiApiKey,
      query: payload.query,
      oddsSnapshot,
      bettorContext,
      model: payload.model,
    });
  } catch (error) {
    console.error("odds-assistant: failed to generate model summary", error);
    return errorResponse("Failed to generate model summary", 502, error instanceof Error ? error.message : error);
  }

  return jsonResponse({
    status: "ok",
    odds_snapshot: oddsSnapshot,
    model_summary: modelSummary,
  });
};

if (import.meta.main) {
  serve(handler);
}
