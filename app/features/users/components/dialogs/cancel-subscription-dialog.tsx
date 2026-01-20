/**
 * Cancel Subscription Dialog
 *
 * Displays a confirmation dialog when user attempts to cancel their subscription.
 * Shows different content based on billing interval (monthly vs yearly).
 * For yearly subscriptions, calculates and displays the estimated refund amount.
 */
import { AlertTriangle, Calculator, Calendar } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { NexButton } from "~/core/components/nex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import type { BillingInterval, Currency, PlanType } from "~/core/lib/constants";
import {
  EXCHANGE_RATES,
  PLAN_PRICES,
  PLAN_TYPE_LABEL,
} from "~/core/lib/constants";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: PlanType;
  billingInterval: BillingInterval | null;
  billingCurrency: Currency | null;
  startedAt: string;
  endsAt: string | null;
  paidAmount: number | null;  // Actual paid amount from DB
  onConfirm: () => void;
}

/**
 * Calculate refund amount for yearly subscriptions
 * Uses actual paid amount from DB if available, otherwise falls back to price constants
 */
function calculateRefund(
  planType: PlanType,
  currency: Currency,
  startedAt: string,
  paidAmount: number | null
): {
  yearlyAmount: number;
  monthlyPrice: number;
  usedMonths: number;
  deduction: number;
  refundAmount: number;
} {
  // Only starter, pro, enterprise have prices - trial/free return 0
  const priceablePlan = planType as keyof typeof PLAN_PRICES;
  const monthlyPrice = Math.round(
    (PLAN_PRICES[priceablePlan]?.monthly ?? 0) * EXCHANGE_RATES[currency]
  );
  
  // Use actual paid amount from DB if available, otherwise calculate from constants
  const yearlyAmount = paidAmount ?? Math.round(
    (PLAN_PRICES[priceablePlan]?.yearly ?? 0) * EXCHANGE_RATES[currency]
  );

  // Calculate used months (rounded up)
  const startDate = new Date(startedAt);
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const usedMonths = Math.max(1, Math.ceil(diffDays / 30));

  // Calculate deduction and refund
  const deduction = monthlyPrice * usedMonths;
  const refundAmount = Math.max(0, yearlyAmount - deduction);

  return {
    yearlyAmount,
    monthlyPrice,
    usedMonths,
    deduction,
    refundAmount,
  };
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
  planType,
  billingInterval,
  billingCurrency,
  startedAt,
  endsAt,
  paidAmount,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "planInfo.cancelDialog" });

  const isYearly = billingInterval === "yearly";
  const currency = billingCurrency || "KRW";
  const planLabel = PLAN_TYPE_LABEL[planType];

  // Calculate refund for yearly plans using actual paid amount from DB
  const refund = useMemo(() => {
    if (!isYearly) return null;
    return calculateRefund(planType, currency, startedAt, paidAmount);
  }, [isYearly, planType, currency, startedAt, paidAmount]);

  const formattedEndsAt = formatDate(endsAt, i18n.language);

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

        <DialogFooter className="gap-3">
          <NexButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            {t("buttons.cancel")}
          </NexButton>
          <NexButton
            variant="primary"
            onClick={onConfirm}
            className="cursor-pointer bg-red-600 hover:bg-red-700"
          >
            {t("buttons.confirm")}
          </NexButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
