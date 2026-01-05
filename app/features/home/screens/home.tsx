/**
 * Newsletter System Home Page Component
 * 
 * This file implements the main landing page for an internal newsletter system
 * designed for software development companies. The system integrates with Slack, 
 * GitHub, and other development tools to automatically generate weekly newsletters.
 */

import type { Route } from "./+types/home";

import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
  GitBranch,
  GitCommit,
  Layers,
  Mail,
  MessageCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCarousel,
  NexCarouselItem,
  NexHero,
  NexProgress
} from "~/core/components/nex";
import i18next from "~/core/lib/i18next.server";
import {
  homeAnalyticsFeatures,
  homeCaseData,
  homeCommitTrendData,
  homeDeveloperData,
  homeFeatureHighlights,
  homeIntegrations
} from "~/features/settings/lib/mockdata";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 */
export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);
  
  const stats = {
    totalNewsletters: 52,
    slackMessages: 1247,
    githubCommits: 156,
    teamMembers: 24
  };
  
  return {
    title: "Nexletter - 사내 뉴스레터 시스템",
    subtitle: "Slack과 GitHub을 통합한 자동화된 주간 뉴스레터",
    stats
  };
}

/**
 * Newsletter System Home Page Component
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats } = loaderData;

  // Icon mapping for home page data
  const iconMap = useMemo(() => ({
    Layers,
    Sparkles,
    Mail,
    MessageCircle,
    GitBranch,
    MessageSquare,
    GitCommit,
    BarChart3
  }), []);

  // Use data from mockdata
  const commitTrendData = homeCommitTrendData;
  const developerData = homeDeveloperData;
  const caseData = homeCaseData;

  // Feature highlights with icon mapping
  const featureHighlights = useMemo(() => 
    homeFeatureHighlights.map(item => ({
      ...item,
      icon: iconMap[item.iconName]
    })), [iconMap]
  );

  // Integrations with icon mapping
  const integrations = useMemo(() => 
    homeIntegrations.map(item => ({
      ...item,
      icon: iconMap[item.iconName]
    })), [iconMap]
  );

  // Analytics features with icon mapping
  const analyticsFeatures = useMemo(() => 
    homeAnalyticsFeatures.map(item => ({
      ...item,
      icon: iconMap[item.iconName]
    })), [iconMap]
  );

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <NexHero
        variant="split"
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        description={t("home.hero.description")}
        actions={{
          primary: { 
            label: t("home.hero.subscribeButton"), 
            variant: "primary",
            href: "/join"
          },
          secondary: { 
            label: t("home.hero.sampleButton"), 
            variant: "secondary",
            href: "/samples"
          }
        }}
        media={{ 
          type: "image", 
          src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&crop=center"
        }}
      />

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {featureHighlights.map((feature) => {
          const Icon = feature.icon;
          return (
            <NexCard key={feature.title} variant="outlined" hoverable>
              <NexCardContent className="flex flex-col gap-4 p-6">
                <div className="w-fit rounded-2xl bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </NexCardContent>
            </NexCard>
          );
        })}
      </section>

      {/* Integrations Section */}
      <section className="space-y-8">
        <div className="text-center">
          <NexBadge variant="info" className="mb-4">{t("home.integrations.badge")}</NexBadge>
          <h2 className="text-3xl font-bold mb-4">{t("home.integrations.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.integrations.description")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <NexCard key={index} variant="outlined" hoverable>
                <NexCardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{integration.name}</h3>
                        <NexBadge 
                          variant={integration.status === "active" ? "success" : "warning"}
                          size="sm"
                        >
                          {integration.status === "active" ? t("home.integrations.connected") : t("home.integrations.comingSoon")}
                        </NexBadge>
                      </div>
                      <p className="text-muted-foreground text-sm">{integration.description}</p>
                    </div>
                  </div>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
      </section>

      {/* Analytics Feature Preview Section */}
      <section className="space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <NexBadge variant="info">{t("home.analytics.badge")}</NexBadge>
          <h2 className="text-3xl font-bold">{t("home.analytics.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.analytics.description")}
          </p>
        </div>

        {/* Analytics Preview Card */}
        <NexCard variant="elevated" className="overflow-hidden">
          {/* Preview Header */}
          <div className="relative bg-gradient-to-r from-purple-600/80 via-pink-500/60 to-purple-400/40 p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("home.analytics.dashboardTitle")}</h3>
                  <p className="text-white/70 text-sm">{t("home.analytics.dashboardSubtitle")}</p>
                </div>
              </div>
              <NexBadge variant="secondary" className="bg-white/20 text-white border-white/30">
                {t("home.analytics.preview")}
              </NexBadge>
            </div>
          </div>

          <NexCardContent className="p-6">
            {/* Analytics Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {analyticsFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.title}
                    className={`rounded-xl p-4 border ${feature.lightBg} ${feature.darkBg}`}
                  >
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Mini Charts Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Commit Trend Preview */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t("home.analytics.commitTrend")}</p>
                  <NexBadge variant="success" size="sm">+18%</NexBadge>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={commitTrendData}>
                      <defs>
                        <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C89F9" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#7C89F9" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#7C89F9" 
                        fill="url(#colorCommit)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Developer Activity Preview */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t("home.analytics.developerActivity")}</p>
                  <NexBadge variant="info" size="sm">4명</NexBadge>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={developerData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Bar dataKey="commits" fill="#7C89F9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Case Status Preview */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t("home.analytics.caseStatus")}</p>
                  <NexBadge variant="warning" size="sm">34건</NexBadge>
                </div>
                <div className="h-24 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={caseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {caseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </NexCardContent>
        </NexCard>
      </section>

      {/* Team Highlights Carousel */}
      <section className="space-y-6 md:space-y-8">
        <div className="text-center px-4">
          <NexBadge variant="success" className="mb-3 md:mb-4">{t("home.teamHighlights.badge")}</NexBadge>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{t("home.teamHighlights.title")}</h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.teamHighlights.description")}
          </p>
        </div>

        <NexCarousel
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
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-green-100 dark:bg-green-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.weeklyAchievement.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.weeklyAchievement.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.completedIssues")}</span>
                    <NexBadge variant="success" size="sm">24개</NexBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.deployments")}</span>
                    <NexBadge variant="info" size="sm">12회</NexBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.codeReviews")}</span>
                    <NexBadge variant="secondary" size="sm">89개</NexBadge>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Team Communication */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.teamCommunication.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.teamCommunication.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <p className="text-xs md:text-sm font-medium">#engineering 채널</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">새로운 마이크로서비스 아키텍처 설계 논의</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">#frontend 채널</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">React 18 업그레이드 계획 수립</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">#backend 채널</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">API 성능 최적화 결과 공유</p>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Latest Newsletter */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Mail className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.latestNewsletter.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.latestNewsletter.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.mainTopics")}</span>
                    <span className="ml-1 text-muted-foreground">결제 시스템 개선</span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.participants")}</span>
                    <span className="ml-1 text-muted-foreground">17명</span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.readTime")}</span>
                    <span className="ml-1 text-muted-foreground">3분</span>
                  </div>
                  <NexButton variant="secondary" size="sm" className="w-full mt-2 md:mt-3 cursor-pointer text-xs md:text-sm">
                    {t("home.teamHighlights.latestNewsletter.readButton")}
                  </NexButton>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Code Quality */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.codeQuality.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.codeQuality.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs md:text-sm">{t("home.teamHighlights.codeQuality.testCoverage")}</span>
                      <span className="text-xs md:text-sm font-medium">94%</span>
                    </div>
                    <NexProgress value={94} variant="success" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs md:text-sm">{t("home.teamHighlights.codeQuality.qualityScore")}</span>
                      <span className="text-xs md:text-sm font-medium">A+</span>
                    </div>
                    <NexProgress value={98} variant="default" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.codeQuality.bugFixes")}</span>
                    <NexBadge variant="success" size="sm">15개</NexBadge>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Team Productivity */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.teamProductivity.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.teamProductivity.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary">127</div>
                    <p className="text-xs text-muted-foreground">{t("home.teamHighlights.teamProductivity.commits")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-base md:text-lg font-semibold">18</div>
                      <p className="text-xs text-muted-foreground">{t("home.teamHighlights.teamProductivity.prCreated")}</p>
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-semibold">22</div>
                      <p className="text-xs text-muted-foreground">{t("home.teamHighlights.teamProductivity.prMerged")}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <NexBadge variant="success" size="sm">+15% {t("home.teamHighlights.teamProductivity.vsLastWeek")}</NexBadge>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Innovation Highlights */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Zap className="h-5 w-5 md:h-6 md:w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.innovationHighlights.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.innovationHighlights.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <p className="text-xs md:text-sm font-medium">새로운 도구 도입</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">GitHub Copilot으로 개발 속도 향상</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">프로세스 개선</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">자동화된 배포 파이프라인 구축</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">기술 학습</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">팀 내 TypeScript 워크샵 진행</p>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>
        </NexCarousel>
      </section>

      {/* Individual Activity Section */}
      <section className="space-y-6 md:space-y-8">
        <div className="text-center px-4">
          <NexBadge variant="warning" className="mb-3 md:mb-4">{t("home.individualActivity.badge")}</NexBadge>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{t("home.individualActivity.title")}</h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.individualActivity.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Member 1 */}
          <NexCard variant="outlined" hoverable className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400" />
            <NexCardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  AK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm md:text-base truncate">Alex Kim</p>
                  <p className="text-xs text-muted-foreground">Frontend Lead</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{t("home.individualActivity.commits")}</span>
                  <span className="text-sm font-semibold">28</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{t("home.individualActivity.prReviews")}</span>
                  <span className="text-sm font-semibold">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{t("home.individualActivity.messages")}</span>
                  <span className="text-sm font-semibold">142</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t("home.individualActivity.contribution")}</span>
                  <NexBadge variant="success" size="sm">Top Contributor</NexBadge>
                </div>
              </div>
            </NexCardContent>
          </NexCard>

          {/* Member 2 */}
          <NexCard variant="outlined" hoverable className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-400" />
            <NexCardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  SL
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm md:text-base truncate">Sarah Lee</p>
                  <p className="text-xs text-muted-foreground">Backend Developer</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">커밋</span>
                  <span className="text-sm font-semibold">21</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">PR 리뷰</span>
                  <span className="text-sm font-semibold">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">메시지</span>
                  <span className="text-sm font-semibold">98</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">기여도</span>
                  <NexBadge variant="info" size="sm">Active Reviewer</NexBadge>
                </div>
              </div>
            </NexCardContent>
          </NexCard>

          {/* Member 3 */}
          <NexCard variant="outlined" hoverable className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
            <NexCardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  MT
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm md:text-base truncate">Mike Tanaka</p>
                  <p className="text-xs text-muted-foreground">DevOps Engineer</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">커밋</span>
                  <span className="text-sm font-semibold">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">PR 리뷰</span>
                  <span className="text-sm font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">메시지</span>
                  <span className="text-sm font-semibold">67</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">기여도</span>
                  <NexBadge variant="warning" size="sm">Deploy Master</NexBadge>
                </div>
              </div>
            </NexCardContent>
          </NexCard>

          {/* Member 4 */}
          <NexCard variant="outlined" hoverable className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400" />
            <NexCardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  JP
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm md:text-base truncate">Jenny Park</p>
                  <p className="text-xs text-muted-foreground">QA Engineer</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">커밋</span>
                  <span className="text-sm font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">PR 리뷰</span>
                  <span className="text-sm font-semibold">31</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">메시지</span>
                  <span className="text-sm font-semibold">156</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">기여도</span>
                  <NexBadge variant="secondary" size="sm">Bug Hunter</NexBadge>
                </div>
              </div>
            </NexCardContent>
          </NexCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <NexCard 
          variant="elevated" 
          className="p-12 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 dark:from-slate-900/50 dark:via-gray-900/30 dark:to-slate-900/50 shadow-xl shadow-primary/10"
        >
          <NexCardContent className="space-y-8">
            <div className="space-y-4">
              <NexBadge variant="info" className="mb-2">{t("home.cta.badge")}</NexBadge>
              <h2 className="text-3xl font-bold">
                {t("home.cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("home.cta.description")}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NexButton 
                variant="primary" 
                size="lg" 
                className="cursor-pointer"
                onClick={() => navigate("/join")}
              >
                <Calendar className="h-5 w-5 mr-2" />
                {t("home.cta.getStarted")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </NexButton>
              <NexButton 
                variant="secondary" 
                size="lg"
                className="cursor-pointer"
                onClick={() => navigate("/samples")}
              >
                <Mail className="h-5 w-5 mr-2" />
                {t("home.cta.viewSamples")}
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>
    </div>
  );
}
