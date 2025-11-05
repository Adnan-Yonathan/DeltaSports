import type { createServiceRoleClient } from "@shared/client.ts";
import type { Database } from "@shared/types.ts";

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

export type RawMetadata = Record<string, unknown> | null | undefined;

export type AuthWebhookPayload = {
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

export type ProfileInput = Database["public"]["Tables"]["user_profiles"]["Insert"];

export type ChecklistItem = {
  id: string;
  description: string;
  completed: boolean;
};

const DEFAULT_TIMEZONE = "UTC";

export function extractAuthUserId(payload: AuthWebhookPayload): string | undefined {
  return (
    payload.record?.id ??
    payload.user?.id ??
    payload.new?.id
  );
}

export function extractMetadata(payload: AuthWebhookPayload): RawMetadata {
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

function buildProfileChecklist(
  preferredTimezone: string,
  favoriteSports: string[],
  bankrollGoal: number | null,
): ChecklistItem[] {
  return [
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
}

export async function bootstrapUserProfile(
  supabase: SupabaseClient,
  payload: AuthWebhookPayload,
): Promise<{ profile: ProfileInput & { id: string }; checklist: ChecklistItem[] }> {
  const authUserId = extractAuthUserId(payload);
  if (!authUserId) {
    throw new Error("Missing auth user id");
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

  if (error || !profile) {
    throw new Error(error ? `Failed to upsert user profile: ${error.message}` : "Profile not returned");
  }

  const checklist = buildProfileChecklist(preferredTimezone, favoriteSports, bankrollGoal);

  return {
    profile: profile as ProfileInput & { id: string },
    checklist,
  };
}
