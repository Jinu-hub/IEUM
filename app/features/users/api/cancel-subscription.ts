/**
 * Cancel Subscription API Endpoint
 *
 * This file implements an API endpoint for canceling a user's subscription.
 * For yearly subscriptions with refund amounts, it processes refunds through
 * Toss Payments API before updating the subscription status.
 *
 * Key features:
 * - Request method validation (POST only)
 * - Authentication protection
 * - Toss Payments refund API integration (for yearly plans with refunds)
 * - Subscription and payment method status updates
 * - Error handling for API errors
 */
import type { Route } from "./+types/cancel-subscription";

import { data } from "react-router";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { calculateNewEndsAtISO } from "~/features/users/lib/paymentUtils";

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
        total_amount,
        status
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

  // For yearly subscriptions with refund amount, process refund via Toss Payments
  const isYearly = subscription.billing_interval === "yearly";
  const hasRefund = refundAmount && refundAmount > 0;
  const payment = subscription.payments;

  if (isYearly && hasRefund && payment?.payment_key) {
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
