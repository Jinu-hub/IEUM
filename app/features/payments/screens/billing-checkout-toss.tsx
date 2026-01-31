/**
 * Billing Checkout Page Component
 *
 * This file implements a billing (subscription) checkout page with Toss Payments integration.
 * Unlike the regular checkout, this page uses requestBillingAuth to register a payment method
 * and obtain a billingKey for recurring payments.
 *
 * Key features:
 * - Authentication-protected checkout page
 * - Integration with Toss Payments SDK for billing authorization
 * - Plan selection via URL parameters (plan, interval)
 * - Dynamic pricing based on selected plan and currency
 * - Payment method registration for recurring billing
 */
import type { Route } from "./+types/billing-checkout-toss";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CheckIcon, CreditCardIcon, Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import { PLAN_TYPE_LABEL } from "~/core/lib/constants";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { CURRENCY_VALUES } from "~/core/prompts/types";
import { calculatePrice, getCurrencyLocale } from "~/features/payments/lib/utils";

/**
 * Validation schema for URL parameters
 */
const paramsSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  currency: z.enum(CURRENCY_VALUES).default("KRW"),
  region: z.enum(["KR", "JP", "GLOBAL"]).default("KR"),
});

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `Subscribe | ${import.meta.env.VITE_APP_NAME}` },
    {
      name: "color-scheme",
      content: "light",
    },
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
    currency: url.searchParams.get("currency") || "KRW",
    region: url.searchParams.get("region") || "KR",
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
    userName: user!.user_metadata.name,
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
 * Billing Checkout component for subscription registration
 */
export default function CheckoutBillingToss({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("common", { keyPrefix: "billing.checkout" });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // Formatted monthly and yearly prices
  const formattedMonthlyPrice = formatPrice(loaderData.monthlyPrice);
  const formattedYearlyPrice = formatPrice(loaderData.yearlyPrice);

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
      `/payments/billing-checkout-toss?plan=${loaderData.plan}&interval=${newInterval}&currency=${loaderData.currency}&region=${loaderData.region}`,
      { replace: true } 
    );
  };

  // Get plan features from translation
  const features = t(`features.${loaderData.plan}`, { returnObjects: true }) as string[];

  /**
   * Handle billing authorization request
   * 
   * Flow:
   * 1. Initialize Toss Payments SDK
   * 2. Create payment instance with customerKey
   * 3. Call requestBillingAuth to open card registration UI
   * 
   * @see https://docs.tosspayments.com/sdk/v2/js#paymentrequestbillingauth
   */
  const handleClick = async () => {
    setIsLoading(true);
    try {
      const metaTags = document.querySelectorAll('meta[name="color-scheme"]');
      metaTags.forEach((tag) => {
        tag.setAttribute("content", "light");
      });

      // 1. Load Toss Payments SDK
      const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY;
      console.log("Using client key:", clientKey?.substring(0, 20) + "...");
      
      const tossPayments = await loadTossPayments(clientKey);
      console.log("Toss SDK loaded successfully");

      // 2. Create payment instance with customerKey
      // Note: This requires API 개별 연동 키 (not 결제위젯 키)
      // @see https://docs.tosspayments.com/sdk/v2/js#tosspaymentspayment
      const payment = tossPayments.payment({
        customerKey: loaderData.userId,
      });
      console.log("Payment instance created");

      // 3. Request billing authorization (opens card registration popup)
      // @see https://docs.tosspayments.com/sdk/v2/js#paymentrequestbillingauth
      await payment.requestBillingAuth({
        method: "CARD", // 자동결제(빌링)는 카드만 지원
        successUrl: `${window.location.origin}/payments/billing-success-toss?plan=${loaderData.plan}&interval=${loaderData.interval}&currency=${loaderData.currency}&region=${loaderData.region}`,
        failUrl: `${window.location.origin}/payments/billing-failure-toss?plan=${loaderData.plan}&interval=${loaderData.interval}`,
        customerEmail: loaderData.userEmail,
        customerName: loaderData.userName,
      });
    } catch (error: any) {
      console.error("Billing auth error:", error);
      
      // Don't show error for user cancellation
      const errorMessage = error?.message || error || "";
      const isCancelled = 
        errorMessage.includes("취소") || 
        errorMessage.includes("cancel") ||
        error?.code === "PAY_PROCESS_CANCELED" ||
        error?.code === "USER_CANCEL";
      
      if (!isCancelled) {
        // Show error only for actual errors (not user cancellation)
        alert(t("paymentError", { message: errorMessage }));
      }
      
      setIsLoading(false);
    }
  };

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

          {/* Subscribe button */}
          <Button
            className="w-full rounded-2xl py-7.5 text-lg"
            size="lg"
            onClick={handleClick}
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

          <p className="text-xs text-muted-foreground text-center w-full">
            {t("termsNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
