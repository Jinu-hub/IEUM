/**
 * Billing Success Page Component
 *
 * This file implements the billing authorization success page that:
 * 1. Receives authKey from Toss Payments redirect
 * 2. Issues a billingKey using the Toss API
 * 3. Saves the payment method to the database
 * 4. Executes the first billing payment
 * 5. Creates/updates the user's subscription
 *
 * Key features:
 * - Authentication protection
 * - BillingKey issuance via Toss API
 * - Payment method registration in database
 * - Initial subscription payment
 * - Subscription record creation
 */

import type { Route } from "./+types/billing-success-toss";

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
 * Validation schema for URL parameters from Toss Payments redirect
 */
const paramsSchema = z.object({
  authKey: z.string(),
  customerKey: z.string(),
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["monthly", "yearly"]),
  currency: z.enum(["USD", "KRW", "JPY"]).optional(),
  region: z.enum(["KR", "JP", "GLOBAL"]).optional(),
});

/**
 * Default values for region/currency when not provided
 */
const DEFAULT_REGION = "KR" as const;
const DEFAULT_CURRENCY = "KRW" as const;

/**
 * Validation schema for Toss billingKey response
 */
const billingKeyResponseSchema = z.object({
  billingKey: z.string(),
  customerKey: z.string(),
  authenticatedAt: z.string(),
  method: z.string(),
  card: z
    .object({
      issuerCode: z.string().optional(),
      acquirerCode: z.string().optional(),
      number: z.string().optional(),
      cardType: z.string().optional(),
      ownerType: z.string().optional(),
    })
    .optional(),
});

/**
 * Validation schema for Toss billing payment response
 */
const billingPaymentResponseSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  orderName: z.string(),
  status: z.string(),
  requestedAt: z.string(),
  approvedAt: z.string(),
  receipt: z.object({
    url: z.string(),
  }),
  totalAmount: z.number(),
  method: z.string().optional(),
  card: z
    .object({
      issuerCode: z.string().optional(),
      number: z.string().optional(),
    })
    .optional(),
});

/**
 * Loader function for billing key issuance and subscription creation
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/payments/billing-failure-toss?code=auth_error&message=User not found");
  }

  // Parse URL parameters
  const url = new URL(request.url);
  const result = paramsSchema.safeParse({
    authKey: url.searchParams.get("authKey"),
    customerKey: url.searchParams.get("customerKey"),
    plan: url.searchParams.get("plan"),
    interval: url.searchParams.get("interval"),
    currency: url.searchParams.get("currency") || undefined,
    region: url.searchParams.get("region") || undefined,
  });

  if (!result.success) {
    throw redirect(
      `/payments/billing-failure-toss?code=invalid_params&message=${encodeURIComponent("Invalid parameters")}`
    );
  }

  const { authKey, customerKey, plan, interval } = result.data;

  // Pro plan is not yet available - redirect to pricing page
  if (plan === "pro") {
    throw redirect("/pricing?error=pro_not_available");
  }
  // Apply default values for region and currency if not provided
  const region = result.data.region ?? DEFAULT_REGION;
  const currency = result.data.currency ?? DEFAULT_CURRENCY;
  const price = calculatePrice(plan, interval, currency);

  // Prepare authorization header for Toss Payments API
  const encryptedSecretKey =
    "Basic " +
    Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY + ":").toString("base64");

  // Step 1: Issue billingKey from authKey
  const billingKeyResponse = await fetch(
    "https://api.tosspayments.com/v1/billing/authorizations/issue",
    {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authKey,
        customerKey,
      }),
    }
  );

  const billingKeyData = await billingKeyResponse.json();

  if (!billingKeyResponse.ok) {
    throw redirect(
      `/payments/billing-failure-toss?code=${encodeURIComponent(billingKeyData.code || "billing_key_error")}&message=${encodeURIComponent(billingKeyData.message || "Failed to issue billing key")}`
    );
  }

  const billingKeyResult = billingKeyResponseSchema.safeParse(billingKeyData);
  if (!billingKeyResult.success) {
    throw redirect(
      `/payments/billing-failure-toss?code=validation_error&message=${encodeURIComponent("Invalid billing key response")}`
    );
  }

  const { billingKey, card } = billingKeyResult.data;

  // Step 2: Save payment method to database
  const { data: paymentMethod, error: pmError } = await adminClient
    .from("payment_methods")
    .insert({
      user_id: user.id,
      pg_provider: "toss",
      method_type: "card",
      customer_key: customerKey,
      billing_key: billingKey,
      status: "active",
      is_default: true,
      display_brand: card?.cardType || null,
      display_last4: card?.number?.slice(-4) || null,
      region,
      currency,
      metadata: { plan, interval },
      raw_data: billingKeyData,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (pmError) {
    console.error("Failed to save payment method:", pmError);
    throw redirect(
      `/payments/billing-failure-toss?code=db_error&message=${encodeURIComponent("Failed to save payment method")}`
    );
  }

  // Step 3: Execute first billing payment
  const orderId = `sub-${plan}-${Date.now()}`;
  const orderName = `${PLAN_TYPE_LABEL[plan]} Plan (${interval === "yearly" ? "Annual" : "Monthly"})`;

  const paymentResponse = await fetch(
    `https://api.tosspayments.com/v1/billing/${billingKey}`,
    {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey,
        amount: price,
        orderId,
        orderName,
        customerEmail: user.email,
        customerName: user.user_metadata?.name || user.email,
      }),
    }
  );

  const paymentData = await paymentResponse.json();

  if (!paymentResponse.ok) {
    // Payment failed, but we still have the billing key
    // Mark payment method as suspended and redirect to failure
    await adminClient
      .from("payment_methods")
      .update({ status: "suspended" })
      .eq("method_id", paymentMethod.method_id);

    throw redirect(
      `/payments/billing-failure-toss?code=${encodeURIComponent(paymentData.code || "payment_error")}&message=${encodeURIComponent(paymentData.message || "Payment failed")}`
    );
  }

  const paymentResult = billingPaymentResponseSchema.safeParse(paymentData);
  if (!paymentResult.success) {
    throw redirect(
      `/payments/billing-failure-toss?code=validation_error&message=${encodeURIComponent("Invalid payment response")}`
    );
  }

  // Step 4: Record payment in database
  const { data: payment, error: payError } = await adminClient
    .from("payments")
    .insert({
      pg_provider: "toss",
      payment_key: paymentResult.data.paymentKey,
      order_id: paymentResult.data.orderId,
      order_name: paymentResult.data.orderName,
      total_amount: paymentResult.data.totalAmount,
      currency: "KRW", // Toss Payments is Korea only
      receipt_url: paymentResult.data.receipt.url,
      status: paymentResult.data.status,
      approved_at: paymentResult.data.approvedAt,
      requested_at: paymentResult.data.requestedAt,
      metadata: { plan, interval, subscriptionType: "billing" },
      raw_data: paymentData,
      user_id: user.id,
    })
    .select()
    .single();

  if (payError) {
    console.error("Failed to record payment:", payError);
  }

  // Step 5: Create/Update subscription
  const now = new Date();
  const endsAt = new Date(now);
  if (interval === "yearly") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }

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
        payment_method_id: paymentMethod.method_id,
        billing_interval: interval,
        billing_region: region,
        billing_currency: currency,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        trial_ends_at: null,
        latest_payment_id: payment?.payment_id || null,
      })
      .eq("subscription_id", existingSubscription.subscription_id);
  } else {
    // Create new subscription
    await adminClient.from("subscriptions").insert({
      user_id: user.id,
      plan_type: plan,
      status: "active",
      mode: "paid",
      payment_method_id: paymentMethod.method_id,
      billing_interval: interval,
      billing_region: region,
      billing_currency: currency,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      trial_ends_at: null,
      latest_payment_id: payment?.payment_id || null,
    });
  }

  // Set all other payment methods as non-default
  await adminClient
    .from("payment_methods")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .neq("method_id", paymentMethod.method_id);

  return {
    plan,
    planLabel: PLAN_TYPE_LABEL[plan],
    interval,
    price,
    currency,
    orderId: paymentResult.data.orderId,
    receiptUrl: paymentResult.data.receipt.url,
    endsAt: endsAt.toISOString(),
  };
}

/**
 * Billing Success component
 */
export default function BillingSuccessToss({ loaderData }: Route.ComponentProps) {
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
          <Button asChild variant="outline" className="flex-1" size="lg">
            <a href={loaderData.receiptUrl} target="_blank" rel="noreferrer">
              {t("viewReceipt")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
