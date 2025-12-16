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

const HERO_HIGHLIGHTS: IconCard[] = [
  {
    icon: Activity,
    title: "팀의 순간을 한데 묶는 스토리",
    description:
      "Slack과 GitHub에 흩어진 수많은 움직임을 하나의 흐름으로 엮어, 팀이 지나온 과정을 이야기로 남깁니다."
  },
  {
    icon: Sparkles,
    title: "AI 기반 뉴스레터 엔진",
    description:
      "주간 하이라이트와 KPI를 자동으로 정리해, 개인이 아닌 조직 전체가 같은 맥락을 공유하게 만듭니다."
  },
  {
    icon: FileText,
    title: "흩어진 데이터의 사이 공간",
    description:
      "숫자와 로그 사이에 사라지던 맥락을 기록으로 보존해, 팀의 문화와 의사결정을 이어줍니다."
  }
];

const PAIN_POINTS: IconCard[] = [
  {
    icon: Target,
    title: "팀이 무엇을 이루는지 파악이 어렵습니다",
    description: "속도는 빨라지지만 기록은 늘 뒤로 밀립니다.",
    detail: "코드, 대화, 결정, 작은 고민들이 흩어져 있어 핵심 흐름을 놓치기 쉽습니다."
  },
  {
    icon: Database,
    title: "데이터는 여러 도구에 나뉘어 있습니다",
    description: "Slack·GitHub·문서 툴을 오가며 맥락이 분산됩니다.",
    detail: "중요한 순간을 모으기 위해 매주 시간과 에너지가 불필요하게 소모됩니다."
  },
  {
    icon: BookOpen,
    title: "리포트 작성은 여전히 수작업입니다",
    description: "가장 똑똑한 팀조차 직접 복붙하며 주간 보고를 만듭니다.",
    detail: "우리는 “기록은 왜 아직도 사람이 해야 하는가?”라는 질문에서 출발했습니다."
  },
  {
    icon: Users,
    title: "성과와 맥락이 조직 전체에 닿지 않습니다",
    description: "스토리가 없으면 성과는 금방 잊힙니다.",
    detail: "팀 내부뿐 아니라 조직 외부에서는 흐름을 읽기 어려워, 신뢰와 영향력이 자연스럽게 약해집니다."
  }
];

const STORYTELLING_FLOW: IconCard[] = [
  {
    icon: Database,
    title: "데이터를 수집하고",
    description: "Slack과 GitHub에서 팀의 움직임을 실시간으로 모읍니다."
  },
  {
    icon: Layers,
    title: "의미를 찾아내고",
    description: "NexLetter AI 엔진이 활동을 정리·분류·클러스터링해 맥락을 세웁니다."
  },
  {
    icon: Zap,
    title: "핵심을 요약하고",
    description: "노이즈를 걷어내고 팀이 알아야 할 하이라이트와 KPI만 남깁니다."
  },
  {
    icon: Share2,
    title: "하나의 리포트로 재구성합니다",
    description: "모두가 이해할 수 있는 내러티브로 정리해 자동 배포합니다."
  }
];

const VALUE_PROPOSITIONS: IconCard[] = [
  {
    icon: Zap,
    title: "리포트 작성 시간을 극적으로 줄입니다",
    description: "AI가 데이터를 읽고 요약하고, 팀은 설정만 해 두면 됩니다."
  },
  {
    icon: Globe,
    title: "팀의 흐름을 누구나 따라가게 합니다",
    description: "명확한 스토리텔링과 시각 언어로 조직 전체가 같은 그림을 봅니다."
  },
  {
    icon: Target,
    title: "프로젝트 리스크를 조기에 드러냅니다",
    description: "흐름을 끊는 신호를 자동으로 포착해 문제가 커지기 전에 대응할 수 있게 돕습니다."
  },
  {
    icon: Share2,
    title: "성과를 자연스럽게 확산시킵니다",
    description: "뉴스레터·하이라이트·KPI를 팀과 조직이 쓰는 채널로 자연스럽게 전달합니다."
  },
  {
    icon: Users,
    title: "반복되는 기록 업무에서 팀을 해방합니다",
    description: "사람은 창의적인 문제와 중요한 결정에 집중할 수 있습니다."
  }
];

const HOW_IT_WORKS: StepCard[] = [
  {
    step: "01",
    icon: Database,
    title: "연결",
    description: "Slack/GitHub를 연결하는 순간, 팀의 활동 수집이 자동으로 가능해 집니다.",
    detail: "최소한의 OAuth 권한으로 팀 활동이 자동 동기화됩니다."
  },
  {
    step: "02",
    icon: Sparkles,
    title: "이해",
    description: "AI 엔진이 활동을 정리·분류·클러스터링합니다.",
    detail: "토픽별 묶음과 맥락 분석으로 사람이 놓치기 쉬운 의미를 잃지 않습니다."
  },
  {
    step: "03",
    icon: FileText,
    title: "생성",
    description: "제품 수준의 주간 리포트·하이라이트·KPI를 만듭니다.",
    detail: "팀별 톤과 선호에 맞춘 자동화 템플릿을 제공합니다."
  },
  {
    step: "04",
    icon: Share2,
    title: "공유",
    description: "이메일·Slack·웹 등 원하는 채널로 바로 전달됩니다.",
    detail: "한 번 설정하면 NexLetter가 흐름을 놓치지 않고 자동으로 배포합니다."
  }
];

const PHILOSOPHY_STATEMENTS = [
  "팀의 지식은 사라지지 않아야 합니다.",
  "기록은 업무가 아니라 자연스러운 결과여야 한다고 생각합니다.",
  "좋은 팀은 잘 기록하는 팀이라고 믿습니다.",
  "AI가 반복 작업을 대신할 때 사람은 더 중요한 결정을 다룰 수 있습니다."
];

const SECURITY_PROMISES: IconCard[] = [
  {
    icon: Shield,
    title: "최소한의 OAuth 권한만 사용",
    description: "필수 범위만 요청해 Workspace 보안 정책을 지킵니다."
  },
  {
    icon: Lock,
    title: "모든 데이터 전송은 TLS로 암호화",
    description: "이동 구간 전체를 보호해 외부 노출을 차단합니다."
  },
  {
    icon: Database,
    title: "민감 데이터는 Supabase Vault에 보관",
    description: "접근 제어 및 감사를 기본값으로 채택했습니다."
  },
  {
    icon: Layers,
    title: "불필요한 정보는 저장하지 않습니다",
    description: "목적을 벗어나는 데이터는 자동으로 폐기합니다."
  },
  {
    icon: Sparkles,
    title: "사용자 데이터는 학습에 활용하지 않습니다",
    description: "모델 튜닝 없이도 프라이버시를 최우선으로 합니다."
  }
];

const ROADMAP_ITEMS = [
  "데이터 소스 (Discord, xxxx, xxxx, xxxx 등) 확장",
  "더 적은 설정으로 더 많은 자동화 (Zero-Input Automation)",
  "템플릿 기반 커스터마이징 확장",
  "AI 에이전트 출력 이야기 톤 커스터마이징",
  "통합 리포트 뷰어 제공",
];

export const meta: Route.MetaFunction = (args) => {
  const pageData = args.data as LoaderData | undefined;
  return [
    { title: pageData?.title ?? "NexLetter – About" },
    {
      name: "description",
      content:
        pageData?.subtitle ??
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
    })
  };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

type AboutProps = {
  loaderData: LoaderData;
};

export default function About({ loaderData }: AboutProps) {
  const navigate = useNavigate();
  const title = loaderData.title;
  const subtitle = loaderData.subtitle;

  return (
    <div className="space-y-16">
      <NexHero
        variant="split"
        title={title}
        subtitle={subtitle}
        description="당신의 팀이 움직이는 순간들. 우리는 그 흐름이 사라지지 않도록 만듭니다. NexLetter는 일상의 활동 속에서 남기는 수많은 움직임 사이에서 의미를 발견하고, 흩어진 기록을 하나의 이야기로 엮어 팀의 문화와 성과를 자동으로 남깁니다."
        actions={{
          primary: {
            label: "시작하기",
            variant: "primary",
            href: "/join"
          },
          secondary: {
            label: "샘플 보기",
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
          <NexBadge variant="warning">🔍 우리가 바라본 현실</NexBadge>
          <h2 className="text-3xl font-bold">우리가 이 문제를 그냥 둘 수 없었던 이유</h2>
          <p className="text-muted-foreground">
            프로젝트 팀은 누구보다 빠르게 움직입니다. 하지만 그 흐름을 정리하고 전달하는 일은,
            여전히 ‘누군가의 몫’으로 남아 있습니다.
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
            <NexBadge variant="secondary">💡 우리의 해답</NexBadge>
            <NexCardTitle>팀이 일하면, NexLetter가 이야기로 만들어드립니다.</NexCardTitle>
            <NexCardDescription>
              흩어지는 데이터를 잇고 의미를 만들며 팀의 스토리를 자동으로 기록하는 AI 기반 뉴스레터
              플랫폼입니다.
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-3 text-sm text-muted-foreground">
            <p>NexLetter는 “사이 공간”을 메우기 위해 탄생했습니다.</p>
            <ul className="space-y-2">
              <li>• 팀의 활동을 실시간으로 감지하고</li>
              <li>• 의미 있는 흐름으로 재구성하며</li>
              <li>• 누구나 읽을 수 있는 내러티브로 전달합니다.</li>
            </ul>
            <p>팀의 움직임은 더 이상 사라지지 않고 기록으로 남습니다.</p>
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>데이터에서 스토리까지</NexCardTitle>
            <NexCardDescription>AI 파이프라인이 팀의 흐름을 잇는 방법입니다.</NexCardDescription>
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
          <NexBadge variant="success">🎯 NexLetter가 제공하는 가치</NexBadge>
          <h2 className="text-3xl font-bold">우리가 만드는 것은 문서가 아니라 명확한 내러티브입니다</h2>
          <p className="text-muted-foreground">팀의 흐름을 누구나 따라갈 수 있게 만드는 다섯 가지 약속.</p>
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
          <NexBadge variant="info">⚙️ 어떻게 작동하나요</NexBadge>
          <h2 className="text-3xl font-bold">4단계 자동 리포트 파이프라인</h2>
          <p className="text-muted-foreground">
            연결 → 이해 → 생성 → 공유. 마치 팀에 전담 리포터가 생긴 듯한 경험을 제공합니다.
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
          <NexBadge variant="warning">🛡 보안에 대한 우리의 약속</NexBadge>
          <h2 className="text-3xl font-bold">신뢰는 기능이 아니라 태도라고 믿습니다</h2>
          <p className="text-muted-foreground">
            당신의 팀 데이터는 무엇보다 소중합니다. 기본 원칙부터 투명하게 공유합니다.
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
        <p className="text-center text-sm text-muted-foreground">이 원칙들은 기능이 아니라, 우리가 제품을 만드는 태도입니다.</p>
      </section>

      <section className="space-y-6">
        <NexBadge variant="secondary">🚀 우리의 철학</NexBadge>
        <NexCard variant="outlined">
          <NexCardContent className="space-y-4 p-6">
            <p className="text-lg font-semibold">우리는 이렇게 믿습니다.</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {PHILOSOPHY_STATEMENTS.map((statement) => (
                <p key={statement}>• {statement}</p>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              NexLetter는 “일하는 방식에서 가장 귀찮았던 부분”을 가장 먼저 바꿉니다.
            </p>
          </NexCardContent>
        </NexCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle className="flex items-center gap-2"> 
              <Users className="h-5 w-5 text-primary" />
              <span>NexLetter 팀</span>
            </NexCardTitle>
            <NexCardDescription>
              우리는 개발자가 문서 작성에 시간을 빼앗기는 순간을 가장 싫어했습니다.
            </NexCardDescription>
          </NexCardHeader>
          <NexCardContent className="space-y-3 text-sm text-muted-foreground">
            <p>그래서 스스로 해결책을 만들기 시작했고, 그 결과가 오늘의 NexLetter입니다.</p>
            <ul className="space-y-2">
              <li>• 작지만 깊이 있게 문제를 파고드는 팀</li>
              <li>• 현실적인 문제를 끝까지 해결하려는 팀</li>
              <li>• 더 나은 일하는 방식을 위해 계속 실험하는 팀</li>
            </ul>
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader className="flex items-start justify-between">
            <div>
              <NexCardTitle className="flex items-center gap-2"> 
                <Map className="h-5 w-5 text-primary" />
                <span>앞으로의 여정</span>
              </NexCardTitle>
              <NexCardDescription>우리는 아직 시작에 불과합니다. 하지만 방향은 분명합니다.</NexCardDescription>
            </div>
          </NexCardHeader>
          <NexCardContent className="space-y-2 text-sm text-muted-foreground">
            {ROADMAP_ITEMS.map((item) => (
              <p key={item}>• {item}</p>
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
                  <NexBadge variant="info">🚀 시작해보세요</NexBadge>
                </div>
              </div>
              <h3 className="text-3xl font-bold">팀이 일하는 모든 순간을 명확한 스토리로.</h3>
              <p className="text-muted-foreground">
                지금 바로 NexLetter를 경험하고, 흐름을 기록하는 새로운 방식을 만나보세요.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton variant="primary" className="cursor-pointer" size="lg" onClick={() => navigate("/join")}>
                시작하기
              </NexButton>
              <NexButton variant="secondary" className="cursor-pointer" size="lg" onClick={() => navigate("/login")}>
                로그인
              </NexButton>
              <NexButton variant="gradient" className="cursor-pointer" size="lg" onClick={() => navigate("/samples")}>
                샘플 보기
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}

