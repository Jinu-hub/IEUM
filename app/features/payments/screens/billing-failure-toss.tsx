/**
 * Billing Failure Page Component
 *
 * This file implements the billing authorization/payment failure page that displays
 * error information when a billing process fails. It provides users with clear feedback
 * about what went wrong and options to retry.
 *
 * Key features:
 * - Displays billing error codes and messages from Toss Payments
 * - Extracts error details from URL parameters
 * - Provides clear visual feedback with error styling
 * - Offers retry option to attempt subscription again
 */

import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import { Link, type MetaFunction, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";

/**
 * Meta function for setting page metadata
 */
export const meta: MetaFunction = () => {
  return [{ title: `Subscription Error | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Error messages mapping for common error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_params: "The request parameters were invalid. Please try again.",
  auth_error: "Authentication failed. Please log in and try again.",
  billing_key_error:
    "Failed to register your payment method. Please try a different card.",
  payment_error:
    "The payment could not be processed. Please check your card details and try again.",
  validation_error:
    "There was a problem verifying the payment. Please try again.",
  db_error:
    "A system error occurred. Please try again or contact support if the problem persists.",
  REJECT_CARD_COMPANY:
    "The card was rejected by the card company. Please try a different card.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT:
    "You have exceeded the maximum number of daily payments. Please try again tomorrow.",
  NOT_SUPPORTED_INSTALLMENT_PLAN:
    "The selected installment plan is not supported. Please try a different option.",
  INVALID_CARD_EXPIRATION: "The card has expired. Please use a valid card.",
  INVALID_STOPPED_CARD: "This card has been suspended. Please use a different card.",
  INSUFFICIENT_BALANCE:
    "Insufficient balance. Please check your card limit or try a different card.",
};

/**
 * Billing Failure component
 */
export default function BillingFailureToss() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("code") || "unknown_error";
  const errorMessage =
    searchParams.get("message") ||
    ERROR_MESSAGES[errorCode] ||
    "An unexpected error occurred.";
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval");

  // Build retry URL with plan parameters if available
  const retryUrl = plan
    ? `/payments/billing-checkout-toss?plan=${plan}${interval ? `&interval=${interval}` : ""}`
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
          Subscription Failed
        </h1>

        {/* Error description */}
        <p className="text-muted-foreground">{errorMessage}</p>

        {/* Error details card */}
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="mb-3 text-sm font-medium text-red-800 dark:text-red-300">
            Error Details
          </h2>
          <dl className="space-y-2 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-red-600 dark:text-red-400">Error Code</dt>
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
            If this problem persists, please try using a different payment
            method or contact our support team for assistance.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" size="lg">
            <Link to={retryUrl}>
              <RefreshCwIcon className="mr-2 size-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/pricing">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Plans
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
