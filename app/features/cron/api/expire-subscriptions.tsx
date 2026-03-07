/**
 * Expire Subscriptions Cron API
 *
 * Updates subscription status to "expired" for records where ends_at has passed.
 * Secured with CRON_SECRET. Intended to be called by a scheduled job (e.g. daily).
 */

import { data } from "react-router";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { Route } from "./+types/expire-subscriptions";

export async function action({ request }: Route.ActionArgs) {
  if (
    request.method !== "POST" ||
    request.headers.get("Authorization") !== process.env.CRON_SECRET
  ) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await adminClient
    .from("subscriptions")
    .update({
      status: "expired",
    })
    .not("ends_at", "is", null)
    .lt("ends_at", now)
    .not("status", "in", "(expired)")
    .select("subscription_id");

  if (error) {
    console.error("[cron] expire-subscriptions error:", error);
    return data(
      { error: error.message, updated: 0 },
      { status: 500 }
    );
  }

  const count = updated?.length ?? 0;
  if (count > 0) {
    console.log(`[cron] expire-subscriptions: ${count} subscription(s) marked expired`);
  }

  return data({ updated: count });
}
