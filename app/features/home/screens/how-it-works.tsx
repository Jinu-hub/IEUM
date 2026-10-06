/**
 * How it Works – IEUM Usage Guide
 *
 * IEUMの使い方を4ステップで説明するページ。
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
import React, { useMemo, useState } from "react";
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
  NexCarousel,
  NexCarouselItem,
  NexHero,
  NexImageCard,
} from "~/core/components/nex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
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
    { title: pageData?.title ?? "How it Works | IEUM" },
    {
      name: "description",
      content:
        pageData?.description ??
        "Learn how IEUM works: Connect integrations, configure targets, generate newsletters, and share with your team.",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);
  return {
    title: t("howItWorks.meta.title", {
      defaultValue: "How it Works | IEUM",
    }),
    description: t("howItWorks.meta.description", {
      defaultValue:
        "Learn how IEUM works: Connect integrations, configure targets, generate newsletters, and share with your team.",
    }),
  };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

type PreviewSlide = {
  key: string;
  title: string;
  description: string;
};

const ONBOARDING_IMAGE_KEYS = [
  "1_login",
  "2_connect",
  "3_configure",
  "4_finish",
  "5_generate",
  "6_after_mail",
  "7_analytics",
] as const;

function getLocaleSuffix(lang: string): string {
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ko")) return "ko";
  return "en";
}

export default function HowItWorks({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);

  const localeSuffix = getLocaleSuffix(i18n.language);

  const PREVIEW_SLIDES: PreviewSlide[] = useMemo(
    () =>
      ONBOARDING_IMAGE_KEYS.map((key) => ({
        key,
        title: t(`howItWorks.preview.slides.${key}.title`),
        description: t(`howItWorks.preview.slides.${key}.description`),
      })),
    [t]
  );

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
            onClick: () => setPreviewOpen(true),
          },
          secondary: {
            label: t("howItWorks.hero.secondaryButton"),
            variant: "secondary",
            href: "/join",
          },
        }}
        media={{
          type: "image",
          src: "/images/how-it-works-hero.jpg",
          alt: t("howItWorks.hero.subtitle"),
          width: 600,
          height: 400,
          objectFit: "cover",
          fetchPriority: "high",
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
                onClick={() => setPreviewOpen(true)}
              >
                {t("howItWorks.cta.samplesButton")}
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
                onClick={() => navigate("/join")}
              >
                {t("howItWorks.cta.startButton")}
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>

      {/* Setup Flow Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl w-[92vw] p-0 gap-0 max-h-[95vh] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
            <DialogTitle className="text-lg">
              {t("howItWorks.preview.title")}
            </DialogTitle>
            <DialogDescription>
              {t("howItWorks.preview.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4 overflow-y-auto min-h-0 flex-1">
            <NexCarousel
              showDots
              showArrows
              spaceBetween={0}
              infinite={false}
              className="w-full"
            >
              {PREVIEW_SLIDES.map((slide, index) => (
                <NexCarouselItem key={slide.key}>
                  <div className="space-y-3 px-6">
                    {/* eslint-disable-next-line jsx-a11y/alt-text 
                    <div className="overflow-hidden rounded-xl border border-border/40 shadow-sm mx-auto max-w-[960px] bg-muted/20">
                      <img
                        src={`/onboarding/${slide.key}_${localeSuffix}.png`}
                        alt={slide.title}
                        className="w-full h-auto object-contain"
                        draggable={false}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                    <div className="text-center px-4 pb-1">
                      <p className="text-xs font-medium text-primary mb-1">
                        {index + 1} / {PREVIEW_SLIDES.length}
                      </p>
                      <p className="text-base font-semibold">{slide.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {slide.description}
                      </p>
                    </div>
                    */}
                  <NexImageCard
                    image={{
                      src: `/onboarding/${slide.key}_${localeSuffix}.png`,
                      alt: slide.title,
                      aspectRatio: "video"
                    }}
                    title={slide.title}
                    description={
                      slide.description
                        .split(/<br\s*\/?>/i)
                        .map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))
                    }
                    badge={{ text: `${index + 1} / ${PREVIEW_SLIDES.length}`, variant: "secondary" }}
                    //hoverable
                  />
                  </div>
                </NexCarouselItem>
              ))}
            </NexCarousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
