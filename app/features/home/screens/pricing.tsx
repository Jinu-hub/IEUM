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
  NexProgress,
  NexToggle
} from "~/core/components/nex";
import i18next from "~/core/lib/i18next.server";

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title ?? "Nexletter Pricing" },
    {
      name: "description",
      content: data?.subtitle ?? "팀 규모에 맞춰 유연하게 확장되는 Nexletter 요금제"
    }
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);

  return {
    title: t("pricing.title", {
      defaultValue: "Nexletter - 가격 정책"
    }),
    subtitle: t("pricing.subtitle", {
      defaultValue: "AI 기반 사내 뉴스레터 자동화를 위한 요금제"
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
  comingSoon?: boolean;
  features: string[];
  cta: string;
};

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [annualBilling, setAnnualBilling] = useState(true);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(
        i18n.language === "ja"
          ? "ja-JP"
          : i18n.language === "en"
            ? "en-US"
            : "ko-KR",
        {
          style: "currency",
          currency: i18n.language === "en" ? "USD" : i18n.language === "ja" ? "JPY" : "KRW",
          maximumFractionDigits: 0
        }
      ),
    [i18n.language]
  );

  const plans: PricingPlan[] = [
    {
      name: "Free",
      description: "NexLetter를 가볍게 체험해보기",
      price: { monthly: 0, annual: 0 },
      seats: "최대 3명까지 뉴스레터 발송",
      bestFor: "개인 사용자 · 체험 목적",
      features: [
        "주간 뉴스레터 자동 생성/발송 4회 체험",
        "Starter 플랜과 동일한 기능",
      ],
      cta: "무료로 체험하기"
    },
    {
      name: "Starter",
      description: "소규모 팀이 가장 빠르게 NexLetter를 시작하는 방법",
      price: { monthly: 9900, annual: 7900 },
      seats: "최대 10명까지 뉴스레터 발송",
      bestFor: "개인 개발자 · 초기 스타트업",
      badge: "가장 많이 선택됨",
      features: [
        "주간 뉴스레터 자동 생성 및 발송",
        "워크스페이스 1개",
        "활성 타깃 최대 3개",
        "타깃당 GitHub 레포지토리 1개 + Slack 채널 3개 연동",
        "기본 뉴스레터 템플릿 제공 (커스터마이징 불가)",
      ],
      cta: "Starter로 시작하기"
    },
    
    {
      name: "Pro",
      description: "팀 단위 운영을 위한 확장 플랜",
      price: { monthly: 39900, annual: 31900 },
      seats: "최대 100명까지 뉴스레터 발송",
      bestFor: "성장 중인 팀 · 운영 자동화가 필요한 조직",
      comingSoon: true,
      badge: "준비 중",
      features: [
        "주간 · 월간 뉴스레터 자동 생성",
        "워크스페이스 3개",
        "활성 타깃 최대 10개",
        "타깃당 GitHub 레포지토리 2개 + Slack 채널 5개 연동",
        "뉴스레터 템플릿 커스터마이징",
        "기본 톤 3종 선택 가능",
        "수동 발송 및 재발송",
        "기본 KPI · 트렌드 분석 레포트 제공",
        "우선 지원 (Priority Support)"
      ],
      cta: "Pro 준비 중"
    },
  ];

  const comparisonRows = [
    {
      label: "뉴스레터 발송 지속 기간",
      free: "주간 1회 · 4주 체험 후 종료",
      starter: "주간 1회 · 무제한 지속",
      pro: "주간 1회 + 월간 1회"
    },
    {
      label: "연동 가능한 서비스",
      free: "Slack, GitHub",
      starter: "Slack, GitHub, (확장 예정)",
      pro: "Slack, GitHub, (확장 예정)"
    },
    {
      label: "활성 가능 타깃 개수",
      free: "1개",
      starter: "3개",
      pro: "10개"
    },
    {
      label: "타깃당 설정 가능 데이터 소스",
      free: "Git repo 1개 · Slack channel 3개",
      starter: "Git repo 1개 · Slack channel 3개",
      pro: "Git repo 2개 · Slack channel 5개"
    },
    {
      label: "AI 요약 톤",
      free: "기본 톤 1종",
      starter: "기본 톤 1종",
      pro: "톤 3종 선택"
    },
    {
      label: "뉴스레터 템플릿",
      free: "기본 템플릿",
      starter: "기본 템플릿",
      pro: "템플릿 커스터마이징"
    },
    {
      label: "1회 메일당 발송 가능 인원",
      free: "최대 3명",
      starter: "최대 10명",
      pro: "최대 100명"
    }
  ];
  

  const faqs = [
    {
      question: "무료 체험은 어떻게 진행되나요?",
      answer:
        "무료 체험에서는 주간 뉴스레터를 최대 4회까지 받아보실 수 있습니다. <br />4주간의 체험이 끝난 뒤, 계속 이용을 원하시면 Starter 플랜을 선택하시면 됩니다."
    },
    {
      question: "발송 인원이 초과되면 어떻게 되나요?",
      answer:
        "각 플랜에는 발송 가능한 최대 인원이 정해져 있습니다. <br />발송 인원이 플랜 한도를 초과할 경우, 초과된 인원에게는 뉴스레터가 발송되지 않으며, <br />발송 결과는 보낸 메일 상세 화면에서 확인할 수 있습니다."
    },
    {
      question: "발송 빈도는 어떻게 되나요?",
      answer:
        "현재는 주간 뉴스레터를 기본으로 제공하고 있습니다. <br />월간 뉴스레터는 추후 Pro 플랜에서 제공할 예정이며, <br />일간 뉴스레터는 사용자 피드백을 바탕으로 검토 중입니다."
    },
    {
      question: "요금제 변경은 어떻게 되나요?",
      answer:
        "요금제 변경은 언제든지 가능합니다. <br />기간 도중 플랜을 변경하더라도, 남은 기간을 기준으로 차액만 추가 결제하거나 환불 처리됩니다."
    }
  ];
  

  const roiStats = [
    { label: "주간 리포트 작성 시간 절감", value: 78, variant: "success" as const },
    { label: "조직 내 뉴스레터 도달률", value: 92, variant: "gradient" as const },
    { label: "엔지니어 만족도 향상", value: 72, variant: "default" as const }
  ];

  const displayPrice = (plan: PricingPlan) => {
    const value = annualBilling ? plan.price.annual : plan.price.monthly;
    return priceFormatter.format(value);
  };

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title="투명하고 확장 가능한 Nexletter 가격 정책"
        subtitle="팀 규모와 워크플로에 맞춰 AI 뉴스레터 자동화를 지금 시작하고, 계속 이어가세요."
        description="모든 요금제는 Slack · GitHub 통합, KPI 위젯, 다국어 뉴스레터를 기본 제공합니다. Free 체험 이후에도 동일한 자동화를 Starter 플랜에서 계속 이용할 수 있습니다."
        actions={{
          primary: {
            label: "4주 무료 체험 시작하기",
            variant: "primary",
            href: "/join"
          },
          secondary: {
            label: "Starter로 계속하기",
            variant: "secondary",
            href: "/join"
          }
        }}
        media={{
          type: "image",
          src: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&h=600&fit=crop&auto=format"
        }}
      />

      <section className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <NexBadge variant="info">모든 요금제, 무료 체험 4회 제공</NexBadge>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <span className="text-sm text-muted-foreground">월간 · 연간 요금 전환</span>
            <NexToggle
              checked={annualBilling}
              label="연간 결제(20% 할인)"
              onChange={setAnnualBilling}
              size="lg"
            />
          </div>
        </div>

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
                      <NexCardTitle>{plan.name}</NexCardTitle>
                      <NexCardDescription>{plan.description}</NexCardDescription>
                    </div>
                    {plan.badge && (
                      <NexBadge variant="info" size="sm">
                        {plan.badge}
                      </NexBadge>
                    )}
                  </div>
                </NexCardHeader>
                <NexCardContent className="flex h-full flex-col space-y-6">
                  <div>
                    <div className="text-4xl font-bold text-[#5E6AD2] dark:text-[#7C89F9]">
                      {displayPrice(plan)} / 월
                    </div>
                    <p className="text-sm text-muted-foreground">
                     {annualBilling ? "연간 선결제" : "월별 결제"}
                    </p>
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
      </section>

      <section>
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>플랜별 기능 비교</NexCardTitle>
            <NexCardDescription>
              성장 단계에 맞게 필요한 기능만 선택하세요.
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-4">기능</th>
                  <th className="p-4">Free</th>
                  <th className="p-4">Starter</th>
                  <th className="p-4">Pro</th>
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>ROI / 효율성 지표</NexCardTitle>
            <NexCardDescription>
              도입 기업 평균 수치를 기준으로 산정했습니다.
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
            <NexCardTitle>엔터프라이즈 플랜</NexCardTitle>
            <NexCardDescription>
              100명 이상 조직을 위한 맞춤형 NexLetter
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li>• SAML / SSO, 감사 로그</li>
              <li>• 데이터 레지던시 & 보안 옵션</li>
              <li>• 전담 지원 및 SLA</li>
            </ul>
            <NexButton variant="primary" size="lg" onClick={() => navigate("/contact")}>
              엔터프라이즈 상담하기
            </NexButton>
          </NexCardContent>
        </NexCard>

      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold">자주 묻는 질문</h2>
          <p className="text-muted-foreground">
            요금제 선택 전에 알고 싶은 내용을 빠르게 확인하세요.
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

      <section>
        <NexCard
          variant="elevated"
          className="bg-gradient-to-br from-[#F5F7FF] via-white to-[#EEF2FF] dark:from-[#12131A] dark:via-[#1A1B1E] dark:to-[#1F2230]"
        >
          <NexCardContent className="flex flex-col gap-8 p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-[#5E6AD2]">
                Let's Start Your Journey plan?
              </p>
              <h3 className="text-3xl font-bold">
                다음 주도, 그 다음 주도...<br />우리 팀의 한 주를 자동으로 정리해 보세요.
              </h3>
              <p className="text-muted-foreground text-sm">
                4주 체험 이후에도 뉴스레터를 계속 받아보려면  
                Starter 플랜이 필요합니다.<br />  
                지금 연간 플랜 {loaderData.discountRate * 100}% 할인 혜택을 제공합니다.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
            <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
              Starter로 시작하기
              <Zap className="ml-2 h-5 w-5" />
            </NexButton>

            <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/contact")}>
               문의하기
              <Mail className="ml-2 h-5 w-5" />
            </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}

