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
    { title: data?.title ?? "Nexletter FAQ" },
    {
      name: "description",
      content: data?.subtitle ?? "도입 전에 가장 자주 묻는 질문들을 한 곳에서 확인하세요."
    }
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);

  return {
    title: t("faq.title", { defaultValue: "자주 묻는 질문" }),
    subtitle: t("faq.subtitle", { defaultValue: "도입·보안·청구 관련 궁금증을 빠르게 해결하세요." })
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
        value: "빠른 응답",
        label: "모든 문의는 사람이 직접 확인합니다",
        description: "평균 응답 목표: 2시간 이내",
        color: "text-[#5E6AD2]"
      },
      {
        value: "실제 질문 기반 FAQ",
        label: "문서용 FAQ가 아닌 실제 문의를 기반으로 계속 업데이트합니다",
        description: "",
        color: "text-[#22C55E]"
      },
      {
        value: "초기 사용자와 함께 개선",
        label: "피드백을 제품에 바로 반영합니다",
        description: "",
        color: "text-[#F97316]"
      }
    ],
    []
  );

  const categories: FAQCategory[] = [
    {
      name: "시작하기 & 온보딩",
      description: "NexLetter를 도입하고 초기 환경을 구축하는 과정에 대한 안내입니다.",
      icon: HelpCircle,
      questions: [
        {
          id: "onboarding-1",
          question: "NexLetter는 무엇을 하는 서비스인가요?",
          answer:
            "NexLetter는 GitHub·Slack 등 팀의 활동 데이터를 자동으로 수집·정리하여<br />주간 엔지니어링 리포트, 하이라이트, KPI 요약을 자동 생성하는 AI 기반 내·외부 뉴스레터 자동화 플랫폼입니다. <br />관리자는 최소한의 설정만 하면 그 이후는 시스템과 AI 에이전트가 자동으로 운영합니다.",
          tags: ["Service", "Overview"]
        },
        {
          id: "onboarding-2",
          question: "무료 체험 기간은 어떻게 되나요?",
          answer:
            "네. 기본적으로 4주 무료 체험이 제공됩니다. <br />무료 체험에서는 주간 뉴스레터를 최대 4회까지 받아보실 수 있습니다. <br />4주간의 체험이 끝난 뒤, 계속 이용을 원하시면 Starter 플랜을 선택하시면 됩니다.",
          tags: ["Onboarding", "Trial"]
        },
        {
          id: "onboarding-3",
          question: "온보딩 과정은 얼마나 걸리나요?",
          answer:
            "표준 온보딩은 3개의 세션(통합 설정, 메일링 리스트 설정, 타깃 설정)으로 구성됩니다. <br />평균 1시간 이내에 완료되며, 팀 환경에 따라 더 빠르게 끝날 수도 있습니다.",
          tags: ["Onboarding", "Duration"]
        },
        {
          id: "onboarding-4",
          question: "개발팀 외에도 사용할 수 있나요?",
          answer:
            "현 시점에는 엔지니어링 활동 기반 뉴스레터를 제공하고 있습니다. <br />추후 프로덕트/디자인/데이터 팀 등 다양한 조직 활동도 분석할 수 있도록 확장 준비 중입니다.",
          tags: ["Usage", "Customization"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "통합(Integration) & 데이터 수집",
      description: "GitHub, Slack 등 외부 서비스와의 연결 및 데이터 수집 방식에 대한 안내입니다.",
      icon: Database,
      questions: [
        {
          id: "integration-1",
          question: "GitHub과 Slack 데이터는 어떻게 수집되나요?",
          answer:
            "GitHub App과 Slack Bot OAuth를 통해 권한을 위임받아 커밋, PR, 이슈, 스레드, 리액션 등 주요 활동을 실시간으로 수집합니다. <br />개인 Access Token을 요구하지 않으며 안전한 방식으로 데이터를 읽어옵니다.",
          tags: ["Integration", "GitHub", "Slack"]
        },
        {
          id: "integration-2",
          question: "어떤 데이터를 저장하나요?",
          answer:
            "커밋/PR 메타데이터, 이슈 상태 변경, Slack 스레드 내용, 팀별 활동 지표(KPI), AI가 생성한 요약 및 하이라이트 등이 저장됩니다. <br />모든 데이터는 Workspace 단위로 격리됩니다.",
          tags: ["Data", "Storage"]
        },
        {
          id: "integration-3",
          question: "민감한 코드나 비공개 문서가 저장되나요?",
          answer:
            "아닙니다. NexLetter는 원본 코드 전체를 저장하지 않으며 GitHub가 제공하는 요약 메타데이터만 수집합니다. <br />민감한 텍스트는 자동 필터링 후 처리됩니다.",
          tags: ["Security", "Privacy"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "AI 생성 콘텐츠 & 뉴스레터",
      description: "AI가 리포트를 생성하는 방식과 뉴스레터 관련 설정 안내입니다.",
      icon: Sparkles,
      questions: [
        {
          id: "ai-1",
          question: "AI는 어떻게 요약을 생성하나요?",
          answer:
            "수집된 데이터는 중복 제거 → 문서 연결 → 토픽 클러스터링 → 하이라이트 추출 → KPI 계산 → 팀별 맞춤 콘텐츠 생성의 파이프라인을 거칩니다. <br />모든 과정은 NexLetter 전용 OpenAI Agent가 자동 처리합니다.<br /><br />결과적으로 팀의 한 주 활동을 사람이 읽기 쉬운 이야기로 만들어 줍니다.",
          tags: ["AI", "Summary"]
        },
        {
          id: "ai-2",
          question: "뉴스레터는 어떤 방식으로 발송되나요?",
          answer:
            "기본적으로 HTML 이메일을 제공합니다. <br />향후 대시보드·위젯·API 엔드포인트 등 다양한 아웃풋을 지원할 예정입니다.",
          tags: ["Newsletter", "Output"]
        },
        {
          id: "ai-3",
          question: "대시보드 뷰어는 어떻게 되나요?",
          answer:
            "대시보드 뷰어는 생성된 하이라이트, KPI, 진행 상황 등을 시각적으로 확인할 수 있는 뷰어입니다. <br />향후 더 다양한 뷰어를 제공할 예정입니다.",
          tags: ["Dashboard", "Viewer"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "보안 & 개인정보 보호",
      description: "NexLetter의 데이터 보호 정책과 보안 구조에 대한 안내입니다.",
      icon: Shield,
      questions: [
        {
          id: "security-1",
          question: "NexLetter는 어떤 방식으로 데이터를 보호하나요?",
          answer:
            "Supabase Row Level Security, JWT 기반 접근 통제, 데이터 암호화, Vault 기반 API Key 보관 등으로 데이터를 보호합니다. <br />Workspace 단위 강력한 격리 구조를 채택했습니다.",
          tags: ["Security", "RLS"]
        },
        {
          id: "security-2",
          question: "민감한 정보가 외부로 전송되나요?",
          answer:
            "OpenAI API를 포함한 외부 전송은 모두 암호화되며 학습 데이터에 사용되지 않습니다. <br />민감한 텍스트는 자동 필터링되어 처리됩니다.",
          tags: ["Privacy", "ExternalAPI"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "가격 및 플랜",
      description: "요금제 구성과 플랜별 제공 기능에 대한 설명입니다.",
      icon: CreditCard,
      questions: [
        {
          id: "pricing-1",
          question: "요금제는 어떻게 구성되어 있나요?",
          answer:
            "Free Trial, Starter, Pro 플랜으로 구성됩니다. <br />Pro 플랜은 향후 제공 예정입니다.",
          tags: ["Pricing", "Plan"]
        },
        {
          id: "pricing-2",
          question: "발송 인원이 정해져 있나요?",
          answer:
            "Plan별 발송 빈도와 발송 가능 인원이 정해져 있습니다. <br />발송 인원이 플랜 한도를 초과할 경우, 초과된 인원에게는 뉴스레터가 발송되지 않으며, <br />발송 결과는 보낸 메일 상세 화면에서 확인할 수 있습니다.",
          tags: ["Pricing", "Users"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "운영 자동화",
      description: "뉴스레터 생성과 발송 스케줄을 자동화하는 방법을 안내합니다.",
      icon: Timer,
      questions: [
        {
          id: "automation-1",
          question: "뉴스레터 발송 시점을 자동 설정할 수 있나요?",
          answer:
            "네. 현 시점에서는 기본적으로 주간 뉴스레터를 자동 생성하고 발송합니다. <br />발송 시점은 타깃별로 설정할 수 있습니다. <br />추후 월간 뉴스레터도 지원할 예정입니다.",
          tags: ["Automation", "Schedule"]
        },
        {
          id: "automation-2",
          question: "특정 팀 또는 프로젝트만 골라서 리포트를 만들 수 있나요?",
          answer:
            "가능합니다. 타깃별로 특정 GitHub Repository, Slack Channel 등 세부 필터 설정을 지원합니다.<br />현 시점에서는 타깃별로 1개의 GitHub Repository와 3개의 Slack Channel을 설정할 수 있습니다.<br />(예) target1 ==> gitrepo: nexletter-dev, slackchannel: (@nexletter-dev, @nexletter-test, @nexletter-prod) <br />향후 더 다양한 필터링 조건을 지원할 예정입니다.",
          tags: ["Target", "Filter"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "고객지원 & 기술지원",
      description: "NexLetter 사용 중 도움이 필요할 때 제공되는 지원 안내입니다.",
      icon: Headphones,
      questions: [
        {
          id: "support-1",
          question: "초기 설정이 어려우면 도움 받을 수 있나요?",
          answer:
            "회원 가입후 온보딩 셋션이 시작되며, 초기 설정 도움을 받을 수 있습니다. <br /> 그외에는 문의 주시면 평균 2시간 이내에 답변 드립니다.",
          tags: ["Support", "Onboarding"]
        },
        {
          id: "support-2",
          question: "기능 요청 또는 버그 신고는 어디로 하나요?",
          answer:
            "이메일(support@nexletter.app) 또는 제품 내 Contact페이지를 통해 제보할 수 있습니다.",
          tags: ["Support", "Feedback"]
        }
      ]
    },
  
    // ----------------------------------------------------------------------
  
    {
      name: "확장 기능(Advanced)",
      description: "고급 기능 또는 향후 제공될 기능에 대한 안내입니다.",
      icon: Rocket,
      questions: [
        {
          id: "advanced-1",
          question: "향후 어떤 데이터 소스가 추가될 예정인가요?",
          answer:
            "우선은 Discord를 추가할 예정입니다. <br />향후 더 다양한 데이터 소스가 추가될 예정입니다.",
          tags: ["Integration", "Advanced"]
        },
        {
          id: "advanced-2",
          question: "향후 어떤 기능들이 추가될 예정인가요?",
          answer:
            "멀티 워크스페이스, 템플릿 기반 커스터마이징, AI 에이전트 출력 이야기 톤 커스터마이징, 통합 리포트 뷰어 제공 등이 예정되어 있습니다.",
          tags: ["Roadmap", "Future"]
        }
      ]
    }
  ];
  
  const resourceLinks = [
    {
      title: "요금제 자세히 보기",
      description: "팀 규모에 맞는 플랜을 비교하고 예산을 산정하세요.",
      href: "/pricing"
    },
    {
      title: "보안·데이터 처리 상세 보기",
      description: "보안 정책, 암호화, 권한 모델, AI 데이터 보호 가이드를 확인하세요.",
      href: "/legal/security-whitepaper"
    },
    {
      title: "실제 뉴스레터 예시 확인",
      description: "실제로 발송되는 뉴스레터 샘플을 확인하세요.",
      href: "/samples"
    }
  ];

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title={loaderData.title}
        subtitle={loaderData.subtitle}
        description="팀 규모, 보안 정책, 청구 방식에 따라 필요한 정보를 빠르게 찾을 수 있도록 분류했습니다. 그래도 답을 못 찾았다면 2시간 이내에 답변해 드릴게요."
        actions={{
          primary: {
            label: "문의하기",
            variant: "primary",
            href: "/contact"
          },
          secondary: {
            label: "무료 체험 시작하기",
            variant: "secondary",
            href: "/join"
          }
        }}
        media={{
          type: "image",
          src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop&auto=format"
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
          <NexBadge variant="info">카테고리별 FAQ</NexBadge>
          <h2 className="mt-4 text-3xl font-bold">필요한 답변을 바로 찾으세요</h2>
          <p className="mt-2 text-muted-foreground">
            총 {categories.reduce((acc, curr) => acc + curr.questions.length, 0)}개의 최신 질문을
            분류해 두었습니다.
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
                    <NexBadge variant="secondary">{category.questions.length}개 질문</NexBadge>
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
            <NexCardTitle>추천 리소스</NexCardTitle>
            <NexCardDescription>
              심화 자료와 가이드로 더 빠르게 도입을 준비하세요.
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
              <NexBadge variant="success">평균 1시간 이내 온보딩</NexBadge>
              <h3 className="text-3xl font-bold">
                1시간 이내의 온보딩 세션을 통해 빠르게 시작해보세요.
              </h3>
              <p className="text-muted-foreground">복잡한 설정 없이, 핵심만 함께 설정합니다.</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
                시작하기
              </NexButton>
              <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/contact")}>
                문의하기
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>

    </div>
  );
}

