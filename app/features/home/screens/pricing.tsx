import type { Route } from "./+types/pricing";

import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardHeader,
  NexCardTitle,
  NexHero,
  NexToggle
} from "~/core/components/nex";
import i18next from "~/core/lib/i18next.server";
import type { Currency } from "~/core/prompts/types";
import { calculatePrice, getCurrencyLocale } from "~/features/payments/lib/utils";

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title ?? "NexLetter Pricing" },
    {
      name: "description",
      content: data?.subtitle ?? data?.description ?? "팀 규모에 맞춰 유연하게 확장되는 NexLetter 요금제"
    }
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);

  return {
    title: t("pricing.title", {
      defaultValue: "NexLetter - 가격 정책"
    }),
    subtitle: t("pricing.subtitle", {
      defaultValue: "AI 기반 사내 뉴스레터 자동화를 위한 요금제"
    }),
    description: t("pricing.description", {
      defaultValue: "팀 규모에 맞춰 유연하게 확장되는 NexLetter 요금제"
    }),
    discountRate: 0.2
  };
}

type PricingPlan = {
  name: string;
  description: string;
  price: { monthly: number; annual: number };
  seats: string;
  bestFor: string;
  highlighted?: boolean;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error" | "info" | "secondary" | "outline";
  comingSoon?: boolean;
  features: string[];
  cta: string;
};

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [annualBilling, setAnnualBilling] = useState(true);

  const currency: Currency =
    i18n.language === "en" ? "USD" : i18n.language === "ja" ? "JPY" : "KRW";

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(getCurrencyLocale(currency), {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }),
    [currency]
  );

  const plans: PricingPlan[] = useMemo(
    () => [
      {
        name: t("pricing.plans.free.name"),
        description: t("pricing.plans.free.description"),
        price: {
          monthly: calculatePrice("free", "monthly", currency),
          annual: Math.round(calculatePrice("free", "yearly", currency) / 12),
        },
        seats: t("pricing.plans.free.seats"),
        bestFor: t("pricing.plans.free.bestFor"),
        features: t("pricing.plans.free.features", { returnObjects: true }) as string[],
        cta: t("pricing.plans.free.cta"),
      },
      {
        name: t("pricing.plans.starter.name"),
        description: t("pricing.plans.starter.description"),
        price: {
          monthly: calculatePrice("starter", "monthly", currency),
          annual: Math.round(calculatePrice("starter", "yearly", currency) / 12),
        },
        seats: t("pricing.plans.starter.seats"),
        bestFor: t("pricing.plans.starter.bestFor"),
        badge: t("pricing.plans.starter.badge"),
        badgeVariant: "success",
        features: t("pricing.plans.starter.features", { returnObjects: true }) as string[],
        cta: t("pricing.plans.starter.cta"),
      },
      {
        name: t("pricing.plans.pro.name"),
        description: t("pricing.plans.pro.description"),
        price: {
          monthly: calculatePrice("pro", "monthly", currency),
          annual: Math.round(calculatePrice("pro", "yearly", currency) / 12),
        },
        seats: t("pricing.plans.pro.seats"),
        bestFor: t("pricing.plans.pro.bestFor"),
        comingSoon: true,
        badge: t("pricing.plans.pro.badge"),
        badgeVariant: "warning",
        features: t("pricing.plans.pro.features", { returnObjects: true }) as string[],
        cta: t("pricing.plans.pro.cta"),
      },
    ],
    [t, currency]
  );

  const comparisonRows = useMemo(
    () => [
      {
        label: t("pricing.comparison.rows.duration.label"),
        free: t("pricing.comparison.rows.duration.free"),
        starter: t("pricing.comparison.rows.duration.starter"),
        pro: t("pricing.comparison.rows.duration.pro"),
      },
      {
        label: t("pricing.comparison.rows.services.label"),
        free: t("pricing.comparison.rows.services.free"),
        starter: t("pricing.comparison.rows.services.starter"),
        pro: t("pricing.comparison.rows.services.pro"),
      },
      {
        label: t("pricing.comparison.rows.targets.label"),
        free: t("pricing.comparison.rows.targets.free"),
        starter: t("pricing.comparison.rows.targets.starter"),
        pro: t("pricing.comparison.rows.targets.pro"),
      },
      {
        label: t("pricing.comparison.rows.dataSources.label"),
        free: t("pricing.comparison.rows.dataSources.free"),
        starter: t("pricing.comparison.rows.dataSources.starter"),
        pro: t("pricing.comparison.rows.dataSources.pro"),
      },
      {
        label: t("pricing.comparison.rows.tone.label"),
        free: t("pricing.comparison.rows.tone.free"),
        starter: t("pricing.comparison.rows.tone.starter"),
        pro: t("pricing.comparison.rows.tone.pro"),
      },
      {
        label: t("pricing.comparison.rows.template.label"),
        free: t("pricing.comparison.rows.template.free"),
        starter: t("pricing.comparison.rows.template.starter"),
        pro: t("pricing.comparison.rows.template.pro"),
      },
      {
        label: t("pricing.comparison.rows.recipients.label"),
        free: t("pricing.comparison.rows.recipients.free"),
        starter: t("pricing.comparison.rows.recipients.starter"),
        pro: t("pricing.comparison.rows.recipients.pro"),
      },
    ],
    [t]
  );
  

  const faqs = useMemo(
    () => [
      {
        question: t("pricing.faq.questions.trial.question"),
        answer: t("pricing.faq.questions.trial.answer"),
      },
      {
        question: t("pricing.faq.questions.overage.question"),
        answer: t("pricing.faq.questions.overage.answer"),
      },
      {
        question: t("pricing.faq.questions.frequency.question"),
        answer: t("pricing.faq.questions.frequency.answer"),
      },
      {
        question: t("pricing.faq.questions.change.question"),
        answer: t("pricing.faq.questions.change.answer"),
      },
    ],
    [t]
  );
  

  const roiStats = useMemo(
    () => [
      { label: t("pricing.roi.stats.timeSaving"), value: 78, variant: "success" as const },
      { label: t("pricing.roi.stats.reach"), value: 92, variant: "gradient" as const },
      { label: t("pricing.roi.stats.satisfaction"), value: 72, variant: "default" as const },
    ],
    [t]
  );

  const displayPrice = (plan: PricingPlan) => {
    const value = annualBilling ? plan.price.annual : plan.price.monthly;
    return priceFormatter.format(value);
  };

  const getAnnualTotal = (plan: PricingPlan) => {
    return priceFormatter.format(plan.price.annual * 12);
  };

  const getMonthlyTotal = (plan: PricingPlan) => {
    return priceFormatter.format(plan.price.monthly * 12);
  };

  const getSavings = (plan: PricingPlan) => {
    const monthlyTotal = plan.price.monthly * 12;
    const annualTotal = plan.price.annual * 12;
    const savings = monthlyTotal - annualTotal;
    return savings > 0 ? priceFormatter.format(savings) : null;
  };

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title={t("pricing.hero.title")}
        subtitle={t("pricing.hero.subtitle")}
        description={t("pricing.hero.description")}
        actions={{
          primary: {
            label: t("pricing.hero.primaryButton"),
            variant: "primary",
            href: "/join"
          },
          secondary: {
            label: t("pricing.hero.secondaryButton"),
            variant: "secondary",
            href: "/samples"
          }
        }}
        media={{
          type: "image",
          src: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&h=600&fit=crop&auto=format"
        }}
      />

      <section className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <NexBadge variant="info">{t("pricing.badge")}</NexBadge>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <span className="text-sm text-muted-foreground">{t("pricing.billing.monthlyLabel")}</span>
            <NexToggle
              checked={annualBilling}
              label={t("pricing.billing.toggleLabel")}
              onChange={setAnnualBilling}
              size="lg"
            />
          </div>
        </div>

        {/* pricing plans section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isHighlighted = plan.highlighted;
            const isComingSoon = plan.comingSoon;
            return (
              <NexCard
                key={plan.name}
                variant={isHighlighted ? "elevated" : "outlined"}
                className={isHighlighted ? "border-primary shadow-xl" : ""}
                hoverable
              >
                <NexCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <NexCardTitle className="flex items-center gap-2">
                        <span>{plan.name}</span>
                        {plan.badge && (
                          <NexBadge 
                            variant={plan.badgeVariant || "info"} 
                            size="sm"
                          >
                            {plan.badge}
                          </NexBadge>
                        )}
                      </NexCardTitle>
                      <NexCardDescription>{plan.description}</NexCardDescription>
                    </div>
                  </div>
                </NexCardHeader>
                <NexCardContent className="flex h-full flex-col space-y-6">
                  <div>
                    <div className="text-4xl font-bold text-[#5E6AD2] dark:text-[#7C89F9]">
                      {displayPrice(plan)}
                      {annualBilling ? (
                        <span className="text-lg font-normal text-muted-foreground ml-2">
                          (Total {getAnnualTotal(plan)})
                        </span>
                      ) : (
                        t("pricing.billing.perMonth")
                      )}
                    </div>
                    {annualBilling ? (
                      <div className="space-y-1 mt-2">
                        <p className="text-sm text-muted-foreground">
                          {t("pricing.billing.annualPayment")}
                        </p>
                        {getSavings(plan) ? (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {t("pricing.billing.saveAmount")} {getSavings(plan)} ({priceFormatter.format(plan.price.monthly)} × 12)
                          </p>
                        ) : (
                          <p className="text-xs opacity-0">placeholder</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("pricing.billing.monthlyPayment")}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-semibold">{plan.seats}</p>
                    <p className="text-xs text-muted-foreground">{plan.bestFor}</p>
                  </div>
                  <NexButton
                    variant={isHighlighted ? "primary" : "secondary"}
                    size="lg"
                    className="w-full cursor-pointer"
                    disabled={isComingSoon}
                    aria-disabled={isComingSoon}
                    onClick={() => {
                      if (isComingSoon) return;
                      navigate(plan.name === "Scale" ? "/contact" : "/join");
                    }}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NexButton>
                  <ul className="space-y-3 text-sm flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5E6AD2]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <a
            href="/legal/refund-policy"
            className="text-sm text-muted-foreground hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] transition-colors underline"
          >
            {t("pricing.faq.refundPolicyLink")}
          </a>
        </div>
      </section>

      {/* comparison section */}
      <section>
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>{t("pricing.comparison.title")}</NexCardTitle>
            <NexCardDescription>
              {t("pricing.comparison.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-4">{t("pricing.comparison.feature")}</th>
                  <th className="p-4">{t("pricing.comparison.free")}</th>
                  <th className="p-4">{t("pricing.comparison.starter")}</th>
                  <th className="p-4">{t("pricing.comparison.pro")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-t">
                    <td className="p-4 font-medium">{row.label}</td>
                    <td className="p-4 text-muted-foreground">{row.free}</td>
                    <td className="p-4 text-muted-foreground">{row.starter}</td>
                    <td className="p-4 text-muted-foreground">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NexCardContent>
        </NexCard>
      </section>

      {/* roi section */}
      {/* 
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>{t("pricing.roi.title")}</NexCardTitle>
            <NexCardDescription>
              {t("pricing.roi.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            {roiStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{stat.label}</span>
                  <span className="font-semibold">{stat.value}%</span>
                </div>
                <NexProgress value={stat.value} variant={stat.variant} />
              </div>
            ))}
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>{t("pricing.enterprise.title")}</NexCardTitle>
            <NexCardDescription>
              {t("pricing.enterprise.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {(t("pricing.enterprise.features", { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
            <NexButton variant="primary" size="lg" onClick={() => navigate("/contact")}>
              {t("pricing.enterprise.cta")}
            </NexButton>
          </NexCardContent>
        </NexCard>
      </section>
      */}

      {/* faq section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold">{t("pricing.faq.title")}</h2>
          <p className="text-muted-foreground">
            {t("pricing.faq.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <NexCard key={faq.question} variant="outlined" hoverable>
              <NexCardContent className="space-y-2 p-6">
                <p className="text-base font-semibold">{faq.question}</p>
                <div className="text-sm text-muted-foreground">
                  {faq.answer.split('<br />').map((part, index, array) => (
                    <span key={index}>
                      {part}
                      {index < array.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </NexCardContent>
            </NexCard>
          ))}
        </div>
      </section>

      {/* cta section */}
      <section>
        <NexCard
          variant="elevated"
          className="bg-gradient-to-br from-[#F5F7FF] via-white to-[#EEF2FF] dark:from-[#12131A] dark:via-[#1A1B1E] dark:to-[#1F2230]"
        >
          <NexCardContent className="flex flex-col gap-8 p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-[#5E6AD2]">
                {t("pricing.cta.badge")}
              </p>
              <h3 className="text-3xl font-bold">
                <span dangerouslySetInnerHTML={{ __html: t("pricing.cta.title") }} />
              </h3>
              <p className="text-muted-foreground text-sm">
                <span dangerouslySetInnerHTML={{ __html: t("pricing.cta.description", { discount: loaderData.discountRate * 100 }) }} />
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
            <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
              {t("pricing.cta.startButton")}
              <Zap className="ml-2 h-5 w-5" />
            </NexButton>

            <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/contact")}>
              {t("pricing.cta.contactButton")}
              <Mail className="ml-2 h-5 w-5" />
            </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}

