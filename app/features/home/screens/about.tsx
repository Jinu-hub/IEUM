import type { Route } from "./+types/about";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Database,
  FileText,
  Globe,
  Layers,
  Lock,
  Map,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap
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
  NexHero
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

// HERO_HIGHLIGHTS will be defined inside the component using useMemo

// PAIN_POINTS will be defined inside the component using useMemo

// STORYTELLING_FLOW will be defined inside the component using useMemo

// VALUE_PROPOSITIONS will be defined inside the component using useMemo

// HOW_IT_WORKS will be defined inside the component using useMemo

// PHILOSOPHY_STATEMENTS will be defined inside the component using useMemo

// SECURITY_PROMISES will be defined inside the component using useMemo

// ROADMAP_ITEMS will be defined inside the component using useMemo

export const meta: Route.MetaFunction = (args) => {
  const pageData = args.data as LoaderData | undefined;
  return [
    { title: pageData?.title ?? "NexLetter – About" },
    {
      name: "description",
      content:
        pageData?.subtitle ?? pageData?.description ??
        "팀의 흐름을 기록하는 새로운 방식"
    }
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);

  return {
    title: t("about.title", { defaultValue: "About Us" }),
    subtitle: t("about.subtitle", {
      defaultValue: "팀의 흐름을 기록하는 새로운 방식"
    }),
    description: t("about.description", {
      defaultValue: "팀의 흐름을 기록하는 새로운 방식"
    })
  };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

type AboutProps = {
  loaderData: LoaderData;
};

export default function About({ loaderData }: AboutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const title = loaderData.title;
  const subtitle = loaderData.subtitle;

  const HERO_HIGHLIGHTS: IconCard[] = useMemo(
    () => [
      {
        icon: Activity,
        title: t("about.highlights.story.title"),
        description: t("about.highlights.story.description"),
      },
      {
        icon: Sparkles,
        title: t("about.highlights.ai.title"),
        description: t("about.highlights.ai.description"),
      },
      {
        icon: FileText,
        title: t("about.highlights.space.title"),
        description: t("about.highlights.space.description"),
      },
    ],
    [t]
  );

  const PAIN_POINTS: IconCard[] = useMemo(
    () => [
      {
        icon: Target,
        title: t("about.painPoints.items.tracking.title"),
        description: t("about.painPoints.items.tracking.description"),
        detail: t("about.painPoints.items.tracking.detail"),
      },
      {
        icon: Database,
        title: t("about.painPoints.items.scattered.title"),
        description: t("about.painPoints.items.scattered.description"),
        detail: t("about.painPoints.items.scattered.detail"),
      },
      {
        icon: BookOpen,
        title: t("about.painPoints.items.manual.title"),
        description: t("about.painPoints.items.manual.description"),
        detail: t("about.painPoints.items.manual.detail"),
      },
      {
        icon: Users,
        title: t("about.painPoints.items.context.title"),
        description: t("about.painPoints.items.context.description"),
        detail: t("about.painPoints.items.context.detail"),
      },
    ],
    [t]
  );

  const STORYTELLING_FLOW: IconCard[] = useMemo(
    () => [
      {
        icon: Database,
        title: t("about.storytelling.steps.collect.title"),
        description: t("about.storytelling.steps.collect.description"),
      },
      {
        icon: Layers,
        title: t("about.storytelling.steps.meaning.title"),
        description: t("about.storytelling.steps.meaning.description"),
      },
      {
        icon: Zap,
        title: t("about.storytelling.steps.summarize.title"),
        description: t("about.storytelling.steps.summarize.description"),
      },
      {
        icon: Share2,
        title: t("about.storytelling.steps.reconstruct.title"),
        description: t("about.storytelling.steps.reconstruct.description"),
      },
    ],
    [t]
  );

  const VALUE_PROPOSITIONS: IconCard[] = useMemo(
    () => [
      {
        icon: Zap,
        title: t("about.value.items.time.title"),
        description: t("about.value.items.time.description"),
      },
      {
        icon: Globe,
        title: t("about.value.items.flow.title"),
        description: t("about.value.items.flow.description"),
      },
      {
        icon: Target,
        title: t("about.value.items.risk.title"),
        description: t("about.value.items.risk.description"),
      },
      {
        icon: Share2,
        title: t("about.value.items.spread.title"),
        description: t("about.value.items.spread.description"),
      },
      {
        icon: Users,
        title: t("about.value.items.free.title"),
        description: t("about.value.items.free.description"),
      },
    ],
    [t]
  );

  const HOW_IT_WORKS: StepCard[] = useMemo(
    () => [
      {
        step: t("about.howItWorks.steps.connect.step"),
        icon: Database,
        title: t("about.howItWorks.steps.connect.title"),
        description: t("about.howItWorks.steps.connect.description"),
        detail: t("about.howItWorks.steps.connect.detail"),
      },
      {
        step: t("about.howItWorks.steps.understand.step"),
        icon: Sparkles,
        title: t("about.howItWorks.steps.understand.title"),
        description: t("about.howItWorks.steps.understand.description"),
        detail: t("about.howItWorks.steps.understand.detail"),
      },
      {
        step: t("about.howItWorks.steps.generate.step"),
        icon: FileText,
        title: t("about.howItWorks.steps.generate.title"),
        description: t("about.howItWorks.steps.generate.description"),
        detail: t("about.howItWorks.steps.generate.detail"),
      },
      {
        step: t("about.howItWorks.steps.share.step"),
        icon: Share2,
        title: t("about.howItWorks.steps.share.title"),
        description: t("about.howItWorks.steps.share.description"),
        detail: t("about.howItWorks.steps.share.detail"),
      },
    ],
    [t]
  );

  const PHILOSOPHY_STATEMENTS = useMemo(
    () => t("about.philosophy.statements", { returnObjects: true }) as string[],
    [t]
  );

  const SECURITY_PROMISES: IconCard[] = useMemo(
    () => [
      {
        icon: Shield,
        title: t("about.security.promises.oauth.title"),
        description: t("about.security.promises.oauth.description"),
      },
      {
        icon: Lock,
        title: t("about.security.promises.tls.title"),
        description: t("about.security.promises.tls.description"),
      },
      {
        icon: Database,
        title: t("about.security.promises.vault.title"),
        description: t("about.security.promises.vault.description"),
      },
      {
        icon: Layers,
        title: t("about.security.promises.minimal.title"),
        description: t("about.security.promises.minimal.description"),
      },
      {
        icon: Sparkles,
        title: t("about.security.promises.privacy.title"),
        description: t("about.security.promises.privacy.description"),
      },
    ],
    [t]
  );

  const ROADMAP_ITEMS = useMemo(
    () => t("about.roadmap.items", { returnObjects: true }) as string[],
    [t]
  );

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title={title}
        subtitle={subtitle}
        description={t("about.hero.description")}
        actions={{
          primary: {
            label: t("about.hero.primaryButton"),
            variant: "primary",
            href: "/join"
          },
          secondary: {
            label: t("about.hero.secondaryButton"),
            variant: "secondary",
            href: "/samples"
          }
        }}
        media={{
          type: "image",
          src: "https://images.unsplash.com/photo-1527169402691-feff5539e52c?w=1200&h=900&fit=crop"
        }}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {HERO_HIGHLIGHTS.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <NexCard key={highlight.title} variant="outlined" hoverable>
              <NexCardContent className="flex flex-col gap-3 p-6">
                <div className="w-fit rounded-2xl bg-primary/10 p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-lg font-semibold">{highlight.title}</p>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </NexCardContent>
            </NexCard>
          );
        })}
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="warning">{t("about.painPoints.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("about.painPoints.title")}</h2>
          <p className="text-muted-foreground">
            {t("about.painPoints.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {PAIN_POINTS.map((pain) => {
            const Icon = pain.icon;
            return (
              <NexCard key={pain.title} variant="outlined" hoverable>
                <NexCardHeader className="flex flex-row items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <NexCardTitle>{pain.title}</NexCardTitle>
                    <NexCardDescription>{pain.description}</NexCardDescription>
                  </div>
                </NexCardHeader>
                {pain.detail ? (
                  <NexCardContent>
                    <p className="text-sm text-muted-foreground">{pain.detail}</p>
                  </NexCardContent>
                ) : null}
              </NexCard>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="elevated">
          <NexCardHeader>
            <NexBadge variant="secondary">{t("about.solution.badge")}</NexBadge>
            <NexCardTitle>{t("about.solution.title")}</NexCardTitle>
            <NexCardDescription>
              {t("about.solution.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("about.solution.intro")}</p>
            <ul className="space-y-2">
              {(t("about.solution.points", { returnObjects: true }) as string[]).map((point: string, index: number) => (
                <li key={index}>• {point}</li>
              ))}
            </ul>
            <p>{t("about.solution.conclusion")}</p>
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>{t("about.storytelling.title")}</NexCardTitle>
            <NexCardDescription>{t("about.storytelling.description")}</NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            {STORYTELLING_FLOW.map((flow) => {
              const Icon = flow.icon;
              return (
                <div key={flow.title} className="flex items-start gap-4">
                  <div className="rounded-2xl bg-muted p-3 dark:bg-muted/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{flow.title}</p>
                    <p className="text-sm text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
              );
            })}
          </NexCardContent>
        </NexCard>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="success">{t("about.value.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("about.value.title")}</h2>
          <p className="text-muted-foreground">{t("about.value.description")}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {VALUE_PROPOSITIONS.map((value) => {
            const Icon = value.icon;
            return (
              <NexCard key={value.title} variant="outlined" hoverable>
                <NexCardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-lg font-semibold leading-tight">{value.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="info">{t("about.howItWorks.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("about.howItWorks.title")}</h2>
          <p className="text-muted-foreground">
            {t("about.howItWorks.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {HOW_IT_WORKS.map((stepCard) => {
            const Icon = stepCard.icon;
            return (
              <NexCard key={stepCard.title} variant="outlined">
                <NexCardContent className="space-y-2.5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-primary">{stepCard.step}</span>
                      <p className="text-base font-semibold leading-tight">{stepCard.title}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{stepCard.description}</p>
                  {stepCard.detail ? (
                    <p className="text-sm text-muted-foreground leading-snug">{stepCard.detail}</p>
                  ) : null}
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="warning">{t("about.security.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("about.security.title")}</h2>
          <p className="text-muted-foreground">
            {t("about.security.description")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECURITY_PROMISES.map((promise) => {
            const Icon = promise.icon;
            return (
              <NexCard key={promise.title} variant="outlined" hoverable>
                <NexCardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base font-semibold leading-tight">{promise.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{promise.description}</p>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground">{t("about.security.footer")}</p>
      </section>

      <section className="space-y-6">
        <NexBadge variant="secondary">{t("about.philosophy.badge")}</NexBadge>
        <NexCard variant="outlined">
          <NexCardContent className="space-y-4 p-6">
            <p className="text-lg font-semibold">{t("about.philosophy.intro")}</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {PHILOSOPHY_STATEMENTS.map((statement, index) => (
                <p key={index}>• {statement}</p>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("about.philosophy.conclusion")}
            </p>
          </NexCardContent>
        </NexCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle className="flex items-center gap-2"> 
              <Users className="h-5 w-5 text-primary" />
              <span>{t("about.team.title")}</span>
            </NexCardTitle>
            <NexCardDescription>
              {t("about.team.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("about.team.intro")}</p>
            <ul className="space-y-2">
              {(t("about.team.points", { returnObjects: true }) as string[]).map((point: string, index: number) => (
                <li key={index}>• {point}</li>
              ))}
            </ul>
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader className="flex items-start justify-between">
            <div>
              <NexCardTitle className="flex items-center gap-2"> 
                <Map className="h-5 w-5 text-primary" />
                <span>{t("about.roadmap.title")}</span>
              </NexCardTitle>
              <NexCardDescription>{t("about.roadmap.description")}</NexCardDescription>
            </div>
          </NexCardHeader>
          <NexCardContent className="space-y-2 text-sm text-muted-foreground">
            {ROADMAP_ITEMS.map((item, index) => (
              <p key={index}>• {item}</p>
            ))}
          </NexCardContent>
        </NexCard>
      </section>

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
                  <NexBadge variant="info">{t("about.cta.badge")}</NexBadge>
                </div>
              </div>
              <h3 className="text-3xl font-bold">{t("about.cta.title")}</h3>
              <p className="text-muted-foreground">
                {t("about.cta.description")}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
                {t("about.cta.startButton")}
              </NexButton>
              <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/login")}>
                {t("about.cta.loginButton")}
              </NexButton>
              <NexButton variant="gradient" className="cursor-pointer" size="lg" onClick={() => navigate("/samples")}>
                {t("about.cta.samplesButton")}
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}

