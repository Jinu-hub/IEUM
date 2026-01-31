/**
 * Cancel Subscription Dialog
 *
 * Displays a confirmation dialog when user attempts to cancel their subscription.
 * Shows different content based on billing interval (monthly vs yearly).
 * For yearly subscriptions, calculates and displays the estimated refund amount.
 * Handles API call to cancel subscription and process refunds.
 */
import { AlertTriangle, Calculator, Calendar, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRevalidator } from "react-router";
import { toast } from "sonner";

import { NexButton } from "~/core/components/nex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import type { BillingInterval, PlanType } from "~/core/lib/constants";
import { PLAN_TYPE_LABEL } from "~/core/lib/constants";
import type { Currency } from "~/core/prompts/types";
import {
  calculateNewEndsAt,
  calculateRefund,
} from "~/features/payments/lib/utils";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string | null;
  planType: PlanType;
  billingInterval: BillingInterval | null;
  billingCurrency: Currency | null;
  startedAt: string;
  endsAt: string | null;
  paidAmount: number | null;  // Actual paid amount from DB
  onSuccess?: () => void;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: Currency, locale: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
  };
  const mappedLocale = localeMap[locale] || locale;

  return new Intl.NumberFormat(mappedLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return "-";
  const localeMap: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
  };
  const mappedLocale = localeMap[locale] || locale;

  return new Date(dateString).toLocaleDateString(mappedLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscriptionId,
  planType,
  billingInterval,
  billingCurrency,
  startedAt,
  endsAt,
  paidAmount,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "planInfo.cancelDialog" });
  const revalidator = useRevalidator();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isYearly = billingInterval === "yearly";
  const currency = billingCurrency || "KRW";
  const planLabel = PLAN_TYPE_LABEL[planType];

  // Calculate refund for yearly plans using actual paid amount from DB
  const refund = useMemo(() => {
    if (!isYearly) return null;
    return calculateRefund(planType, currency, startedAt, paidAmount);
  }, [isYearly, planType, currency, startedAt, paidAmount]);

  // For yearly plans, show the new ends_at based on used months
  // For monthly plans, show the original ends_at
  const displayEndsAt = useMemo(() => {
    if (isYearly) {
      return calculateNewEndsAt(startedAt).toISOString();
    }
    return endsAt;
  }, [isYearly, startedAt, endsAt]);

  const formattedEndsAt = formatDate(displayEndsAt, i18n.language);

  // Handle subscription cancellation
  const handleConfirm = async () => {
    if (!subscriptionId) {
      setError("Subscription ID is missing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          refundAmount: isYearly && refund ? refund.refundAmount : undefined,
          cancelReason: "User requested cancellation",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Success - show toast, close dialog and refresh data
      const hasRefund = isYearly && refund && refund.refundAmount > 0;
      toast.success(
        hasRefund
          ? t("success.withRefund", {
              amount: formatCurrency(refund.refundAmount, currency, i18n.language),
            })
          : t("success.noRefund")
      );
      
      onOpenChange(false);
      revalidator.revalidate();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {isYearly ? t("yearlyWarning") : t("monthlyWarning")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Valid until notice */}
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <Calendar className="mt-0.5 size-5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t("validUntil", { date: formattedEndsAt, plan: planLabel })}
            </p>
          </div>

          {/* Monthly: No refund notice */}
          {!isYearly && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-sm text-muted-foreground">{t("monthlyNoRefund")}</p>
            </div>
          )}

          {/* Yearly: Refund details */}
          {isYearly && refund && (
            <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="mb-3 flex items-center gap-2">
                <Calculator className="size-4 text-primary" />
                <h4 className="font-medium">{t("refundDetails.title")}</h4>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("refundDetails.yearlyAmount")}</dt>
                  <dd className="font-medium">
                    {formatCurrency(refund.yearlyAmount, currency, i18n.language)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("refundDetails.usedMonths")}</dt>
                  <dd className="font-medium">
                    {t("refundDetails.monthsUnit", { count: refund.usedMonths })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("refundDetails.deduction")}</dt>
                  <dd className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(refund.deduction, currency, i18n.language)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({formatCurrency(refund.monthlyPrice, currency, i18n.language)} × {refund.usedMonths})
                    </span>
                  </dd>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("refundDetails.refundAmount")}</dt>
                    <dd className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(refund.refundAmount, currency, i18n.language)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter className="gap-3">
          <NexButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
            disabled={isLoading}
          >
            {t("buttons.cancel")}
          </NexButton>
          <NexButton
            variant="primary"
            onClick={handleConfirm}
            className="cursor-pointer bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              t("buttons.confirm")
            )}
          </NexButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
