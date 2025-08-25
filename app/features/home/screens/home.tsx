/**
 * Newsletter System Home Page Component
 * 
 * This file implements the main landing page for an internal newsletter system
 * designed for software development companies. The system integrates with Slack, 
 * GitHub, and other development tools to automatically generate weekly newsletters.
 * 
 * Key features:
 * - Modern newsletter system showcase
 * - Integration highlights (Slack, GitHub, etc.)
 * - Newsletter preview and samples
 * - Company-focused design for internal tools
 */

import type { Route } from "./+types/home";

import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { 
  MessageCircle, 
  GitBranch, 
  Mail, 
  Calendar,
  TrendingUp,
  Users,
  Bot,
  FileText,
  Clock,
  CheckCircle,
  Zap,
  Globe
} from "lucide-react";

import i18next from "~/core/lib/i18next.server";
import { 
  LinearButton, 
  LinearCard,
  LinearCardHeader,
  LinearCardTitle,
  LinearCardDescription,
  LinearCardContent,
  LinearHero,
  LinearBadge,
  LinearImageCard,
  LinearProgress,
  LinearCarousel,
  LinearCarouselItem
} from "~/core/components/linear";

/**
 * Meta function for setting page metadata
 * 
 * This function generates SEO-friendly metadata for the home page using data from the loader.
 * It sets:
 * - Page title from translated "home.title" key
 * - Meta description from translated "home.subtitle" key
 * 
 * The metadata is language-specific based on the user's locale preference.
 * 
 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 * 
 * This function loads data for the newsletter system homepage including
 * sample statistics, recent activity, and integration status.
 * 
 * @param request - The incoming HTTP request
 * @returns Object with page data and translations
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get a translation function for the user's locale from the request
  const t = await i18next.getFixedT(request);
  
  // Mock data for newsletter system - in real app this would come from your API
  const stats = {
    totalNewsletters: 52,
    slackMessages: 1247,
    githubCommits: 156,
    teamMembers: 24
  };
  
  // Return translated strings and stats for use in both the component and meta function
  return {
    title: "Nexletter - 사내 뉴스레터 시스템",
    subtitle: "Slack과 GitHub을 통합한 자동화된 주간 뉴스레터",
    stats
  };
}

/**
 * Newsletter System Home Page Component
 * 
 * Main landing page for the internal newsletter system showcasing:
 * - Hero section with key features
 * - Integration highlights (Slack, GitHub, etc.)
 * - Statistics and metrics
 * - Sample newsletter preview
 * - Team collaboration features
 * 
 * @returns JSX element representing the newsletter system homepage
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { stats } = loaderData;

  // Sample integrations data
  const integrations = [
    {
      name: "Slack",
      icon: MessageCircle,
      description: "팀 대화와 중요한 논의사항을 자동으로 수집합니다",
      status: "active",
      color: "success"
    },
    {
      name: "GitHub",
      icon: GitBranch,
      description: "커밋, PR, 이슈를 주간 활동으로 정리합니다",
      status: "active", 
      color: "primary"
    },
    {
      name: "Jira",
      icon: CheckCircle,
      description: "프로젝트 진행상황과 완료된 작업을 추적합니다",
      status: "coming-soon",
      color: "warning"
    },
    {
      name: "Figma",
      icon: FileText,
      description: "디자인 업데이트와 새로운 프로토타입을 포함합니다",
      status: "coming-soon",
      color: "secondary"
    }
  ];

  // Sample recent activities
  const recentActivities = [
    { type: "slack", content: "💡 #engineering에서 새로운 아키텍처 논의", time: "2시간 전" },
    { type: "github", content: "🚀 user-auth 브랜치에 15개 커밋 추가", time: "3시간 전" },
    { type: "slack", content: "🎉 #general에서 제품 출시 축하", time: "5시간 전" },
    { type: "github", content: "🐛 결제 시스템 버그 수정 완료", time: "1일 전" },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <LinearHero
        variant="split"
        title="Nexletter"
        subtitle="개발팀을 위한 스마트한 주간 뉴스레터"
        description="Slack 대화, GitHub 활동, 프로젝트 진행상황을 자동으로 분석하여 팀의 한 주를 정리한 뉴스레터를 생성합니다. 더 이상 수동으로 주간 보고서를 작성할 필요가 없습니다."
        actions={{
          primary: { 
            label: "뉴스레터 구독하기", 
            variant: "primary",
            href: "/subscribe"
          },
          secondary: { 
            label: "샘플 뉴스레터 보기", 
            variant: "secondary",
            href: "/samples"
          }
        }}
        media={{ 
          type: "image", 
          src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&crop=center"
        }}
      />

      {/* Statistics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LinearCard variant="elevated" className="text-center">
          <LinearCardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{stats.totalNewsletters}</div>
            <p className="text-sm text-muted-foreground">발송된 뉴스레터</p>
          </LinearCardContent>
        </LinearCard>
        
        <LinearCard variant="elevated" className="text-center">
          <LinearCardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{stats.slackMessages.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">분석된 Slack 메시지</p>
          </LinearCardContent>
        </LinearCard>
        
        <LinearCard variant="elevated" className="text-center">
          <LinearCardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{stats.githubCommits}</div>
            <p className="text-sm text-muted-foreground">이번 주 커밋</p>
          </LinearCardContent>
        </LinearCard>
        
        <LinearCard variant="elevated" className="text-center">
          <LinearCardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{stats.teamMembers}</div>
            <p className="text-sm text-muted-foreground">팀 멤버</p>
          </LinearCardContent>
        </LinearCard>
      </section>

      {/* Integrations Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">강력한 통합 기능</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            이미 사용하고 있는 도구들과 seamless하게 연결되어 팀의 활동을 자동으로 수집하고 정리합니다.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <LinearCard key={index} variant="outlined" hoverable>
                <LinearCardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{integration.name}</h3>
                        <LinearBadge 
                          variant={integration.status === "active" ? "success" : "warning"}
                          size="sm"
                        >
                          {integration.status === "active" ? "연결됨" : "곧 출시"}
                        </LinearBadge>
                      </div>
                      <p className="text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                </LinearCardContent>
              </LinearCard>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-6">실시간 활동</h3>
          <LinearCard variant="outlined">
            <LinearCardContent className="p-0">
              <div className="space-y-0">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
                    <div className="p-2 rounded-lg bg-muted">
                      {activity.type === "slack" ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <GitBranch className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.content}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>

        {/* Newsletter Preview */}
        <div>
          <h3 className="text-2xl font-bold mb-6">뉴스레터 미리보기</h3>
          <LinearCard variant="elevated">
            <LinearCardHeader>
              <div className="flex items-center justify-between">
                <LinearCardTitle>Week #47 - Dev Team Digest</LinearCardTitle>
                <LinearBadge variant="info">새로운</LinearBadge>
              </div>
              <LinearCardDescription>2024년 11월 18일 - 11월 24일</LinearCardDescription>
            </LinearCardHeader>
            <LinearCardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">📈 이번 주 하이라이트</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>사용자 인증 시스템 리팩토링 완료</li>
                    <li>모바일 앱 성능 30% 개선</li>
                    <li>새로운 결제 시스템 테스트 시작</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">💬 팀 토론 주제</h4>
                  <p className="text-sm text-muted-foreground">
                    마이크로서비스 아키텍처 도입에 대한 활발한 논의가 #architecture 채널에서...
                  </p>
                </div>

                <LinearProgress value={75} variant="default" className="mt-4" />
                <p className="text-xs text-muted-foreground">뉴스레터 생성 진행률: 75%</p>
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>
      </section>

      {/* Team Highlights Carousel */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">팀 하이라이트</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            매주 자동으로 수집되는 팀의 성과와 중요한 순간들을 확인해보세요
          </p>
        </div>

        <LinearCarousel
          autoPlay
          showDots
          slidesToShow={3}
          slidesToScroll={1}
          responsive={[
            { 
              breakpoint: 1024, 
              settings: { 
                slidesToShow: 2,
                slidesToScroll: 1
              } 
            },
            { 
              breakpoint: 640, 
              settings: { 
                slidesToShow: 1,
                slidesToScroll: 1
              } 
            }
          ]}
        >
          {/* Weekly Achievement */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 mr-4">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">이번 주 성과</h3>
                    <p className="text-sm text-muted-foreground">Week #47</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">완료된 이슈</span>
                    <LinearBadge variant="success">24개</LinearBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">배포 횟수</span>
                    <LinearBadge variant="info">12회</LinearBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">코드 리뷰</span>
                    <LinearBadge variant="secondary">89개</LinearBadge>
                  </div>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>

          {/* Team Communication */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 mr-4">
                    <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">팀 소통</h3>
                    <p className="text-sm text-muted-foreground">활발한 논의</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">#engineering 채널</p>
                    <p className="text-xs text-muted-foreground">새로운 마이크로서비스 아키텍처 설계 논의</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">#frontend 채널</p>
                    <p className="text-xs text-muted-foreground">React 18 업그레이드 계획 수립</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">#backend 채널</p>
                    <p className="text-xs text-muted-foreground">API 성능 최적화 결과 공유</p>
                  </div>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>

          {/* Latest Newsletter */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 mr-4">
                    <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">최신 뉴스레터</h3>
                    <p className="text-sm text-muted-foreground">11월 3주차</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">주요 토픽:</span>
                    <span className="ml-1 text-muted-foreground">결제 시스템 개선</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">참여 인원:</span>
                    <span className="ml-1 text-muted-foreground">8명</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">읽기 시간:</span>
                    <span className="ml-1 text-muted-foreground">3분</span>
                  </div>
                  <LinearButton variant="secondary" size="sm" className="w-full mt-3">
                    뉴스레터 읽기
                  </LinearButton>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>

          {/* Code Quality */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 mr-4">
                    <CheckCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">코드 품질</h3>
                    <p className="text-sm text-muted-foreground">이번 주 통계</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">테스트 커버리지</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <LinearProgress value={94} variant="success" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">코드 품질 점수</span>
                      <span className="text-sm font-medium">A+</span>
                    </div>
                    <LinearProgress value={98} variant="default" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">버그 수정</span>
                    <LinearBadge variant="success">15개</LinearBadge>
                  </div>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>

          {/* Team Productivity */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 mr-4">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">팀 생산성</h3>
                    <p className="text-sm text-muted-foreground">이번 주 요약</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">127</div>
                    <p className="text-xs text-muted-foreground">커밋 수</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold">18</div>
                      <p className="text-xs text-muted-foreground">PR 생성</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">22</div>
                      <p className="text-xs text-muted-foreground">PR 병합</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <LinearBadge variant="success">+15% vs 지난주</LinearBadge>
                  </div>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>

          {/* Innovation Highlights */}
          <LinearCarouselItem>
            <LinearCard variant="elevated" className="mx-2 h-full">
              <LinearCardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 mr-4">
                    <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">혁신 하이라이트</h3>
                    <p className="text-sm text-muted-foreground">이번 주 발견</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">새로운 도구 도입</p>
                    <p className="text-xs text-muted-foreground">GitHub Copilot으로 개발 속도 향상</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">프로세스 개선</p>
                    <p className="text-xs text-muted-foreground">자동화된 배포 파이프라인 구축</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">기술 학습</p>
                    <p className="text-xs text-muted-foreground">팀 내 TypeScript 워크샵 진행</p>
                  </div>
                </div>
              </LinearCardContent>
            </LinearCard>
          </LinearCarouselItem>
        </LinearCarousel>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16">
        <LinearCard variant="gradient" className="p-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                팀의 생산성을 한 단계 높여보세요
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                매주 자동으로 생성되는 뉴스레터로 팀의 성과를 투명하게 공유하고, 
                놓친 중요한 정보들을 손쉽게 파악할 수 있습니다.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LinearButton variant="secondary" size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                데모 예약하기
              </LinearButton>
              <LinearButton variant="ghost" size="lg" className="text-white border-white hover:bg-white/10">
                <Mail className="h-5 w-5 mr-2" />
                무료로 시작하기
              </LinearButton>
            </div>
          </div>
        </LinearCard>
      </section>
    </div>
  );
}
