/**
 * Stripe Webhook Handler
 *
 * This file handles incoming webhooks from Stripe to keep our database
 * in sync with Stripe's subscription and payment states.
 *
 * Key events handled:
 * - customer.subscription.created: New subscription created
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Successful payment
 * - invoice.payment_failed: Failed payment
 *
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Only processes verified events from Stripe
 */

import Stripe from "stripe";
import adminClient from "~/core/lib/supa-admin-client.server";
import { isZeroDecimalCurrency } from "~/core/prompts/types";
import type { Route } from "./+types/stripe-webhook";

/**
 * Get Stripe client (lazy initialization)
 * This prevents build-time errors when STRIPE_SECRET_KEY is not set
 */
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
}

/**
 * Map Stripe subscription status to our subscription status
 */
function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: "active",
    canceled: "canceled",
    incomplete: "paused",
    incomplete_expired: "expired",
    past_due: "paused",
    paused: "paused",
    trialing: "trialing",
    unpaid: "paused",
  };
  return statusMap[stripeStatus] || "paused";
}

/**
 * Action handler for Stripe webhook events
 */
export async function action({ request }: Route.ActionArgs) {
  // Only accept POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`Processing Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return new Response("Webhook handler error", { status: 500 });
  }
}

/**
 * Handle subscription created or updated events
 * 
 * This handles:
 * - New subscription creation (from billing-success-stripe.tsx)
 * - Subscription renewals (from invoice.paid webhook)
 * - Status changes (trialing -> active, etc.)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  // TODO(jinwoo): Stripe에서 NexLetter 유저와 매핑되지 않은 테스트/샘플 구독 이벤트는
  // userId가 없으므로 여기서 조용히 무시한다. 나중에 livemode, 추가 metadata 등을 함께 보고
  // 처리/무시 기준을 더 엄격하게 가져갈지 검토할 것.
  if (!userId) {
    console.error("No userId in subscription metadata:", subscription.id);
    return;
  }

  // User-initiated cancel from NexLetter: cancel-subscription.ts sets this before calling
  // stripe.subscriptions.cancel(). Skipping here avoids overwriting DB (monthly: ends_at
  // must not change; yearly: ends_at is set by cancel-subscription.ts).
  if (subscription.metadata?.cancel_immediately === "false") {
    console.log(`Subscription ${subscription.id} - skipping update (user cancel, handled by cancel-subscription.ts)`);
    return;
  }

  // Guard against delayed webhook events (e.g. customer.subscription.created arriving
  // after the user already canceled). Don't revert a canceled subscription.
  const { data: dbSub } = await adminClient
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (dbSub?.status === "canceled") {
    console.log(`Subscription ${subscription.id} - skipping update (already canceled in DB)`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = subscription as any;
  const status = mapSubscriptionStatus(subscription.status) as "active" | "canceled" | "trialing" | "paused" | "expired";
  const endsAt = subAny.current_period_end 
    ? new Date(subAny.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days

  // Update subscription in database
  const { error } = await adminClient
    .from("subscriptions")
    .update({
      status,
      ends_at: endsAt,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id || null,
    })
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }

  console.log(`Subscription ${subscription.id} updated to status: ${status}`);
}

/**
 * Handle subscription canceled event
 * 
 * Two scenarios:
 * 1. User cancels via NexLetter (cancel-subscription.ts):
 *    - metadata.cancel_immediately = "false"
 *    - Skip processing (already handled by cancel-subscription.ts)
 * 
 * 2. Admin cancels via Stripe Dashboard:
 *    - metadata.cancel_immediately is NOT "false" (or doesn't exist)
 *    - Set ends_at to current time (immediate termination)
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  // TODO(jinwoo): userId가 없는 구독 이벤트는 NexLetter와 연결되지 않은 것으로 보고
  // DB를 수정하지 않고 무시한다. 필요 시 livemode, metadata 기반으로 알림/추가 처리 검토.
  if (!userId) {
    console.error("No userId in subscription metadata:", subscription.id);
    return;
  }

  // Check if this is a user-initiated cancel (from cancel-subscription.ts)
  // or an admin-initiated cancel (from Stripe Dashboard)
  const cancelImmediately = subscription.metadata?.cancel_immediately !== "false";

  if (!cancelImmediately) {
    // User cancel from NexLetter → Skip (already handled by cancel-subscription.ts)
    console.log(`Subscription ${subscription.id} - skipping webhook update (user cancel, already handled by cancel-subscription.ts)`);
    return;
  }

  // Admin cancel from Stripe Dashboard → Set ends_at to now (immediate termination)
  const { error } = await adminClient
    .from("subscriptions")
    .update({
      status: "expired",
      ends_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to cancel subscription (admin):", error);
    throw error;
  }
  console.log(`Subscription ${subscription.id} expired immediately by admin`);

  // Revoke payment method (only for admin cancel)
  await adminClient
    .from("payment_methods")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("pg_provider", "stripe");

  console.log(`Subscription ${subscription.id} canceled`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any;
  const subscription = invoiceAny.subscription as string | null;
  
  if (!subscription) {
    console.log("Invoice without subscription, skipping:", invoice.id);
    return;
  }

  // Get subscription to find userId
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSubAny = stripeSubscription as any;
  const userId = stripeSubAny.metadata?.userId;

  // TODO(jinwoo): invoice.paid인데 userId가 없으면 데이터 연동 이상 상황으로 간주하고
  // DB에는 손대지 않는다. 추후 livemode + 환경 값을 함께 보고 Sentry/Slack 알림을 붙이는 등
  // 운영 대응 방식을 정할 것.
  if (!userId) {
    console.error("No userId in subscription metadata for invoice:", invoice.id);
    return;
  }

  // Record payment in database
  const { data: existingPayment } = await adminClient
    .from("payments")
    .select("payment_id")
    .eq("stripe_invoice_id", invoice.id)
    .single();

  if (existingPayment) {
    console.log("Payment already recorded for invoice:", invoice.id);
    return;
  }

  // Extract payment_intent ID (can be string or object)
  const paymentIntentId = invoiceAny.payment_intent 
    ? (typeof invoiceAny.payment_intent === 'string' 
        ? invoiceAny.payment_intent 
        : invoiceAny.payment_intent?.id)
    : null;

  // Zero-decimal currencies (JPY, KRW) don't need division by 100
  const invoiceCurrency = invoice.currency?.toUpperCase() || "USD";
  const totalAmount = isZeroDecimalCurrency(invoiceCurrency)
    ? invoice.amount_paid 
    : invoice.amount_paid / 100;

  const { error: payError } = await adminClient.from("payments").insert({
    pg_provider: "stripe",
    payment_key: paymentIntentId || invoice.id,
    order_id: `stripe-renewal-${Date.now()}`,
    order_name: invoice.lines.data[0]?.description || "Subscription renewal",
    total_amount: totalAmount,
    currency: invoiceCurrency,
    receipt_url: invoice.hosted_invoice_url || "",
    status: "paid",
    approved_at: new Date().toISOString(),
    requested_at: new Date(invoice.created * 1000).toISOString(),
    metadata: { invoiceId: invoice.id, subscriptionId: subscription },
    raw_data: {
      invoiceId: invoice.id,
      subscriptionId: subscription,
      amountPaid: invoice.amount_paid,
    },
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: paymentIntentId,
  });

  if (payError) {
    console.error("Failed to record payment:", payError);
    throw payError;
  }

  // Don't reactivate a subscription that was already canceled
  const { data: dbSub } = await adminClient
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription)
    .single();

  if (dbSub?.status === "canceled") {
    console.log(`Invoice ${invoice.id} paid but subscription already canceled, skipping status update`);
    return;
  }

  // Update subscription end date
  const newEndsAt = stripeSubAny.current_period_end 
    ? new Date(stripeSubAny.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
  
  await adminClient
    .from("subscriptions")
    .update({
      status: "active",
      ends_at: newEndsAt,
    })
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription);

  console.log(`Invoice ${invoice.id} paid and recorded`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any;
  const subscription = invoiceAny.subscription as string | null;

  if (!subscription) {
    console.log("Invoice without subscription, skipping:", invoice.id);
    return;
  }

  // Get subscription to find userId
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSubAny = stripeSubscription as any;
  const userId = stripeSubAny.metadata?.userId;

  // TODO(jinwoo): invoice.payment_failed인데 userId가 없으면 단순 결제 실패가 아니라
  // Stripe/NexLetter 연동 이상으로 본다. 현재는 DB를 건드리지 않고 무시만 하며,
  // 나중에 stripe_subscription_id로 user를 역추적하거나 알림을 보내는 로직을 검토할 것.
  if (!userId) {
    console.error("No userId in subscription metadata for failed invoice:", invoice.id);
    return;
  }

  // Update subscription status to paused
  await adminClient
    .from("subscriptions")
    .update({
      status: "paused",
    })
    .eq("user_id", userId)
    .eq("stripe_subscription_id", subscription);

  // Suspend payment method
  await adminClient
    .from("payment_methods")
    .update({
      status: "suspended",
    })
    .eq("user_id", userId)
    .eq("pg_provider", "stripe");

  console.log(`Payment failed for invoice ${invoice.id}, subscription paused`);
}
