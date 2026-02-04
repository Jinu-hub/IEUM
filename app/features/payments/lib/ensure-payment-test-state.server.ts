/**
 * Payment test user state reset (for billing E2E / manual testing).
 *
 * When the test user (PAYMENT_TEST_EMAIL) logs in, this module resets their
 * subscription, payments, and payment_methods to a "first login" default state.
 * Stripe subscription is canceled if present so dashboard and DB stay in sync.
 *
 * To deprecate: remove the call from login.tsx and delete this file.
 */

import Stripe from "stripe";

import adminClient from "~/core/lib/supa-admin-client.server";

export const PAYMENT_TEST_EMAIL = "payment30test@gmail.com";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
}

function oneMonthFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/**
 * Resets the given user's billing state to default (trial, no payments, no payment methods).
 * If they have a Stripe subscription, it is canceled so Stripe dashboard matches.
 */
export async function ensurePaymentTestState(userId: string): Promise<void> {
  const now = new Date().toISOString();

  const { data: subscription } = await adminClient
    .from("subscriptions")
    .select("subscription_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (subscription?.stripe_subscription_id) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (err) {
      console.error("ensurePaymentTestState: Stripe cancel failed (continuing):", err);
    }
  }

  const defaultFields = {
    plan_type: "trial" as const,
    status: "trialing" as const,
    mode: "experiment" as const,
    started_at: now,
    ends_at: null,
    trial_ends_at: oneMonthFromNow(),
    latest_payment_id: null,
    payment_method_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    billing_interval: "monthly" as const,
    billing_region: "KR",
    billing_currency: "KRW",
    updated_at: now,
  };

  if (subscription) {
    await adminClient
      .from("subscriptions")
      .update(defaultFields)
      .eq("subscription_id", subscription.subscription_id);
  } else {
    await adminClient.from("subscriptions").insert({
      user_id: userId,
      ...defaultFields,
      created_at: now,
    });
  }

  await adminClient.from("payments").delete().eq("user_id", userId);
  await adminClient.from("payment_methods").delete().eq("user_id", userId);
}
