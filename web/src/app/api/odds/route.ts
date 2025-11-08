/**
 * Odds API Route
 * GET /api/odds?sport=basketball_nba&markets=h2h,spreads,totals
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchOdds, processOdds, calculateEV, filterByEV } from "@/lib/services/odds-api";
import type { OddsAPIParams } from "@/lib/types/odds-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get API key from environment
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ODDS_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get query parameters
    const sport = searchParams.get("sport") || "basketball_nba";
    const regions = searchParams.get("regions") || "us,us2";
    const markets = searchParams.get("markets") || "h2h,spreads,totals";
    const bookmakers = searchParams.get("bookmakers") || undefined;
    const minEv = parseFloat(searchParams.get("min_ev") || "0");

    // Fetch odds from The Odds API
    const params: OddsAPIParams = {
      apiKey,
      sport,
      regions,
      markets,
      oddsFormat: "american",
      bookmakers,
    };

    const rawOdds = await fetchOdds(params);

    // Process odds into UI-friendly format
    const processedOdds = processOdds(rawOdds);

    // Calculate EV opportunities
    const evAnalysis = calculateEV(processedOdds);

    // Filter by minimum EV if specified
    const filteredEV = minEv > 0 ? filterByEV(evAnalysis, minEv) : evAnalysis;

    // Return both processed odds and EV analysis
    return NextResponse.json({
      success: true,
      data: {
        events: processedOdds,
        evOpportunities: filteredEV,
        metadata: {
          sport,
          eventCount: processedOdds.length,
          evOpportunityCount: filteredEV.length,
          fetchedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[Odds API Error]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch odds",
      },
      { status: 500 }
    );
  }
}
