import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type {
  BankrollAccount,
  Bet,
  EdgeAlert,
  UserProfile,
} from "../shared/database.types.ts";

type DigestTone = "concise" | "engaging" | "analytical";

type DigestPayload = {
  userProfileId: string;
  tone?: DigestTone;
};

type Highlight = {
  type: "bankroll" | "bet" | "alert";
  title: string;
  description: string;
};

type DigestResponse = {
  status: "ok";
  tone: DigestTone;
  summary: string;
  highlights: Highlight[];
  context: {
    profile: UserProfile | null;
    bankrolls: BankrollAccount[];
    recentBets: Bet[];
    activeAlerts: EdgeAlert[];
  };
};

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

async function fetchProfile(supabase: SupabaseClient, userProfileId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userProfileId)
    .single();
  if (error) {
    console.error("chat-digest: failed to load profile", userProfileId, error);
  }
  return (data ?? null) as UserProfile | null;
}

async function fetchBankrolls(supabase: SupabaseClient, userProfileId: string) {
  const { data, error } = await supabase
    .from("bankroll_accounts")
    .select("*")
    .eq("user_id", userProfileId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load bankroll accounts: ${error.message}`);
  }
  return (data ?? []) as BankrollAccount[];
}

async function fetchRecentBets(supabase: SupabaseClient, userProfileId: string) {
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", userProfileId)
    .order("placed_at", { ascending: false })
    .limit(5);
  if (error) {
    throw new Error(`Failed to load bets: ${error.message}`);
  }
  return (data ?? []) as Bet[];
}

async function fetchActiveAlerts(supabase: SupabaseClient, userProfileId: string) {
  const { data, error } = await supabase
    .from("edge_alerts")
    .select("*")
    .or(`user_id.eq.${userProfileId},user_id.is.null`)
    .eq("status", "active")
    .order("triggered_at", { ascending: false })
    .limit(5);
  if (error) {
    throw new Error(`Failed to load edge alerts: ${error.message}`);
  }
  return (data ?? []) as EdgeAlert[];
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function buildHighlights(
  bankrolls: BankrollAccount[],
  bets: Bet[],
  alerts: EdgeAlert[],
): Highlight[] {
  const highlights: Highlight[] = [];

  if (bankrolls.length > 0) {
    const totalStarting = sum(bankrolls.map((account) => toNumber(account.starting_balance)));
    const totalCurrent = sum(bankrolls.map((account) => toNumber(account.current_balance)));
    const profit = totalCurrent - totalStarting;
    highlights.push({
      type: "bankroll",
      title: "Bankroll snapshot",
      description: `Total balance ${totalCurrent.toFixed(2)} (${profit >= 0 ? "+" : ""}${profit.toFixed(2)} vs. start).`,
    });
  }

  if (bets.length > 0) {
    const latest = bets[0];
    highlights.push({
      type: "bet",
      title: "Latest bet",
      description: `${latest.event_name} – ${latest.market} (${latest.status}). Stake ${toNumber(latest.wager_amount).toFixed(2)}.`,
    });
  }

  if (alerts.length > 0) {
    const topEdge = alerts.reduce((best, alert) => (alert.edge_value > best.edge_value ? alert : best), alerts[0]);
    highlights.push({
      type: "alert",
      title: "Top edge on deck",
      description: `${topEdge.market} at ${topEdge.sportsbook ?? "multiple books"} offers ${(topEdge.edge_value * 100).toFixed(1)}% EV.`,
    });
  }

  return highlights;
}

function formatSummary(
  tone: DigestTone,
  profile: UserProfile | null,
  bankrolls: BankrollAccount[],
  bets: Bet[],
  alerts: EdgeAlert[],
): string {
  const timezone = profile?.preferred_timezone ?? "UTC";
  const totalCurrent = sum(bankrolls.map((account) => toNumber(account.current_balance)));
  const totalStarting = sum(bankrolls.map((account) => toNumber(account.starting_balance)));
  const profit = totalCurrent - totalStarting;
  const activeCount = alerts.length;

  const bankrollSnippet = bankrolls.length === 0
    ? "No bankrolls on file yet."
    : `Bankroll ${totalCurrent.toFixed(2)} (${profit >= 0 ? "+" : ""}${profit.toFixed(2)} vs. start).`;

  const betSnippet = bets.length === 0
    ? "No recent bets."
    : `${bets.length} recent bet${bets.length === 1 ? "" : "s"}; latest ${bets[0].status} on ${bets[0].event_name}.`;

  const alertSnippet = activeCount === 0
    ? "No live edges right now."
    : `${activeCount} live edge${activeCount === 1 ? "" : "s"} queued.`;

  switch (tone) {
    case "engaging":
      return `Good day${profile?.favorite_sports?.length ? `, ${profile.favorite_sports[0]} fan` : ""}! In ${timezone} time you're sitting on ${bankrollSnippet} ${betSnippet} ${alertSnippet}`;
    case "analytical":
      return `Digest @ ${timezone}: ${bankrollSnippet} ${betSnippet} ${alertSnippet}`;
    default:
      return `${bankrollSnippet} ${betSnippet} ${alertSnippet}`.trim();
  }
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: DigestPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("chat-digest: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.userProfileId) {
    return errorResponse("userProfileId is required", 400);
  }

  const tone: DigestTone = payload.tone ?? "concise";
  const supabase = createServiceRoleClient();

  try {
    const [profile, bankrolls, bets, alerts] = await Promise.all([
      fetchProfile(supabase, payload.userProfileId),
      fetchBankrolls(supabase, payload.userProfileId),
      fetchRecentBets(supabase, payload.userProfileId),
      fetchActiveAlerts(supabase, payload.userProfileId),
    ]);

    const highlights = buildHighlights(bankrolls, bets, alerts);
    const summary = formatSummary(tone, profile, bankrolls, bets, alerts);

    const response: DigestResponse = {
      status: "ok",
      tone,
      summary,
      highlights,
      context: {
        profile,
        bankrolls,
        recentBets: bets,
        activeAlerts: alerts,
      },
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("chat-digest: failed to build digest", payload.userProfileId, error);
    return errorResponse(
      "Failed to generate chat digest",
      500,
      error instanceof Error ? error.message : error,
    );
  }
};

if (import.meta.main) {
  serve(handler);
}
