/**
 * Billing Checkout Page Component (Stripe)
 *
 * This file implements a billing (subscription) checkout page with Stripe integration.
 * Uses Stripe Checkout Session for a hosted payment page experience.
 *
 * Key features:
 * - Authentication-protected checkout page
 * - Integration with Stripe Checkout Session for subscription payments
 * - Plan selection via URL parameters (plan, interval)
 * - Dynamic pricing based on selected plan and currency
 * - Automatic redirect to Stripe hosted checkout page
 */
import type { Route } from "./+types/billing-checkout-stripe";

import { CheckIcon, CreditCardIcon, Loader2Icon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useFetcher, useNavigate } from "react-router";
import Stripe from "stripe";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import { PLAN_TYPE_LABEL, calculatePrice } from "~/core/lib/constants";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { CURRENCY_VALUES } from "~/core/prompts/types";
import { getCurrencyLocale } from "~/features/payments/lib/Utils";

/**
 * Validation schema for URL parameters
 */
const paramsSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  currency: z.enum(CURRENCY_VALUES).default("USD"),
  region: z.enum(["KR", "JP", "GLOBAL"]).default("GLOBAL"),
});

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `Subscribe | ${import.meta.env.VITE_APP_NAME}` },
  ];
};

/**
 * Loader function for authentication and plan data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  // Parse URL parameters for plan selection
  const url = new URL(request.url);
  const result = paramsSchema.safeParse({
    plan: url.searchParams.get("plan"),
    interval: url.searchParams.get("interval") || "monthly",
    currency: url.searchParams.get("currency") || "USD",
    region: url.searchParams.get("region") || "GLOBAL",
  });

  // Redirect to pricing page if plan is invalid
  if (!result.success) {
    throw redirect("/pricing");
  }

  const { plan, interval, currency, region } = result.data;

  // Pro plan is not yet available - redirect to pricing page
  if (plan === "pro") {
    throw redirect("/pricing?error=pro_not_available");
  }

  // Calculate prices for both intervals
  const monthlyPrice = calculatePrice(plan, "monthly", currency);
  const yearlyPrice = calculatePrice(plan, "yearly", currency);
  const currentPrice = interval === "yearly" ? yearlyPrice : monthlyPrice;

  return {
    userId: user!.id,
    userName: user!.user_metadata?.name || user!.email,
    userEmail: user!.email,
    plan,
    interval,
    currency,
    region,
    price: currentPrice,
    monthlyPrice,
    yearlyPrice,
    planLabel: PLAN_TYPE_LABEL[plan],
  };
}

/**
 * Get Stripe Price ID from environment variables
 */
function getStripePriceId(plan: string, interval: string): string {
  const priceMap: Record<string, string | undefined> = {
    "starter-monthly": process.env.STRIPE_PRICE_STARTER_MONTHLY,
    "starter-yearly": process.env.STRIPE_PRICE_STARTER_YEARLY,
    "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
    "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY,
  };

  const priceId = priceMap[`${plan}-${interval}`];
  if (!priceId) {
    throw new Error(`No Stripe price ID found for ${plan}-${interval}`);
  }
  return priceId;
}

/**
 * Action function to create Stripe Checkout Session
 */
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { error: "User not found" };
  }

  const formData = await request.formData();
  const plan = formData.get("plan") as string;
  const interval = formData.get("interval") as string;
  const currency = formData.get("currency") as string;
  const region = formData.get("region") as string;

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });

  // Get the Stripe Price ID
  const priceId = getStripePriceId(plan, interval);

  // Get the origin for redirect URLs
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/payments/billing-success-stripe?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${interval}&currency=${currency}&region=${region}`,
      cancel_url: `${origin}/payments/billing-failure-stripe?reason=canceled&plan=${plan}&interval=${interval}`,
      metadata: {
        userId: user.id,
        plan,
        interval,
        currency,
        region,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          interval,
        },
      },
      // Enable automatic tax calculation if needed
      // automatic_tax: { enabled: true },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: "required",
    });

    if (!session.url) {
      return { error: "Failed to create checkout session" };
    }

    // Redirect to Stripe Checkout
    throw redirect(session.url);
  } catch (error) {
    // If it's a redirect, throw it
    if (error instanceof Response) {
      throw error;
    }
    
    console.error("Stripe checkout error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to create checkout session" 
    };
  }
}

/**
 * Billing Checkout component for Stripe subscription
 */
export default function CheckoutBillingStripe({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("common", { keyPrefix: "billing.checkout" });
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isLoading = fetcher.state === "submitting";

  // Format price based on currency
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(
      getCurrencyLocale(loaderData.currency),
      {
        style: "currency",
        currency: loaderData.currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  };

  // Format price for display
  const formattedPrice = useMemo(() => {
    return formatPrice(loaderData.price);
  }, [loaderData.price, loaderData.currency]);

  // Calculate monthly price for yearly plans (for display)
  const monthlyEquivalent = useMemo(() => {
    if (loaderData.interval === "yearly") {
      return formatPrice(Math.round(loaderData.yearlyPrice / 12));
    }
    return null;
  }, [loaderData.yearlyPrice, loaderData.interval, loaderData.currency]);

  // Calculate yearly savings percentage
  const yearlySavings = useMemo(() => {
    const monthlyTotal = loaderData.monthlyPrice * 12;
    const savings = monthlyTotal - loaderData.yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  }, [loaderData.monthlyPrice, loaderData.yearlyPrice]);

  // Handle interval change
  const handleIntervalChange = (newInterval: "monthly" | "yearly") => {
    if (newInterval === loaderData.interval) return;
    navigate(
      `/payments/billing-checkout-stripe?plan=${loaderData.plan}&interval=${newInterval}&currency=${loaderData.currency}&region=${loaderData.region}`,
      { replace: true }
    );
  };

  // Get plan features from translation
  const features = t(`features.${loaderData.plan}`, { returnObjects: true }) as string[];

  const intervalLabel = loaderData.interval === "yearly" ? t("price.perYear") : t("price.perMonth");

  return (
    <div className="flex flex-col items-center gap-20">
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
        {/* Plan details section */}
        <div className="flex flex-col gap-6">
          {/* Interval toggle */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => handleIntervalChange("monthly")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer",
                  loaderData.interval === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("intervalToggle.monthly")}
              </button>
              <button
                type="button"
                onClick={() => handleIntervalChange("yearly")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer",
                  loaderData.interval === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{t("intervalToggle.yearly")}</span>
                {yearlySavings > 0 && (
                  <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    {t("intervalToggle.save")} {yearlySavings}%
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            {/* Plan badge */}
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {loaderData.planLabel} {t("plan")}
              </span>
            </div>

            {/* Price display */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formattedPrice}</span>
                <span className="text-muted-foreground">
                  {intervalLabel}
                </span>
              </div>
              {monthlyEquivalent && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("price.monthlyEquivalent", { price: monthlyEquivalent })}
                </p>
              )}
            </div>

            {/* Features list */}
            <div className="space-y-3">
              <h3 className="font-medium">{t("includes")}</h3>
              <ul className="space-y-2">
                {Array.isArray(features) && features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckIcon className="size-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Billing info notice */}
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              {t("renewalNotice", { interval: loaderData.interval === "yearly" ? t("intervalToggle.yearly").toLowerCase() : t("intervalToggle.monthly").toLowerCase() })}
            </p>
          </div>
        </div>

        {/* Payment section */}
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>

          <p className="text-muted-foreground">
            {t("description", { plan: loaderData.planLabel })}
          </p>

          {/* Payment info card */}
          <div className="w-full rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <CreditCardIcon className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("cardRegistration.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("cardRegistration.description")}
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                {t("security.encryption")}
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                {t("security.pciCompliant")}
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                {t("security.cancelAnytime")}
              </li>
            </ul>
          </div>

          {/* Error message */}
          {fetcher.data?.error && (
            <div className="w-full rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              {fetcher.data.error}
            </div>
          )}

          {/* Subscribe button - triggers form submission */}
          <fetcher.Form method="post" className="w-full">
            <input type="hidden" name="plan" value={loaderData.plan} />
            <input type="hidden" name="interval" value={loaderData.interval} />
            <input type="hidden" name="currency" value={loaderData.currency} />
            <input type="hidden" name="region" value={loaderData.region} />
            
            <Button
              type="submit"
              className="w-full rounded-2xl py-7.5 text-lg"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 size-5 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                <>
                  {formattedPrice}{intervalLabel} {t("subscribeButton")}
                </>
              )}
            </Button>
          </fetcher.Form>

          <p className="text-xs text-muted-foreground text-center w-full">
            {t("termsNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
