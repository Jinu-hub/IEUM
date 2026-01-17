import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export async function getUserSubscription(
  client: SupabaseClient<Database>,
  { userId }: { userId: string | null },
) {
  if (!userId) {
    return null;
  }
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.log("getUserSubscription error:", error);
    return null;
  }
  return data;
}

export async function getUserProfile(
  client: SupabaseClient<Database>,
  { userId }: { userId: string | null },
) {
  if (!userId) {
    return null;
  }
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("profile_id", userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function getWorkspaceOwnerUserId(
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) {
  const { data, error } = await client
    .from("workspace")
    .select("owner_user_id")
    .eq("workspace_id", workspaceId)
    .single();
  if (error) {
    throw error;
  }
  return data?.owner_user_id || null;
}
