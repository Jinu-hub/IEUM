/**
 * How it Works – NexLetter Usage Guide
 *
 * NexLetterの使い方を4ステップで説明するページ。
 * - Connect → Configure → Generate → Share
 * - Slack / GitHub インテグレーションの実際の動作
 * - Slack 接続手順の詳細
 * - CTA（/join へ）
 * - サポート・プライバシー
 * ログイン不要で公開。
 */

import type { Route } from "./+types/how-it-works";

import type { LucideIcon } from "lucide-react";
import {
  Database,
  GitBranch,
  Link2,
  MessageSquare,
  Rocket,
  Settings,
  Share2,
  Shield,
  SlackIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
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
} from "~/core/components/nex";
import i18next from "~/core/lib/i18next.server";

type IconCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  detail?: string;
};

type StepCard = IconCard & {
  step: string;
};

type IntegrationCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
};

export const meta: Route.MetaFunction = ({ data }) => {
  const pageData = data as LoaderData | undefined;
  return [
    { title: pageData?.title ?? "How it Works | NexLetter" },
    {
      name: "description",
      content:
        pageData?.description ??
        "Learn how NexLetter works: Connect integrations, configure targets, generate newsletters, and share with your team.",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);
  return {
    title: t("howItWorks.meta.title", {
      defaultValue: "How it Works | NexLetter",
    }),
    description: t("howItWorks.meta.description", {
      defaultValue:
        "Learn how NexLetter works: Connect integrations, configure targets, generate newsletters, and share with your team.",
    }),
  };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function HowItWorks({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STEPS: StepCard[] = useMemo(
    () => [
      {
        step: t("howItWorks.steps.items.connect.step"),
        icon: Link2,
        title: t("howItWorks.steps.items.connect.title"),
        description: t("howItWorks.steps.items.connect.description"),
        detail: t("howItWorks.steps.items.connect.detail"),
      },
      {
        step: t("howItWorks.steps.items.configure.step"),
        icon: Settings,
        title: t("howItWorks.steps.items.configure.title"),
        description: t("howItWorks.steps.items.configure.description"),
        detail: t("howItWorks.steps.items.configure.detail"),
      },
      {
        step: t("howItWorks.steps.items.generate.step"),
        icon: Sparkles,
        title: t("howItWorks.steps.items.generate.title"),
        description: t("howItWorks.steps.items.generate.description"),
        detail: t("howItWorks.steps.items.generate.detail"),
      },
      {
        step: t("howItWorks.steps.items.share.step"),
        icon: Share2,
        title: t("howItWorks.steps.items.share.title"),
        description: t("howItWorks.steps.items.share.description"),
        detail: t("howItWorks.steps.items.share.detail"),
      },
    ],
    [t]
  );

  const INTEGRATIONS: IntegrationCard[] = useMemo(
    () => [
      {
        icon: SlackIcon,
        title: t("howItWorks.integrations.slack.title"),
        description: t("howItWorks.integrations.slack.description"),
        features: t("howItWorks.integrations.slack.features", {
          returnObjects: true,
        }) as string[],
      },
      {
        icon: GitBranch,
        title: t("howItWorks.integrations.github.title"),
        description: t("howItWorks.integrations.github.description"),
        features: t("howItWorks.integrations.github.features", {
          returnObjects: true,
        }) as string[],
      },
    ],
    [t]
  );

  const SLACK_STEPS = useMemo(
    () =>
      t("howItWorks.slackSetup.steps", { returnObjects: true }) as string[],
    [t]
  );

  const SLACK_FEATURES: IconCard[] = useMemo(
    () => [
      {
        icon: MessageSquare,
        title: t("howItWorks.slackSetup.features.workspace.title"),
        description: t("howItWorks.slackSetup.features.workspace.description"),
      },
      {
        icon: Database,
        title: t("howItWorks.slackSetup.features.channels.title"),
        description: t("howItWorks.slackSetup.features.channels.description"),
      },
      {
        icon: Shield,
        title: t("howItWorks.slackSetup.features.readonly.title"),
        description: t("howItWorks.slackSetup.features.readonly.description"),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-16">
      {/* Hero */}
      <NexHero
        variant="split"
        title={t("howItWorks.hero.title")}
        subtitle={t("howItWorks.hero.subtitle")}
        description={t("howItWorks.hero.description")}
        actions={{
          primary: {
            label: t("howItWorks.hero.primaryButton"),
            variant: "primary",
            href: "/join",
          },
          secondary: {
            label: t("howItWorks.hero.secondaryButton"),
            variant: "secondary",
            href: "/samples",
          },
        }}
        media={{
          type: "image",
          src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=900&fit=crop",
        }}
      />

      {/* 4ステップ概要: Connect → Configure → Generate → Share */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="info">{t("howItWorks.steps.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("howItWorks.steps.title")}</h2>
          <p className="text-muted-foreground">
            {t("howItWorks.steps.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {STEPS.map((stepCard) => {
            const Icon = stepCard.icon;
            return (
              <NexCard key={stepCard.title} variant="outlined">
                <NexCardContent className="space-y-2.5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-primary">
                        {stepCard.step}
                      </span>
                      <p className="text-base font-semibold leading-tight">
                        {stepCard.title}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {stepCard.description}
                  </p>
                  {stepCard.detail ? (
                    <p className="text-sm text-muted-foreground leading-snug">
                      {stepCard.detail}
                    </p>
                  ) : null}
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      {/* インテグレーション詳細: Slack & GitHub */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="secondary">
            {t("howItWorks.integrations.badge")}
          </NexBadge>
          <h2 className="text-3xl font-bold">
            {t("howItWorks.integrations.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("howItWorks.integrations.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <NexCard
                key={integration.title}
                variant="elevated"
                hoverable
              >
                <NexCardHeader className="flex flex-row items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <NexCardTitle>{integration.title}</NexCardTitle>
                    <NexCardDescription>
                      {integration.description}
                    </NexCardDescription>
                  </div>
                </NexCardHeader>
                <NexCardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {integration.features.map(
                      (feature: string, index: number) => (
                        <li key={index}>• {feature}</li>
                      )
                    )}
                  </ul>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      {/* Slack接続の詳細 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexBadge variant="warning">
              {t("howItWorks.slackSetup.badge")}
            </NexBadge>
            <NexCardTitle>{t("howItWorks.slackSetup.title")}</NexCardTitle>
            <NexCardDescription>
              {t("howItWorks.slackSetup.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            {SLACK_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="rounded-2xl bg-muted p-3 dark:bg-muted/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </NexCardContent>
        </NexCard>

        <NexCard variant="elevated">
          <NexCardHeader>
            <NexCardTitle className="flex items-center gap-2">
              <SlackIcon className="h-5 w-5 text-primary" />
              <span>{t("howItWorks.slackSetup.connectionTitle")}</span>
            </NexCardTitle>
            <NexCardDescription>
              {t("howItWorks.slackSetup.connectionDescription")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-3">
            <ol className="space-y-3 text-sm text-muted-foreground">
              {SLACK_STEPS.map((step: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground italic">
              {t("howItWorks.slackSetup.note")}
            </p>
          </NexCardContent>
        </NexCard>
      </section>

      {/* サポート・プライバシー */}
      <section className="space-y-6">
        <div className="text-center space-y-3">
          <NexBadge variant="outline">
            {t("howItWorks.legal.badge")}
          </NexBadge>
          <h2 className="text-xl font-bold md:text-2xl">
            {t("howItWorks.legal.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <NexCard variant="outlined" hoverable className="h-full">
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="w-fit rounded-2xl bg-primary/10 p-3">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <NexCardTitle>
                  {t("howItWorks.legal.support.title")}
                </NexCardTitle>
                <NexCardDescription>
                  {t("howItWorks.legal.support.description")}
                </NexCardDescription>
                <NexButton
                  variant="secondary"
                  size="sm"
                  className="mt-3 cursor-pointer"
                  onClick={() => navigate("/contact")}
                >
                  {t("howItWorks.legal.support.contact")}
                </NexButton>
              </div>
            </NexCardHeader>
          </NexCard>
          <NexCard variant="outlined" hoverable className="h-full">
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="w-fit rounded-2xl bg-primary/10 p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <NexCardTitle>
                  {t("howItWorks.legal.privacy.title")}
                </NexCardTitle>
                <NexCardDescription>
                  {t("howItWorks.legal.privacy.description")}
                </NexCardDescription>
                <NexButton
                  variant="secondary"
                  size="sm"
                  className="mt-3 cursor-pointer"
                  onClick={() => navigate("/legal/privacy-policy")}
                >
                  {t("howItWorks.legal.privacy.link")}
                </NexButton>
              </div>
            </NexCardHeader>
          </NexCard>
        </div>
      </section>

      {/* CTA */}
      <section>
        <NexCard
          variant="elevated"
          className="p-8 shadow-xl shadow-primary/10 dark:bg-gradient-to-br dark:from-[#151822] dark:via-[#10121A] dark:to-[#0D0E10]"
        >
          <NexCardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <NexBadge variant="info">
                    {t("howItWorks.cta.badge")}
                  </NexBadge>
                </div>
              </div>
              <h3 className="text-3xl font-bold">
                {t("howItWorks.cta.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("howItWorks.cta.description")}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton
                variant="primary"
                className="cursor-pointer"
                size="lg"
                onClick={() => navigate("/join")}
              >
                {t("howItWorks.cta.startButton")}
              </NexButton>
              <NexButton
                variant="secondary"
                className="cursor-pointer"
                size="lg"
                onClick={() => navigate("/about")}
              >
                {t("howItWorks.cta.aboutButton")}
              </NexButton>
              <NexButton
                variant="gradient"
                className="cursor-pointer"
                size="lg"
                onClick={() => navigate("/samples")}
              >
                {t("howItWorks.cta.samplesButton")}
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}
