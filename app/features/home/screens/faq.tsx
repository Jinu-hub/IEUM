import type { Route } from "./+types/faq";

import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Headphones,
  HelpCircle,
  Rocket,
  Shield,
  Sparkles,
  Timer
} from "lucide-react";
import { useMemo, useState, type ComponentType, type SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

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
import { cn } from "~/core/lib/utils";

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title ?? "IEUM FAQ" },
    {
      name: "description",
      content: data?.description ?? "도입 전에 가장 자주 묻는 질문들을 한 곳에서 확인하세요."
    }
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);

  return {
    // metaタグ用のみ保持
    title: t("faq.title", { defaultValue: "자주 묻는 질문" }),
    description: t("faq.description", { defaultValue: "도입 전에 가장 자주 묻는 질문들을 한 곳에서 확인하세요." })
  };
}

type FAQ = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};

type FAQCategory = {
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  questions: FAQ[];
};

export default function FAQ({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((prev) => (prev === id ? null : id));
  };

  const quickStats = useMemo(
    () => [
      {
        value: t("faq.quickStats.fastResponse.value"),
        label: t("faq.quickStats.fastResponse.label"),
        description: t("faq.quickStats.fastResponse.description"),
        color: "text-[#5E6AD2]"
      },
      {
        value: t("faq.quickStats.realQuestions.value"),
        label: t("faq.quickStats.realQuestions.label"),
        description: t("faq.quickStats.realQuestions.description"),
        color: "text-[#22C55E]"
      },
      {
        value: t("faq.quickStats.earlyUsers.value"),
        label: t("faq.quickStats.earlyUsers.label"),
        description: t("faq.quickStats.earlyUsers.description"),
        color: "text-[#F97316]"
      }
    ],
    [t]
  );

  const categories: FAQCategory[] = useMemo(
    () => [
      {
        name: t("faq.categories.onboarding.name"),
        description: t("faq.categories.onboarding.description"),
        icon: HelpCircle,
        questions: [
          {
            id: "onboarding-1",
            question: t("faq.categories.onboarding.questions.service.question"),
            answer: t("faq.categories.onboarding.questions.service.answer"),
            tags: ["Service", "Overview"]
          },
          {
            id: "onboarding-2",
            question: t("faq.categories.onboarding.questions.trial.question"),
            answer: t("faq.categories.onboarding.questions.trial.answer"),
            tags: ["Onboarding", "Trial"]
          },
          {
            id: "onboarding-3",
            question: t("faq.categories.onboarding.questions.duration.question"),
            answer: t("faq.categories.onboarding.questions.duration.answer"),
            tags: ["Onboarding", "Duration"]
          },
          {
            id: "onboarding-4",
            question: t("faq.categories.onboarding.questions.usage.question"),
            answer: t("faq.categories.onboarding.questions.usage.answer"),
            tags: ["Usage", "Customization"]
          }
        ]
      },
      {
        name: t("faq.categories.integration.name"),
        description: t("faq.categories.integration.description"),
        icon: Database,
        questions: [
          {
            id: "integration-1",
            question: t("faq.categories.integration.questions.dataCollection.question"),
            answer: t("faq.categories.integration.questions.dataCollection.answer"),
            tags: ["Integration", "GitHub", "Slack"]
          },
          {
            id: "integration-2",
            question: t("faq.categories.integration.questions.dataStorage.question"),
            answer: t("faq.categories.integration.questions.dataStorage.answer"),
            tags: ["Data", "Storage"]
          },
          {
            id: "integration-3",
            question: t("faq.categories.integration.questions.sensitiveData.question"),
            answer: t("faq.categories.integration.questions.sensitiveData.answer"),
            tags: ["Security", "Privacy"]
          }
        ]
      },
      {
        name: t("faq.categories.ai.name"),
        description: t("faq.categories.ai.description"),
        icon: Sparkles,
        questions: [
          {
            id: "ai-1",
            question: t("faq.categories.ai.questions.summary.question"),
            answer: t("faq.categories.ai.questions.summary.answer"),
            tags: ["AI", "Summary"]
          },
          {
            id: "ai-2",
            question: t("faq.categories.ai.questions.delivery.question"),
            answer: t("faq.categories.ai.questions.delivery.answer"),
            tags: ["Newsletter", "Output"]
          },
          {
            id: "ai-3",
            question: t("faq.categories.ai.questions.dashboard.question"),
            answer: t("faq.categories.ai.questions.dashboard.answer"),
            tags: ["Dashboard", "Viewer"]
          }
        ]
      },
      {
        name: t("faq.categories.security.name"),
        description: t("faq.categories.security.description"),
        icon: Shield,
        questions: [
          {
            id: "security-1",
            question: t("faq.categories.security.questions.protection.question"),
            answer: t("faq.categories.security.questions.protection.answer"),
            tags: ["Security", "RLS"]
          },
          {
            id: "security-2",
            question: t("faq.categories.security.questions.externalTransfer.question"),
            answer: t("faq.categories.security.questions.externalTransfer.answer"),
            tags: ["Privacy", "ExternalAPI"]
          }
        ]
      },
      {
        name: t("faq.categories.pricing.name"),
        description: t("faq.categories.pricing.description"),
        icon: CreditCard,
        questions: [
          {
            id: "pricing-1",
            question: t("faq.categories.pricing.questions.plans.question"),
            answer: t("faq.categories.pricing.questions.plans.answer"),
            tags: ["Pricing", "Plan"]
          },
          {
            id: "pricing-2",
            question: t("faq.categories.pricing.questions.recipients.question"),
            answer: t("faq.categories.pricing.questions.recipients.answer"),
            tags: ["Pricing", "Users"]
          }
        ]
      },
      {
        name: t("faq.categories.automation.name"),
        description: t("faq.categories.automation.description"),
        icon: Timer,
        questions: [
          {
            id: "automation-1",
            question: t("faq.categories.automation.questions.schedule.question"),
            answer: t("faq.categories.automation.questions.schedule.answer"),
            tags: ["Automation", "Schedule"]
          },
          {
            id: "automation-2",
            question: t("faq.categories.automation.questions.filtering.question"),
            answer: t("faq.categories.automation.questions.filtering.answer"),
            tags: ["Target", "Filter"]
          }
        ]
      },
      {
        name: t("faq.categories.support.name"),
        description: t("faq.categories.support.description"),
        icon: Headphones,
        questions: [
          {
            id: "support-1",
            question: t("faq.categories.support.questions.help.question"),
            answer: t("faq.categories.support.questions.help.answer"),
            tags: ["Support", "Onboarding"]
          },
          {
            id: "support-2",
            question: t("faq.categories.support.questions.feedback.question"),
            answer: t("faq.categories.support.questions.feedback.answer"),
            tags: ["Support", "Feedback"]
          }
        ]
      },
      {
        name: t("faq.categories.advanced.name"),
        description: t("faq.categories.advanced.description"),
        icon: Rocket,
        questions: [
          {
            id: "advanced-1",
            question: t("faq.categories.advanced.questions.dataSources.question"),
            answer: t("faq.categories.advanced.questions.dataSources.answer"),
            tags: ["Integration", "Advanced"]
          },
          {
            id: "advanced-2",
            question: t("faq.categories.advanced.questions.features.question"),
            answer: t("faq.categories.advanced.questions.features.answer"),
            tags: ["Roadmap", "Future"]
          }
        ]
      }
    ],
    [t]
  );
  
  const resourceLinks = useMemo(
    () => [
      {
        title: t("faq.recommendedResources.links.pricing.title"),
        description: t("faq.recommendedResources.links.pricing.description"),
        href: "/pricing"
      },
      {
        title: t("faq.recommendedResources.links.security.title"),
        description: t("faq.recommendedResources.links.security.description"),
        href: "/legal/security-whitepaper"
      },
      {
        title: t("faq.recommendedResources.links.samples.title"),
        description: t("faq.recommendedResources.links.samples.description"),
        href: "/samples"
      }
    ],
    [t]
  );

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title={t("faq.title")}
        subtitle={t("faq.subtitle")}
        description={t("faq.heroDescription")}
        actions={{
          primary: {
            label: t("faq.contactButton"),
            variant: "primary",
            href: "/contact"
          },
          secondary: {
            label: t("faq.startTrialButton"),
            variant: "secondary",
            href: "/join"
          }
        }}
        media={{
          type: "image",
          src: "/images/faq-hero.jpg",
          alt: t("faq.subtitle"),
          width: 600,
          height: 400,
          fetchPriority: "high",
        }}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {quickStats.map((stat) => (
          <NexCard key={stat.label} variant="outlined" hoverable>
            <NexCardContent className="space-y-2 p-6">
              <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-base font-semibold">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </NexCardContent>
          </NexCard>
        ))}
      </section>

      <section className="space-y-10">
        <div className="text-center">
          <NexBadge variant="info">{t("faq.categoryBadge")}</NexBadge>
          <h2 className="mt-4 text-3xl font-bold">{t("faq.categoryTitle")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("faq.categoryDescription", { count: categories.reduce((acc, curr) => acc + curr.questions.length, 0) })}
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <NexCard key={category.name} variant="outlined" hoverable>
                <NexCardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <NexCardTitle>{category.name}</NexCardTitle>
                        <NexCardDescription>{category.description}</NexCardDescription>
                      </div>
                    </div>
                    <NexBadge variant="secondary">{category.questions.length}{t("faq.questionsCount")}</NexBadge>
                  </div>
                </NexCardHeader>
                <NexCardContent className="space-y-4">
                  {category.questions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-[#E1E4E8] bg-white p-4 transition hover:border-[#5E6AD2] dark:border-[#2C2D30] dark:bg-[#0F1116]"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 text-left"
                        onClick={() => toggleQuestion(question.id)}
                        aria-expanded={openQuestionId === question.id}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <div className="rounded-xl bg-muted p-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{question.question}</p>
                            {question.tags && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {question.tags.map((tag) => (
                                  <NexBadge key={tag} variant="secondary" size="sm">
                                    {tag}
                                  </NexBadge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition",
                            openQuestionId === question.id && "rotate-180 text-primary"
                          )}
                        />
                      </button>
                      {openQuestionId === question.id && (
                        <p
                          className="mt-4 text-sm leading-relaxed text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: question.answer }}
                        />
                      )}
                    </div>
                  ))}
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      {/*<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">*/}
      <section className="space-y-10">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>{t("faq.recommendedResources.title")}</NexCardTitle>
            <NexCardDescription>
              {t("faq.recommendedResources.description")}
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            {resourceLinks.map((resource) => (
              <Link
                key={resource.title}
                to={resource.href}
                className="flex items-center justify-between rounded-xl border border-[#E1E4E8] px-4 py-3 transition hover:border-[#5E6AD2] hover:bg-[#F8F9FA] dark:border-[#2C2D30] dark:hover:bg-[#1A1B1E]"
              >
                <div>
                  <p className="font-semibold">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
                <ChevronDown className="h-4 w-4 -rotate-90 text-primary" />
              </Link>
            ))}
          </NexCardContent>
        </NexCard>
{/*
        <NexCard variant="outlined" className="h-full">
          <NexCardHeader>
            <NexCardTitle>도움이 필요하신가요?</NexCardTitle>
            <NexCardDescription>
              아래 채널로 문의 주시면 평균 2시간 이내에 답변 드립니다.
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            {[
              {
                icon: Mail,
                title: "이메일 지원",
                detail: "support@nexletter.app",
                helper: "업무일 기준 09:00~18:00 (KST)"
              },
              {
                icon: Users,
                title: "Slack Connect 채널",
                detail: "도입 상담 후 초대 링크 제공",
                helper: "엔터프라이즈 고객 전용"
              },
              {
                icon: Zap,
                title: "긴급 장애 대응",
                detail: "+82-2-1234-5678",
                helper: "24/7 온콜 엔지니어"
              }
            ].map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.title}
                  className="flex items-start gap-4 rounded-2xl border border-dashed border-[#E1E4E8] p-4 dark:border-[#2C2D30]"
                >
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{channel.title}</p>
                    <p className="text-sm">{channel.detail}</p>
                    <p className="text-xs text-muted-foreground">{channel.helper}</p>
                  </div>
                </div>
              );
            })}
            <NexButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/contact")}
            >
              문의 남기기
            </NexButton>
          </NexCardContent>
        </NexCard>
      */}
      </section>

      <section className="text-center">
        <NexCard
          variant="elevated"
          className="p-10 shadow-xl shadow-primary/10 dark:bg-gradient-to-br dark:from-[#151822] dark:via-[#10121A] dark:to-[#0D0E10]"
        >
          <NexCardContent className="space-y-6">
            <div className="space-y-3">
              <NexBadge variant="success">{t("faq.cta.badge")}</NexBadge>
              <h3 className="text-3xl font-bold">
                {t("faq.cta.title")}
              </h3>
              <p className="text-muted-foreground">{t("faq.cta.description")}</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
                {t("faq.cta.startButton")}
              </NexButton>
              <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/contact")}>
                {t("faq.cta.contactButton")}
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>

    </div>
  );
}

