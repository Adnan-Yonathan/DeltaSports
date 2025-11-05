import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type { Database } from "../shared/types.ts";

const DAYS_30 = 30;

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;
type BetRecord = Database["public"]["Tables"]["bets"]["Row"];
type BankrollAccount = Database["public"]["Tables"]["bankroll_accounts"]["Row"];
type BetTag = Database["public"]["Tables"]["bet_tags"]["Row"];

type SupabasePayload = {
  type?: string;
  table?: string;
  record?: Partial<BetRecord> | null;
  old_record?: Partial<BetRecord> | null;
};

type MetricsSummary = {
  totalBets: number;
  activeBets: number;
  settledBets: number;
  winRate: number;
  roi30d: number;
  bankrolls: Array<{
    id: string;
    label: string;
    currency: string;
    startingBalance: number;
    currentBalance: number;
    profit: number;
  }>;
  topTags: Array<{ tag: string; count: number }>;
};

function assertBetRecord(payload: SupabasePayload): BetRecord | null {
  if (payload.table !== "bets") {
    return null;
  }
  const record = payload.record;
  if (!record || !record.id || !record.user_id) {
    return null;
  }
  return record as BetRecord;
}

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function calculateWinRate(bets: BetRecord[]): number {
  const settled = bets.filter((bet) => bet.status !== "pending");
  if (settled.length === 0) {
    return 0;
  }
  const wins = settled.filter((bet) => bet.status === "won");
  return wins.length / settled.length;
}

function calculateRoi(bets: BetRecord[], days: number): number {
  if (bets.length === 0) {
    return 0;
  }
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const recent = bets.filter((bet) => {
    if (!bet.placed_at) {
      return false;
    }
    const placed = new Date(bet.placed_at);
    return placed >= cutoff;
  });
  if (recent.length === 0) {
    return 0;
  }
  let wagered = 0;
  let profit = 0;
  for (const bet of recent) {
    const stake = toNumber(bet.wager_amount);
    wagered += stake;
    if (bet.settled_payout !== null && bet.settled_payout !== undefined) {
      profit += toNumber(bet.settled_payout) - stake;
    }
  }
  if (wagered === 0) {
    return 0;
  }
  return profit / wagered;
}

function computeTagCounts(tags: BetTag[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const tag of tags) {
    if (!tag.tag) continue;
    counts.set(tag.tag, (counts.get(tag.tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateProfit(startingBalance: number, currentBalance: number): number {
  return currentBalance - startingBalance;
}

async function fetchUserBets(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to fetch bets: ${error.message}`);
  }
  const bets = (data ?? []) as BetRecord[];

  if (bets.length === 0) {
    return { bets: [], tags: [] as BetTag[] };
  }

  const betIds = bets.map((bet) => bet.id);
  const { data: tagsData, error: tagsError } = await supabase
    .from("bet_tags")
    .select("*")
    .in("bet_id", betIds);
  if (tagsError) {
    throw new Error(`Failed to fetch bet tags: ${tagsError.message}`);
  }

  return {
    bets,
    tags: (tagsData ?? []) as BetTag[],
  };
}

async function fetchUserBankrolls(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("bankroll_accounts")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to fetch bankroll accounts: ${error.message}`);
  }
  return (data ?? []) as BankrollAccount[];
}

async function updateBankrollBalances(
  supabase: SupabaseClient,
  userId: string,
  bankrolls: BankrollAccount[],
  bets: BetRecord[],
) {
  if (bankrolls.length === 0) {
    return;
  }
  const betsByAccount = new Map<string, BetRecord[]>();
  for (const bet of bets) {
    if (!bet.bankroll_id) continue;
    const list = betsByAccount.get(bet.bankroll_id) ?? [];
    list.push(bet);
    betsByAccount.set(bet.bankroll_id, list);
  }

  for (const account of bankrolls) {
    const accountBets = betsByAccount.get(account.id) ?? [];
    let totalStaked = 0;
    let totalReturned = 0;
    for (const bet of accountBets) {
      totalStaked += toNumber(bet.wager_amount);
      if (bet.settled_payout !== null && bet.settled_payout !== undefined) {
        totalReturned += toNumber(bet.settled_payout);
      }
    }
    const recalculatedBalance = toNumber(account.starting_balance) - totalStaked + totalReturned;
    if (Math.abs(recalculatedBalance - toNumber(account.current_balance)) < 0.01) {
      continue;
    }
    const { error } = await supabase
      .from("bankroll_accounts")
      .update({ current_balance: recalculatedBalance })
      .eq("id", account.id)
      .eq("user_id", userId);
    if (error) {
      console.error("bankroll-metrics-sync: failed to update bankroll", account.id, error);
    }
  }
}

async function buildMetricsSummary(supabase: SupabaseClient, userId: string): Promise<MetricsSummary> {
  const [bankrolls, { bets, tags }] = await Promise.all([
    fetchUserBankrolls(supabase, userId),
    fetchUserBets(supabase, userId),
  ]);

  await updateBankrollBalances(supabase, userId, bankrolls, bets);

  const totalBets = bets.length;
  const activeBets = bets.filter((bet) => bet.status === "pending").length;
  const settledBets = totalBets - activeBets;
  const winRate = calculateWinRate(bets);
  const roi30d = calculateRoi(bets, DAYS_30);
  const bankrollSummaries = bankrolls.map((account) => {
    const starting = toNumber(account.starting_balance);
    const current = toNumber(account.current_balance);
    return {
      id: account.id,
      label: account.label,
      currency: account.currency,
      startingBalance: starting,
      currentBalance: current,
      profit: calculateProfit(starting, current),
    };
  });
  const topTags = computeTagCounts(tags);

  return {
    totalBets,
    activeBets,
    settledBets,
    winRate,
    roi30d,
    bankrolls: bankrollSummaries,
    topTags,
  };
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: SupabasePayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("bankroll-metrics-sync: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  const bet = assertBetRecord(payload);
  if (!bet) {
    return errorResponse("Unsupported payload", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const metrics = await buildMetricsSummary(supabase, bet.user_id);
    return jsonResponse({ status: "ok", metrics });
  } catch (error) {
    console.error("bankroll-metrics-sync: failed to build metrics", error);
    return errorResponse(
      "Failed to calculate bankroll metrics",
      500,
      error instanceof Error ? error.message : error,
    );
  }
};

if (import.meta.main) {
  serve(handler);
}
