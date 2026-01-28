/**
 * Cancel Subscription API Endpoint
 *
 * This file implements an API endpoint for canceling a user's subscription.
 * For yearly subscriptions with refund amounts, it processes refunds through
 * Toss Payments API or Stripe API based on the payment provider.
 *
 * Key features:
 * - Request method validation (POST only)
 * - Authentication protection
 * - Toss Payments refund API integration (for Korean users)
 * - Stripe subscription cancel & refund API integration (for Global/Japan users)
 * - Subscription and payment method status updates
 * - Error handling for API errors
 */
import type { Route } from "./+types/cancel-subscription";

import { data } from "react-router";
import Stripe from "stripe";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { isZeroDecimalCurrency } from "~/core/prompts/types";
import { calculateNewEndsAtISO } from "~/features/payments/lib/Utils";

/**
 * Get Stripe client (lazy initialization)
 * This prevents build-time errors when STRIPE_SECRET_KEY is not set
 */
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
}

interface CancelRequestBody {
  subscriptionId: string;
  refundAmount?: number;
  cancelReason?: string;
}

/**
 * Action handler for processing subscription cancellation requests
 *
 * This function handles the complete subscription cancellation flow:
 * 1. Validates that the request method is POST
 * 2. Authenticates the user making the request
 * 3. Fetches subscription and payment information
 * 4. For yearly subscriptions with refunds: calls Toss Payments cancel API
 * 5. Updates subscription status to "canceled"
 * 6. Optionally revokes the payment method
 *
 * @param request - The incoming HTTP request
 * @returns Success response or error response
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  requireMethod("POST")(request);

  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);

  // Verify the user is authenticated
  await requireAuthentication(client);

  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "User not authenticated" }, { status: 401 });
  }

  // Parse request body
  let body: CancelRequestBody;
  try {
    body = await request.json();
  } catch {
    return data({ error: "Invalid request body" }, { status: 400 });
  }

  const { subscriptionId, refundAmount, cancelReason } = body;

  if (!subscriptionId) {
    return data({ error: "subscriptionId is required" }, { status: 400 });
  }

  // Fetch subscription with payment information
  const { data: subscription, error: subscriptionError } = await adminClient
    .from("subscriptions")
    .select(`
      *,
      payments:latest_payment_id (
        payment_id,
        payment_key,
        pg_provider,
        total_amount,
        currency,
        status,
        stripe_payment_intent_id
      )
    `)
    .eq("subscription_id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (subscriptionError || !subscription) {
    return data(
      { error: "Subscription not found or access denied" },
      { status: 404 }
    );
  }

  // Check if subscription is already canceled
  if (subscription.status === "canceled") {
    return data({ error: "Subscription is already canceled" }, { status: 400 });
  }

  // For yearly subscriptions with refund amount, process refund
  const isYearly = subscription.billing_interval === "yearly";
  const hasRefund = refundAmount && refundAmount > 0;
  const payment = subscription.payments;
  
  // Determine payment provider (Stripe or Toss)
  const isStripe = !!subscription.stripe_subscription_id || payment?.pg_provider === "stripe";

  // ========================================
  // STRIPE: Cancel subscription and process refund
  // ========================================
  if (isStripe && subscription.stripe_subscription_id) {
    const stripe = getStripe();
    try {
      // 1. Set metadata to indicate this is a user-initiated cancel (not admin)
      // This flag tells the webhook handler NOT to update ends_at
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        metadata: { cancel_immediately: "false" },
      });

      // 2. Cancel Stripe subscription immediately
      // Both monthly and yearly plans: cancel immediately on Stripe side
      // NexLetter side maintains the ends_at (validity period) separately
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      console.log(`Stripe subscription ${subscription.stripe_subscription_id} canceled`);

      // 2. Process refund for yearly plans with refund amount
      if (isYearly && hasRefund && payment?.stripe_payment_intent_id) {
        // Zero-decimal currencies (JPY, KRW) don't need multiplication
        const currency = payment.currency || subscription.billing_currency || "USD";
        const refundAmountInSmallestUnit = isZeroDecimalCurrency(currency)
          ? Math.round(refundAmount)
          : Math.round(refundAmount * 100); // Convert to cents for USD, etc.

        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: refundAmountInSmallestUnit,
          reason: "requested_by_customer",
        });

        console.log(`Stripe refund created: ${stripeRefund.id}, amount: ${refundAmountInSmallestUnit}`);

        // Update payment record with refund information
        await adminClient
          .from("payments")
          .update({
            status: "refunded",
            raw_data: {
              ...((payment as Record<string, unknown>).raw_data || {}),
              refund: {
                id: stripeRefund.id,
                amount: stripeRefund.amount,
                status: stripeRefund.status,
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq("payment_id", payment.payment_id);
      }
    } catch (error) {
      console.error("Stripe API error:", error);
      const stripeError = error as Stripe.errors.StripeError;
      return data(
        {
          error: `Stripe error: ${stripeError.message || "Failed to cancel subscription"}`,
          code: stripeError.code,
        },
        { status: 400 }
      );
    }
  }
  // ========================================
  // TOSS: Process refund via Toss Payments API
  // ========================================
  else if (isYearly && hasRefund && payment?.payment_key) {
    // Prepare authorization header for Toss Payments API
    const encryptedSecretKey =
      "Basic " +
      Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY + ":").toString("base64");

    try {
      // Call Toss Payments cancel API for partial refund
      const refundResponse = await fetch(
        `https://api.tosspayments.com/v1/payments/${payment.payment_key}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: encryptedSecretKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelReason: cancelReason || "구독 해지에 따른 환불",
            cancelAmount: Math.round(refundAmount), // Ensure integer
          }),
        }
      );

      const refundData = await refundResponse.json();

      if (!refundResponse.ok) {
        console.error("Toss Payments refund error:", refundData);
        return data(
          {
            error: `Refund failed: ${refundData.message || "Unknown error"}`,
            code: refundData.code,
          },
          { status: 400 }
        );
      }

      // Update payment record with refund information
      await adminClient
        .from("payments")
        .update({
          status: refundData.status || "PARTIAL_CANCELED",
          raw_data: refundData,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_id", payment.payment_id);

    } catch (error) {
      console.error("Toss Payments API error:", error);
      return data(
        { error: "Failed to process refund. Please try again." },
        { status: 500 }
      );
    }
  }

  // Calculate new ends_at based on used months for yearly subscriptions
  const newEndsAt = isYearly && subscription.started_at
    ? calculateNewEndsAtISO(subscription.started_at)
    : undefined;

  // Update subscription status to canceled (and ends_at for yearly plans)
  const { error: updateError } = await adminClient
    .from("subscriptions")
    .update({
      status: "canceled",
      ...(newEndsAt && { ends_at: newEndsAt }),
      updated_at: new Date().toISOString(),
    })
    .eq("subscription_id", subscriptionId);

  if (updateError) {
    console.error("Subscription update error:", updateError);
    return data(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }

  // Optionally revoke the payment method
  if (subscription.payment_method_id) {
    await adminClient
      .from("payment_methods")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("method_id", subscription.payment_method_id);
  }

  return data({
    success: true,
    message: isYearly && hasRefund
      ? "Subscription canceled and refund processed"
      : "Subscription canceled successfully",
    refundAmount: hasRefund ? refundAmount : 0,
    newEndsAt: newEndsAt || null,
  });
}
