import { assertAlmostEquals, assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import {
  extractBetRecord,
  processBankrollMetrics,
  type SupabasePayload,
} from "../bankroll-metrics-sync/index.ts";

Deno.test("extractBetRecord returns a bet record for supported payloads", () => {
  const payload: SupabasePayload = {
    table: "bets",
    record: {
      id: "bet-1",
      user_id: "user-1",
    } as SupabasePayload["record"],
  };

  const record = extractBetRecord(payload);
  assertEquals(record?.id, "bet-1");
  assertEquals(record?.user_id, "user-1");
});

Deno.test("extractBetRecord returns null for unsupported payloads", () => {
  const invalidTable: SupabasePayload = {
    table: "profiles",
    record: {
      id: "bet-1",
      user_id: "user-1",
    } as SupabasePayload["record"],
  };

  const missingUser: SupabasePayload = {
    table: "bets",
    record: {
      id: "bet-1",
    } as SupabasePayload["record"],
  };

  assertEquals(extractBetRecord(invalidTable), null);
  assertEquals(extractBetRecord(missingUser), null);
});

Deno.test("processBankrollMetrics calculates summaries and updates bankroll balances", async () => {
  const userId = "user-42";
  const now = new Date().toISOString();

  const bets = [
    {
      id: "bet-1",
      user_id: userId,
      status: "pending",
      wager_amount: 100,
      placed_at: now,
      bankroll_id: "bankroll-1",
    },
    {
      id: "bet-2",
      user_id: userId,
      status: "won",
      wager_amount: 200,
      settled_payout: 260,
      placed_at: now,
      bankroll_id: "bankroll-1",
    },
  ];

  const tags = [
    { tag: "soccer" },
    { tag: "soccer" },
    { tag: "nba" },
  ];

  const bankrolls = [
    {
      id: "bankroll-1",
      label: "Main",
      currency: "USD",
      starting_balance: 1000,
      current_balance: 900,
    },
  ];

  const updates: Array<{ current_balance: number }> = [];

  type SupabaseClientStub = Parameters<typeof processBankrollMetrics>[0];

  const supabase = {
    from(table: string) {
      if (table === "bets") {
        return {
          select: (_columns: string) => ({
            eq: (_column: string, _value: string) =>
              Promise.resolve({ data: bets, error: null }),
          }),
        };
      }

      if (table === "bet_tags") {
        return {
          select: (_columns: string) => ({
            in: (_column: string, _values: string[]) =>
              Promise.resolve({ data: tags, error: null }),
          }),
        };
      }

      if (table === "bankroll_accounts") {
        return {
          select: (_columns: string) => ({
            eq: (_column: string, _value: string) =>
              Promise.resolve({ data: bankrolls, error: null }),
          }),
          update: (payload: { current_balance: number }) => ({
            eq: (_column: string, _value: string) => ({
              eq: (_column2: string, _value2: string) => {
                updates.push(payload);
                return Promise.resolve({ error: null });
              },
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClientStub;

  const metrics = await processBankrollMetrics(supabase, userId);

  assertEquals(metrics.totalBets, 2);
  assertEquals(metrics.activeBets, 1);
  assertEquals(metrics.settledBets, 1);
  assertEquals(metrics.winRate, 1);
  assertAlmostEquals(metrics.roi30d, 0.2, 1e-6);
  assertEquals(metrics.bankrolls, [
    {
      id: "bankroll-1",
      label: "Main",
      currency: "USD",
      startingBalance: 1000,
      currentBalance: 900,
      profit: -100,
    },
  ]);
  assertEquals(metrics.topTags, [
    { tag: "soccer", count: 2 },
    { tag: "nba", count: 1 },
  ]);

  assertEquals(updates, [{ current_balance: 960 }]);
});
