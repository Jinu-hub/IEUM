import { ArrowUpRight, Calendar, Clock, Crown, Sparkles, Zap } from "lucide-react";
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
import type { PlanType, SubscriptionMode, SubscriptionStatus } from "~/core/lib/constants";
import { PLAN_TYPE_LABEL } from "~/core/lib/constants";

interface PlanSectionProps {
  subscription: {
    plan_type: PlanType;
    status: SubscriptionStatus;
    mode: SubscriptionMode;
    started_at: string;
    ends_at: string | null;
    trial_ends_at: string | null;
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

  // デフォルト値（サブスクリプションがない場合）
  const planType = subscription?.plan_type ?? "free";
  const status = subscription?.status ?? "active";
  const mode = subscription?.mode ?? "free";
  const trialEndsAt = subscription?.trial_ends_at;
  const endsAt = subscription?.ends_at;

  const isTrialing = status === "trialing";
  const isPaidPlan = mode === "paid";
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
              <Link to="/payments/checkout">
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
                {isTrialing ? t("trialEndDate") : t("nextRenewalDate")}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isTrialing ? formatDate(trialEndsAt, i18n.language) : formatDate(endsAt, i18n.language)}
              </span>
            </div>
          </div>

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
        </div>
      </NexCardContent>
      <NexCardFooter className="flex flex-col sm:flex-row gap-3">
        <Link to="/pricing" className="flex-1">
          <NexButton variant="secondary" size="md" className="w-full cursor-pointer">
            {t("comparePlans")}
          </NexButton>
        </Link>
        {isPaidPlan && (
          <>
          <Link to="/dashboard/payments" className="flex-1">
            <NexButton variant="secondary" size="md" className="w-full cursor-pointer">
              {t("managePayments")}
            </NexButton>
          </Link>
          <Link to="/dashboard/payments/cancel" className="flex-1">
            <NexButton variant="secondary" size="md" className="w-full cursor-pointer">
              {t("cancelSubscription")}
            </NexButton>
          </Link>
          </>
        )}
      </NexCardFooter>
    </NexCard>
  );
}
