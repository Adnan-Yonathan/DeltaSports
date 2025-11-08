/**
 * Bankroll API Route
 * Fetches bankroll summary data including account, metrics, bets, and performance
 */

import { NextRequest, NextResponse } from "next/server";
import type { BankrollSummary, BetStatus } from "@/lib/types/bankroll";

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session
    // const session = await getServerSession();
    // const userId = session?.user?.id;

    // TODO: Fetch from Supabase
    // const { data, error } = await supabase
    //   .from('bankroll_accounts')
    //   .select('*, bets(*)')
    //   .eq('user_id', userId)
    //   .single();

    // Mock data for development
    const mockData: BankrollSummary = {
      account: {
        id: "1",
        user_id: "user-1",
        label: "Main Bankroll",
        currency: "USD",
        starting_balance: 1000,
        current_balance: 1250,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      metrics: {
        totalBets: 24,
        activeBets: 3,
        settledBets: 21,
        winRate: 0.571,
        roi30d: 25.0,
        profit: 250,
        averageWager: 50,
        largestWin: 125,
        largestLoss: 50,
        currentStreak: {
          type: "win",
          count: 3,
        },
      },
      recentBets: [
        {
          id: "1",
          user_id: "user-1",
          bankroll_id: "1",
          event_name: "Lakers vs Warriors",
          market: "Moneyline",
          wager_amount: 100,
          american_odds: -150,
          decimal_odds: 1.67,
          expected_value: 2.5,
          status: "won" as BetStatus,
          settled_payout: 166.67,
          notes: "Strong value on Lakers at home",
          placed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          settled_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["sharp", "nba"],
        },
        {
          id: "2",
          user_id: "user-1",
          bankroll_id: "1",
          event_name: "Chiefs vs Bills",
          market: "Spread -3.5",
          wager_amount: 50,
          american_odds: -110,
          decimal_odds: 1.91,
          expected_value: 1.2,
          status: "pending" as BetStatus,
          settled_payout: null,
          notes: null,
          placed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          settled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["nfl"],
        },
        {
          id: "3",
          user_id: "user-1",
          bankroll_id: "1",
          event_name: "Celtics vs Heat",
          market: "Over 220.5",
          wager_amount: 75,
          american_odds: -105,
          decimal_odds: 1.95,
          expected_value: 0.8,
          status: "lost" as BetStatus,
          settled_payout: 0,
          notes: "Weather impacted scoring",
          placed_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          settled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["nba", "live_bet"],
        },
      ],
      performanceBySport: [
        {
          category: "NBA",
          bets: 12,
          wins: 8,
          losses: 4,
          winRate: 0.667,
          profit: 180,
          roi: 15.0,
          avgOdds: -120,
        },
        {
          category: "NFL",
          bets: 8,
          wins: 4,
          losses: 4,
          winRate: 0.5,
          profit: 50,
          roi: 6.25,
          avgOdds: -110,
        },
        {
          category: "MLB",
          bets: 4,
          wins: 2,
          losses: 2,
          winRate: 0.5,
          profit: 20,
          roi: 5.0,
          avgOdds: +150,
        },
      ],
      performanceByMarket: [
        {
          category: "Moneyline",
          bets: 10,
          wins: 7,
          losses: 3,
          winRate: 0.7,
          profit: 150,
          roi: 15.0,
          avgOdds: -140,
        },
        {
          category: "Spread",
          bets: 8,
          wins: 4,
          losses: 4,
          winRate: 0.5,
          profit: 60,
          roi: 7.5,
          avgOdds: -110,
        },
        {
          category: "Over/Under",
          bets: 6,
          wins: 3,
          losses: 3,
          winRate: 0.5,
          profit: 40,
          roi: 6.67,
          avgOdds: -105,
        },
      ],
      topTags: [
        { tag: "sharp", count: 8 },
        { tag: "nba", count: 12 },
        { tag: "nfl", count: 8 },
        { tag: "live_bet", count: 5 },
      ],
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error("Bankroll API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bankroll data",
      },
      { status: 500 }
    );
  }
}

// POST /api/bankroll - Create a new bet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate request body
    // TODO: Insert into Supabase
    // const { data, error } = await supabase
    //   .from('bets')
    //   .insert([body])
    //   .select()
    //   .single();

    // Mock response
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create bet error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create bet",
      },
      { status: 500 }
    );
  }
}
