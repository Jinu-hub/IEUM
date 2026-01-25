/**
 * Billing Failure Page Component (Stripe)
 *
 * This file implements the billing/payment failure page that displays
 * error information when a Stripe payment process fails. It provides users 
 * with clear feedback about what went wrong and options to retry.
 *
 * Key features:
 * - Displays billing error codes and messages from Stripe
 * - Extracts error details from URL parameters
 * - Provides clear visual feedback with error styling
 * - Offers retry option to attempt subscription again
 */

import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, type MetaFunction, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";

/**
 * Meta function for setting page metadata
 */
export const meta: MetaFunction = () => {
  return [{ title: `Subscription Error | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Billing Failure component for Stripe
 */
export default function BillingFailureStripe() {
  const { t } = useTranslation("common", { keyPrefix: "billing.failure" });
  const { t: tCommon } = useTranslation("common", { keyPrefix: "common" });
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("code") || searchParams.get("reason") || "unknown_error";
  const errorMessage =
    searchParams.get("message") ||
    t(`errorMessages.${errorCode}`, { defaultValue: t("errorMessages.unknown_error") });
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  // Build retry URL with plan parameters if available
  const retryUrl = plan
    ? `/payments/billing-checkout-stripe?plan=${plan}${interval ? `&interval=${interval}` : ""}&currency=USD&region=GLOBAL`
    : "/pricing";

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        {/* Error icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircleIcon className="size-10 text-red-600" />
        </div>

        {/* Error heading */}
        <h1 className="text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400">
          {t("title")}
        </h1>

        {/* Error description */}
        <p className="text-muted-foreground">{errorMessage}</p>

        {/* Error details card */}
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="mb-3 text-sm font-medium text-red-800 dark:text-red-300">
            {t("errorDetails")}
          </h2>
          <dl className="space-y-2 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-red-600 dark:text-red-400">{t("errorCode")}</dt>
              <dd className="font-mono text-red-800 dark:text-red-300">
                {errorCode}
              </dd>
            </div>
            {plan && (
              <div className="flex justify-between">
                <dt className="text-red-600 dark:text-red-400">Plan</dt>
                <dd className="capitalize text-red-800 dark:text-red-300">
                  {plan}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Help text */}
        <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <p>
            {t("helpText")}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" size="lg">
            <Link to={retryUrl}>
              <RefreshCwIcon className="mr-2 size-4" />
              {t("tryAgain")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/dashboard">
              <ArrowLeftIcon className="mr-2 size-4" />
              {t("backToDashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
