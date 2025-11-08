/**
 * Edge Alerts API Route
 * Fetches and manages edge alerts
 */

import { NextRequest, NextResponse } from "next/server";
import type { AlertSummary, EdgeAlertWithStatus } from "@/lib/types/alerts";
import { withStatus } from "@/lib/types/alerts";

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session
    // const session = await getServerSession();
    // const userId = session?.user?.id;

    // TODO: Fetch from Supabase
    // const { data, error } = await supabase
    //   .from('edge_alerts')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('triggered_at', { ascending: false });

    // Mock alerts for development
    const mockAlerts: EdgeAlertWithStatus[] = [
      {
        id: "1",
        user_id: "user-1",
        origin: "model",
        trigger_ev_threshold: 3.0,
        event_name: "Lakers vs Warriors",
        market: "Moneyline",
        bookmaker: "DraftKings",
        odds: -150,
        ev_percentage: 5.8,
        confidence_score: 0.87,
        reasoning:
          "Lakers showing strong home performance (8-2 in last 10). Warriors dealing with injuries to key players. Market seems to undervalue Lakers' recent momentum.",
        triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        acknowledged_at: null,
        dismissed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
      },
      {
        id: "2",
        user_id: "user-1",
        origin: "model",
        trigger_ev_threshold: 2.0,
        event_name: "Chiefs vs Bills",
        market: "Spread -3.5",
        bookmaker: "FanDuel",
        odds: -105,
        ev_percentage: 3.2,
        confidence_score: 0.75,
        reasoning:
          "Chiefs' offensive line improvements and Bills' recent defensive struggles create value. Weather conditions favor Chiefs' running game.",
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        dismissed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "acknowledged",
      },
      {
        id: "3",
        user_id: "user-1",
        origin: "manual",
        trigger_ev_threshold: 5.0,
        event_name: "Celtics vs Heat",
        market: "Over 220.5",
        bookmaker: "BetMGM",
        odds: -110,
        ev_percentage: 7.5,
        confidence_score: null,
        reasoning: null,
        triggered_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        acknowledged_at: null,
        dismissed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
      },
      {
        id: "4",
        user_id: "user-1",
        origin: "model",
        trigger_ev_threshold: 2.0,
        event_name: "Nuggets vs Suns",
        market: "Moneyline",
        bookmaker: "Caesars",
        odds: +180,
        ev_percentage: 2.8,
        confidence_score: 0.62,
        reasoning: "Jokic's historical performance against Suns, home court advantage.",
        triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        acknowledged_at: null,
        dismissed_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "dismissed",
      },
    ];

    // Calculate summary
    const summary: AlertSummary = {
      totalAlerts: mockAlerts.length,
      activeAlerts: mockAlerts.filter((a) => a.status === "active").length,
      acknowledgedAlerts: mockAlerts.filter((a) => a.status === "acknowledged").length,
      dismissedAlerts: mockAlerts.filter((a) => a.status === "dismissed").length,
      highestEV: Math.max(...mockAlerts.map((a) => a.ev_percentage)),
      averageEV:
        mockAlerts.reduce((sum, a) => sum + a.ev_percentage, 0) / mockAlerts.length,
      alertsByOrigin: {
        model: mockAlerts.filter((a) => a.origin === "model").length,
        manual: mockAlerts.filter((a) => a.origin === "manual").length,
      },
      recentAlerts: mockAlerts.slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch alerts",
      },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate request body
    // TODO: Insert into Supabase
    // const { data, error } = await supabase
    //   .from('edge_alerts')
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
    console.error("Create alert error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create alert",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/alerts/[id] - Update an alert (acknowledge/dismiss)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: "Alert ID is required" },
        { status: 400 }
      );
    }

    // TODO: Update in Supabase
    // const { data, error } = await supabase
    //   .from('edge_alerts')
    //   .update(body)
    //   .eq('id', alertId)
    //   .select()
    //   .single();

    // Mock response
    return NextResponse.json({
      success: true,
      data: {
        id: alertId,
        ...body,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update alert",
      },
      { status: 500 }
    );
  }
}
