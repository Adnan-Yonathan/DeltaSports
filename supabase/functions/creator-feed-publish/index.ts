import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { emptyResponse, errorResponse, jsonResponse } from "../_shared/response.ts";
import type {
  CreatorPost,
  CreatorProfile,
  CreatorSubscription,
  Database,
} from "../_shared/types.ts";

type PublishPayload = {
  creatorId?: string;
  creatorHandle?: string;
  title: string;
  content: string;
  market?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

type Notification = {
  subscriptionId: string;
  userId: string;
  creatorId: string;
  postId: string;
  title: string;
  message: string;
};

async function fetchCreator(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: PublishPayload,
): Promise<CreatorProfile> {
  if (payload.creatorId) {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", payload.creatorId)
      .single();
    if (error) {
      throw new Error(`Failed to load creator: ${error.message}`);
    }
    return data as CreatorProfile;
  }
  if (payload.creatorHandle) {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .ilike("handle", payload.creatorHandle);
    if (error || !data || data.length === 0) {
      throw new Error(`Creator handle ${payload.creatorHandle} not found`);
    }
    return data[0] as CreatorProfile;
  }
  throw new Error("creatorId or creatorHandle is required");
}

async function insertPost(
  supabase: ReturnType<typeof createServiceRoleClient>,
  creator: CreatorProfile,
  payload: PublishPayload,
): Promise<CreatorPost> {
  const insertPayload: Database["public"]["Tables"]["creator_posts"]["Insert"] = {
    creator_id: creator.id,
    title: payload.title,
    content: payload.content,
    market: payload.market ?? null,
    metadata: payload.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("creator_posts")
    .insert(insertPayload)
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to publish creator post: ${error.message}`);
  }
  return data as CreatorPost;
}

async function fetchActiveSubscriptions(
  supabase: ReturnType<typeof createServiceRoleClient>,
  creatorId: string,
): Promise<CreatorSubscription[]> {
  const { data, error } = await supabase
    .from("creator_subscriptions")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "active");
  if (error) {
    throw new Error(`Failed to load subscriptions: ${error.message}`);
  }
  return (data ?? []) as CreatorSubscription[];
}

function buildNotification(
  creator: CreatorProfile,
  subscription: CreatorSubscription,
  post: CreatorPost,
): Notification {
  return {
    subscriptionId: subscription.id,
    userId: subscription.user_id,
    creatorId: creator.id,
    postId: post.id,
    title: post.title,
    message: `${creator.display_name} dropped a new insight: ${post.title}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return emptyResponse();
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let payload: PublishPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("creator-feed-publish: invalid JSON payload", error);
    return errorResponse("Invalid JSON payload", 400);
  }

  if (!payload.title || !payload.content) {
    return errorResponse("title and content are required", 400);
  }

  const supabase = createServiceRoleClient();

  try {
    const creator = await fetchCreator(supabase, payload);
    const post = await insertPost(supabase, creator, payload);
    const subscriptions = await fetchActiveSubscriptions(supabase, creator.id);

    const notifications = subscriptions.map((subscription) =>
      buildNotification(creator, subscription, post)
    );

    return jsonResponse({
      status: "ok",
      post,
      subscribersNotified: subscriptions.length,
      notifications,
    });
  } catch (error) {
    console.error("creator-feed-publish: failed to publish", error);
    return errorResponse(
      "Failed to publish creator update",
      500,
      error instanceof Error ? error.message : error,
    );
  }
});
