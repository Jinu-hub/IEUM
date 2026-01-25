/**
 * Billing Success Page Component (Stripe)
 *
 * This file implements the billing success page for Stripe payments that:
 * 1. Receives session_id from Stripe Checkout redirect
 * 2. Retrieves session details from Stripe API
 * 3. Saves the payment method to the database
 * 4. Creates/updates the user's subscription
 *
 * Key features:
 * - Authentication protection
 * - Stripe Session verification
 * - Payment method registration in database
 * - Subscription record creation
 */

import type { Route } from "./+types/billing-success-stripe";

import Stripe from "stripe";
import { CheckCircle2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, redirect } from "react-router";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import {
  type Currency,
  PLAN_TYPE_LABEL,
  calculatePrice
} from "~/core/lib/constants";
import { requireAuthentication } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => [
  {
    title: `Subscription Complete | ${import.meta.env.VITE_APP_NAME}`,
  },
];

/**
 * Validation schema for URL parameters from Stripe redirect
 */
const paramsSchema = z.object({
  session_id: z.string(),
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["monthly", "yearly"]),
  currency: z.enum(["USD", "KRW", "JPY"]).optional(),
  region: z.enum(["KR", "JP", "GLOBAL"]).optional(),
});

/**
 * Default values for region/currency when not provided
 */
const DEFAULT_REGION = "GLOBAL" as const;
const DEFAULT_CURRENCY = "USD" as const;

/**
 * Loader function for Stripe session verification and subscription creation
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/payments/billing-failure-stripe?code=auth_error&message=User not found");
  }

  // Parse URL parameters
  const url = new URL(request.url);
  const result = paramsSchema.safeParse({
    session_id: url.searchParams.get("session_id"),
    plan: url.searchParams.get("plan"),
    interval: url.searchParams.get("interval"),
    currency: url.searchParams.get("currency") || undefined,
    region: url.searchParams.get("region") || undefined,
  });

  if (!result.success) {
    throw redirect(
      `/payments/billing-failure-stripe?code=invalid_params&message=${encodeURIComponent("Invalid parameters")}`
    );
  }

  const { session_id, plan, interval } = result.data;

  // Pro plan is not yet available - redirect to pricing page
  if (plan === "pro") {
    throw redirect("/pricing?error=pro_not_available");
  }

  // Apply default values for region and currency if not provided
  const region = result.data.region ?? DEFAULT_REGION;
  const currency = result.data.currency ?? DEFAULT_CURRENCY;
  const price = calculatePrice(plan, interval, currency);

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });

  try {
    // Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        "subscription",
        "subscription.default_payment_method",
        "subscription.latest_invoice",
        "subscription.latest_invoice.payment_intent",
        "customer",
      ],
    });

    // Verify the session is completed
    if (session.status !== "complete") {
      throw redirect(
        `/payments/billing-failure-stripe?code=session_incomplete&message=${encodeURIComponent("Payment session is not complete")}`
      );
    }

    // Verify user matches
    if (session.metadata?.userId !== user.id) {
      throw redirect(
        `/payments/billing-failure-stripe?code=user_mismatch&message=${encodeURIComponent("User mismatch")}`
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
    const customer = session.customer as Stripe.Customer;

    // Extract card details for display
    const card = paymentMethod?.card;

    // Step 1: Save payment method to database
    const { data: savedPaymentMethod, error: pmError } = await adminClient
      .from("payment_methods")
      .insert({
        user_id: user.id,
        pg_provider: "stripe",
        method_type: "card",
        customer_key: customer.id, // Stripe Customer ID
        billing_key: paymentMethod?.id || subscription.id, // Stripe PaymentMethod ID
        status: "active",
        is_default: true,
        display_brand: card?.brand || null,
        display_last4: card?.last4 || null,
        region,
        currency,
        metadata: { 
          plan, 
          interval,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
        },
        raw_data: {
          sessionId: session.id,
          subscriptionId: subscription.id,
          customerId: customer.id,
          paymentMethodId: paymentMethod?.id,
        },
        issued_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pmError) {
      console.error("Failed to save payment method:", pmError);
      throw redirect(
        `/payments/billing-failure-stripe?code=db_error&message=${encodeURIComponent("Failed to save payment method")}`
      );
    }

    // Step 2: Record payment in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = (subscription as any).latest_invoice as Record<string, any> | null;
    const orderId = `stripe-${plan}-${Date.now()}`;
    const orderName = `${PLAN_TYPE_LABEL[plan]} Plan (${interval === "yearly" ? "Annual" : "Monthly"})`;

    // Extract payment_intent ID (can be string or object)
    const paymentIntentId = invoice?.payment_intent 
      ? (typeof invoice.payment_intent === 'string' 
          ? invoice.payment_intent 
          : invoice.payment_intent?.id)
      : null;

    // Zero-decimal currencies (JPY, KRW) don't need division by 100
    const isZeroDecimalCurrency = ["JPY", "KRW"].includes(currency);
    const totalAmount = isZeroDecimalCurrency 
      ? (session.amount_total || 0) 
      : (session.amount_total || 0) / 100;

    const { data: payment, error: payError } = await adminClient
      .from("payments")
      .insert({
        pg_provider: "stripe",
        payment_key: paymentIntentId || session.id,
        order_id: orderId,
        order_name: orderName,
        total_amount: totalAmount,
        currency,
        receipt_url: invoice?.hosted_invoice_url || "",
        status: "paid",
        approved_at: new Date().toISOString(),
        requested_at: new Date(session.created * 1000).toISOString(),
        metadata: { plan, interval, subscriptionType: "billing" },
        raw_data: {
          sessionId: session.id,
          subscriptionId: subscription.id,
          invoiceId: invoice?.id,
        },
        user_id: user.id,
        stripe_invoice_id: invoice?.id || null,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    if (payError) {
      console.error("Failed to record payment:", payError);
    }

    // Step 3: Create/Update subscription
    const now = new Date();
    
    // Get current_period_end from Stripe subscription
    // If not available from session, fetch directly from Stripe API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentPeriodEnd = (subscription as any).current_period_end;
    
    // If current_period_end is not available, fetch subscription directly
    if (!currentPeriodEnd) {
      try {
        const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentPeriodEnd = (fullSubscription as any).current_period_end;
      } catch (e) {
        console.error("Failed to fetch subscription details:", e);
      }
    }
    
    // Calculate ends_at - use Stripe's period end or calculate based on interval
    const endsAt = currentPeriodEnd && currentPeriodEnd > 0
      ? new Date(currentPeriodEnd * 1000)
      : new Date(now.getTime() + (interval === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);

    // Check if user already has a subscription
    const { data: existingSubscription } = await adminClient
      .from("subscriptions")
      .select()
      .eq("user_id", user.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      await adminClient
        .from("subscriptions")
        .update({
          plan_type: plan,
          status: "active",
          mode: "paid",
          payment_method_id: savedPaymentMethod.method_id,
          billing_interval: interval,
          billing_region: region,
          billing_currency: currency,
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          trial_ends_at: null,
          latest_payment_id: payment?.payment_id || null,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id || null,
        })
        .eq("subscription_id", existingSubscription.subscription_id);
    } else {
      // Create new subscription
      await adminClient.from("subscriptions").insert({
        user_id: user.id,
        plan_type: plan,
        status: "active",
        mode: "paid",
        payment_method_id: savedPaymentMethod.method_id,
        billing_interval: interval,
        billing_region: region,
        billing_currency: currency,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        trial_ends_at: null,
        latest_payment_id: payment?.payment_id || null,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id || null,
      });
    }

    // Set all other payment methods as non-default
    await adminClient
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("method_id", savedPaymentMethod.method_id);

    return {
      plan,
      planLabel: PLAN_TYPE_LABEL[plan],
      interval,
      price,
      currency,
      orderId,
      receiptUrl: invoice?.hosted_invoice_url || "",
      endsAt: endsAt.toISOString(),
    };
  } catch (error) {
    // If it's a redirect, throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("Stripe session verification error:", error);
    throw redirect(
      `/payments/billing-failure-stripe?code=stripe_error&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Failed to verify payment"
      )}`
    );
  }
}

/**
 * Billing Success component
 */
export default function BillingSuccessStripe({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "billing.success" });
  
  const formattedPrice = new Intl.NumberFormat(
    loaderData.currency === "JPY"
      ? "ja-JP"
      : loaderData.currency === "USD"
        ? "en-US"
        : "ko-KR",
    {
      style: "currency",
      currency: loaderData.currency,
      maximumFractionDigits: 0,
    }
  ).format(loaderData.price);

  const localeMap: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
  };
  const dateLocale = localeMap[i18n.language] || "en-US";
  
  const formattedEndsAt = new Date(loaderData.endsAt).toLocaleDateString(
    dateLocale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        {/* Success icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2Icon className="size-10 text-green-600" />
        </div>

        {/* Success message */}
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("title", { plan: loaderData.planLabel })}
        </h1>

        <p className="text-muted-foreground">
          {t("description")}
        </p>

        {/* Subscription details */}
        <div className="w-full rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-medium">{t("subscriptionDetails")}</h2>
          <dl className="space-y-3 text-left">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("plan")}</dt>
              <dd className="font-medium">{loaderData.planLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("billingCycle")}</dt>
              <dd className="font-medium">
                {loaderData.interval === "yearly" ? t("annual") : t("monthly")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("amount")}</dt>
              <dd className="font-medium">{formattedPrice}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("nextBillingDate")}</dt>
              <dd className="font-medium">{formattedEndsAt}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("orderId")}</dt>
              <dd className="font-mono text-sm">{loaderData.orderId}</dd>
            </div>
          </dl>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" size="lg">
            <Link to="/dashboard">{t("goToDashboard")}</Link>
          </Button>
          {loaderData.receiptUrl && (
            <Button asChild variant="outline" className="flex-1" size="lg">
              <a href={loaderData.receiptUrl} target="_blank" rel="noreferrer">
                {t("viewReceipt")}
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
