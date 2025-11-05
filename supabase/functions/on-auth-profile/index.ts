import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../shared/response.ts";
import type { Database } from "../shared/database.types.ts";

type RawMetadata = Record<string, unknown> | null | undefined;

type AuthWebhookPayload = {
  type?: string;
  record?: {
    id?: string;
    raw_user_meta_data?: RawMetadata;
  };
  user?: {
    id?: string;
    user_metadata?: RawMetadata;
    raw_user_meta_data?: RawMetadata;
  };
  new?: {
    id?: string;
    raw_user_meta_data?: RawMetadata;
  };
};

type ProfileInput = Database["public"]["Tables"]["user_profiles"]["Insert"];

const DEFAULT_TIMEZONE = "UTC";

function extractAuthUserId(payload: AuthWebhookPayload): string | undefined {
  return (
    payload.record?.id ??
    payload.user?.id ??
    payload.new?.id
  );
}

function extractMetadata(payload: AuthWebhookPayload): RawMetadata {
  return (
    payload.record?.raw_user_meta_data ??
    payload.user?.user_metadata ??
    payload.user?.raw_user_meta_data ??
    payload.new?.raw_user_meta_data ??
    null
  );
}

function getMetadataValue<T extends string>(metadata: Record<string, unknown>, key: T): unknown {
  return Object.prototype.hasOwnProperty.call(metadata, key)
    ? metadata[key]
    : undefined;
}

function normalizeFavoriteSports(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(",").map((sport) => sport.trim()).filter(Boolean);
  }
  return [];
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: AuthWebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("on-auth-profile: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  const authUserId = extractAuthUserId(payload);
  if (!authUserId) {
    console.error("on-auth-profile: missing auth user id", payload);
    return errorResponse("Missing auth user id", 400);
  }

  const metadata = (extractMetadata(payload) ?? {}) as Record<string, unknown>;
  const preferredTimezoneRaw = getMetadataValue(metadata, "preferred_timezone");
  const favoriteSportsRaw = getMetadataValue(metadata, "favorite_sports");
  const bankrollGoalRaw = getMetadataValue(metadata, "bankroll_goal");

  const preferredTimezone = typeof preferredTimezoneRaw === "string" && preferredTimezoneRaw.trim().length > 0
    ? preferredTimezoneRaw
    : DEFAULT_TIMEZONE;
  const favoriteSports = normalizeFavoriteSports(favoriteSportsRaw);
  const bankrollGoal = normalizeNumber(bankrollGoalRaw);

  const supabase = createServiceRoleClient();

  const profileInput: ProfileInput = {
    auth_user_id: authUserId,
    preferred_timezone: preferredTimezone,
    favorite_sports: favoriteSports,
    bankroll_goal: bankrollGoal,
  };

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .upsert(profileInput, {
      onConflict: "auth_user_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error("on-auth-profile: failed to upsert profile", error);
    return errorResponse("Failed to upsert user profile", 500);
  }

  const checklist = [
    {
      id: "confirm_timezone",
      description: "Confirm your preferred timezone for scheduling alerts",
      completed: preferredTimezone !== DEFAULT_TIMEZONE,
    },
    {
      id: "set_favorite_sports",
      description: "Add favorite sports to personalize market coverage",
      completed: favoriteSports.length > 0,
    },
    {
      id: "define_bankroll_goal",
      description: "Set a bankroll goal to unlock tailored staking guidance",
      completed: typeof bankrollGoal === "number" && bankrollGoal > 0,
    },
  ];

  return jsonResponse({
    status: "ok",
    profile,
    checklist,
  });
};

if (import.meta.main) {
  serve(handler);
}
