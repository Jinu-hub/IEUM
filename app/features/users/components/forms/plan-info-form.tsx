import { ArrowUpRight, Calendar, Clock, Crown, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardFooter,
  NexCardHeader,
  NexCardTitle,
} from "~/core/components/nex";
import type { BillingInterval, PlanType, SubscriptionMode, SubscriptionStatus } from "~/core/lib/constants";
import { PLAN_TYPE_LABEL } from "~/core/lib/constants";
import type { Currency } from "~/core/prompts/types";
import CancelSubscriptionDialog from "../dialogs/cancel-subscription-dialog";

interface PlanSectionProps {
  subscription: {
    subscription_id: string;
    plan_type: string;
    status: string;
    mode: string;
    started_at: string;
    ends_at: string | null;
    trial_ends_at: string | null;
    billing_interval: string | null;
    billing_currency: string | null;
    payments: {
      total_amount: number;
    } | null;
  } | null;
}

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  trial: <Clock className="size-5" />,
  free: <Zap className="size-5" />,
  starter: <Sparkles className="size-5" />,
  pro: <Crown className="size-5" />,
  enterprise: <Crown className="size-5" />,
};

const STATUS_BADGE_VARIANT: Record<SubscriptionStatus, "success" | "warning" | "error" | "info" | "secondary"> = {
  trialing: "info",
  active: "success",
  paused: "warning",
  expired: "error",
  canceled: "secondary",
};

function formatDate(dateString: string | null | undefined, locale: string = "en-US"): string {
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

function getDaysRemaining(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const endDate = new Date(dateString);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export default function PlanSection({ subscription }: PlanSectionProps) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "planInfo" });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // デフォルト値（サブスクリプションがない場合）+ type casting for DB values
  const subscriptionId = subscription?.subscription_id ?? null;
  const planType = (subscription?.plan_type ?? "free") as PlanType;
  const status = (subscription?.status ?? "active") as SubscriptionStatus;
  const mode = (subscription?.mode ?? "free") as SubscriptionMode;
  const trialEndsAt = subscription?.trial_ends_at;
  const endsAt = subscription?.ends_at;
  const startedAt = subscription?.started_at ?? new Date().toISOString();
  const billingInterval = (subscription?.billing_interval ?? null) as BillingInterval | null;
  const billingCurrency = (subscription?.billing_currency ?? null) as Currency | null;
  const paidAmount = subscription?.payments?.total_amount ?? null;

  const isPaidPlan = mode === "paid";
  const isTrialing = status === "trialing";
  const isFreePlan = mode === "free";
  const isActive = status === "active";
  const isExpired = status === "expired";
  const isCanceled = status === "canceled";
  const daysRemaining = isTrialing ? getDaysRemaining(trialEndsAt) : getDaysRemaining(endsAt);

  return (
      <NexCard variant="elevated" padding="lg" className="w-full max-w-screen-md">
      <NexCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-3 shadow-lg">
            {PLAN_ICONS[planType]}
          </div>
          <div>
            <NexCardTitle>{t("title")}</NexCardTitle>
            <NexCardDescription>{t("description")}</NexCardDescription>
          </div>
        </div>
      </NexCardHeader>
      <NexCardContent>
        <div className="flex flex-col gap-6">
          {/* Current Plan Display */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {PLAN_TYPE_LABEL[planType]}
                </span>
                <NexBadge variant={STATUS_BADGE_VARIANT[status]} size="sm">
                  {t(`status.${status}`)}
                </NexBadge>
              </div>
              {isTrialing && daysRemaining !== null && (
                <span className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Clock className="size-4" />
                  {t("trialRemaining", { days: daysRemaining })}
                </span>
              )}
              {!isTrialing && endsAt && daysRemaining !== null && (
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="size-4" />
                  {t("validUntil", { date: formatDate(endsAt, i18n.language) })}
                </span>
              )}
            </div>
            {!isPaidPlan && (
              <Link to="/payments/billing-country?plan=starter">
                <NexButton
                  variant="gradient"
                  size="md"
                  className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                  rightIcon={<ArrowUpRight className="size-4" />}
                >
                  {t("upgradeToStarter")}
                </NexButton>
              </Link>
            )}
          </div>

          {/* Plan Details */}
          {!isExpired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("startDate")}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(subscription?.started_at ?? null, i18n.language)}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {isTrialing ? t("trialEndDate") : isCanceled ? t("planEndDate") : t("nextRenewalDate")}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isTrialing ? formatDate(trialEndsAt, i18n.language) : formatDate(endsAt, i18n.language)}
                </span>
              </div>
            </div>
          )}

          {/* Upgrade Prompt for Free/Trial users */}
          {!isPaidPlan && (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20">
              <Sparkles className="size-8 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {t("upgradePrompt.title")}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  {t("upgradePrompt.description")}
                </p>
              </div>
            </div>
          )}
          {isExpired && (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20">
              <Sparkles className="size-8 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {t("renewPrompt.title")}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  {t("renewPrompt.description")}
                </p>
              </div>
            </div>
          )}
        </div>
      </NexCardContent>
      <NexCardFooter className="flex flex-col sm:flex-row gap-3">
        <Link to="/pricing" className="flex-1">
          <NexButton variant="secondary" size="md" className="w-full cursor-pointer">
            {t("comparePlans")}
          </NexButton>
        </Link>
        {!isTrialing && !isFreePlan && (
          <Link to="/dashboard/payments" className="flex-1">
            <NexButton variant="secondary" size="md" className="w-full cursor-pointer">
              {t("managePayments")}
            </NexButton>
          </Link>
        )}
        {isActive && isPaidPlan && (
          <div className="flex-1">
            <NexButton
              variant="secondary"
              size="md"
              className="w-full cursor-pointer"
              onClick={() => setCancelDialogOpen(true)}
            >
              {t("cancelSubscription")}
            </NexButton>
          </div>
        )}
        {isExpired && (
          <Link to="/payments/billing-country?plan=starter" className="flex-1">
            <div className="flex-1">
              <NexButton variant="secondary" 
                size="md" 
                className="w-full cursor-pointer"
              >
                {t("renewSubscription")}
              </NexButton>
            </div>
          </Link>
        )}
      </NexCardFooter>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        subscriptionId={subscriptionId}
        planType={planType}
        billingInterval={billingInterval}
        billingCurrency={billingCurrency}
        startedAt={startedAt}
        endsAt={endsAt ?? null}
        paidAmount={paidAmount}
      />
    </NexCard>
  );
}
