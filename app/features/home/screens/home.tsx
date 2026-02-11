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
  GitBranch,
  GitCommit,
  Layers,
  Mail,
  MessageCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
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
  NexHero
} from "~/core/components/nex";
import i18next from "~/core/lib/i18next.server";
import type { TopUserActivity } from "~/core/lib/types";
import { CONTRIBUTION_KINDS, CONTRIBUTION_KIND_MAP } from "~/core/processes/lib/constants";
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
    title: t("home.title"),
    subtitle: t("home.subtitle"),
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

  // topUserActivity format: [{ TopDeveloper: { name, nums } }, { BugHunter: { name, nums } }, ...]
  const topUserActivity: TopUserActivity = [
    { TopDeveloper: { name: "Alex Kim", nums: 28 } },
    { BugHunter: { name: "Jenny Park", nums: 11 } },
    { ChatChamp: { name: "Sarah Lee", nums: 156 } },
    { ReactionPro: { name: "Mike Tanaka", nums: 45 } },
  ];
  const individualActivityItems = useMemo(
    () =>
      CONTRIBUTION_KINDS.map((kind, i) => {
        const entry = topUserActivity[i] as Record<string, { name: string; nums: number }>;
        const item = entry?.[kind] ?? { name: "", nums: 0 };
        return { kind, name: item.name, nums: item.nums };
      }),
    [topUserActivity]
  );
  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "—";

  // Feature highlights with icon mapping
  const featureHighlights = useMemo(() => 
    homeFeatureHighlights.map(item => ({
      ...item,
      icon: iconMap[item.iconName],
      title: t(item.titleKey),
      description: t(item.descriptionKey)
    })), [iconMap, t]
  );

  // Integrations with icon mapping
  const integrations = useMemo(() => 
    homeIntegrations.map(item => ({
      ...item,
      icon: iconMap[item.iconName],
      name: t(item.nameKey),
      description: t(item.descriptionKey)
    })), [iconMap, t]
  );

  // Analytics features with icon mapping
  const analyticsFeatures = useMemo(() => 
    homeAnalyticsFeatures.map(item => ({
      ...item,
      icon: iconMap[item.iconName],
      title: t(item.titleKey),
      description: t(item.descriptionKey)
    })), [iconMap, t]
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
        {featureHighlights.map((feature, index) => {
          const Icon = feature.icon;
          const isHighlighted = index === 1; // AI 기반 요약 카드 강조
          
          return (
            <NexCard 
              key={feature.titleKey}
              variant="outlined" 
              hoverable
              className={`relative transition-all duration-300 ${
                isHighlighted 
                  ? 'border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.06]' 
                  : ''
              }`}
            >
              <NexCardContent className="flex flex-col gap-4 p-6">
                {/* Subtle featured indicator */}
                {isHighlighted && (
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-medium tracking-wider text-primary/70 uppercase">
                      Core
                    </span>
                  </div>
                )}
                
                <div className={`w-fit rounded-2xl p-3 transition-colors ${
                  isHighlighted 
                    ? 'bg-primary/20' 
                    : 'bg-primary/10'
                }`}>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isHighlighted ? 'text-primary' : ''}`}>
                    {feature.title}
                  </h3>
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
          <div className="relative bg-gradient-to-r from-purple-600/70 via-pink-500/50 to-purple-400/30 p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/15 to-transparent" />
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
                    key={feature.titleKey}
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
                          <stop offset="5%" stopColor="#8B96F5" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#8B96F5" stopOpacity={0.08}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8B96F5" 
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
                  <NexBadge variant="info" size="sm">4{t("common.people")}</NexBadge>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={developerData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Bar dataKey="commits" fill="#8B96F5" radius={[0, 4, 4, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Case Status Preview */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t("home.analytics.caseStatus")}</p>
                  <NexBadge variant="warning" size="sm">34{t("common.count")}</NexBadge>
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
        {/* Staged Release Notice */}
        <p className="text-center text-xs text-muted-foreground">
          {t("home.analytics.stagedRelease")}
        </p>
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
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.commits")}</span>
                    <NexBadge variant="success" size="sm">56{t("common.count")}</NexBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.prMerged")}</span>
                    <NexBadge variant="info" size="sm">12{t("common.count")}</NexBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">{t("home.teamHighlights.weeklyAchievement.participants")}</span>
                    <NexBadge variant="secondary" size="sm">12{t("common.people")}</NexBadge>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Highlight of the week */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.latestNewsletter.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.latestNewsletter.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.mainTopics")}</span>
                    <span className="ml-1 text-muted-foreground">{t("home.teamHighlights.latestNewsletter.sampleMainTopic")}</span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.participants")}</span>
                    <span className="ml-1 text-muted-foreground">7{t("common.people")}</span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <span className="font-medium">{t("home.teamHighlights.latestNewsletter.summary")}</span>
                    <span className="ml-1 text-muted-foreground">{t("home.teamHighlights.latestNewsletter.sampleSummary")}</span>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Topics of the week */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Zap className="h-5 w-5 md:h-6 md:w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.topicsOfTheWeek.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.topicsOfTheWeek.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.topicsOfTheWeek.topic1Title")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.topicsOfTheWeek.topic1Description")}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.topicsOfTheWeek.topic2Title")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.topicsOfTheWeek.topic2Description")}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.topicsOfTheWeek.topic3Title")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.topicsOfTheWeek.topic3Description")}</p>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Communication of the week */}
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
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.teamCommunication.channel1")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.teamCommunication.channel1Description")}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.teamCommunication.channel2")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.teamCommunication.channel2Description")}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium">{t("home.teamHighlights.teamCommunication.channel3")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t("home.teamHighlights.teamCommunication.channel3Description")}</p>
                  </div>
                </div>
              </NexCardContent>
            </NexCard>
          </NexCarouselItem>

          {/* Ongoing & Roadmap */}
          <NexCarouselItem>
            <NexCard variant="elevated" className="mx-1 md:mx-2 h-full">
              <NexCardContent className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20 mr-3 md:mr-4 flex-shrink-0">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold">{t("home.teamHighlights.roadmap.title")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("home.teamHighlights.roadmap.subtitle")}</p>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{t("home.teamHighlights.roadmap.project1Title")}</p>
                      <p className="text-xs text-muted-foreground">{t("home.teamHighlights.roadmap.project1Progress")}</p>
                    </div>
                    <NexBadge variant="warning" size="sm">{t("home.teamHighlights.roadmap.project1Status")}</NexBadge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{t("home.teamHighlights.roadmap.project2Title")}</p>
                      <p className="text-xs text-muted-foreground">{t("home.teamHighlights.roadmap.project2Schedule")}</p>
                    </div>
                    <NexBadge variant="info" size="sm">{t("home.teamHighlights.roadmap.project2Status")}</NexBadge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{t("home.teamHighlights.roadmap.project3Title")}</p>
                      <p className="text-xs text-muted-foreground">{t("home.teamHighlights.roadmap.project3Schedule")}</p>
                    </div>
                    <NexBadge variant="secondary" size="sm">{t("home.teamHighlights.roadmap.project3Status")}</NexBadge>
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
          {individualActivityItems.map(({ kind, name, nums }) => {
            const meta = CONTRIBUTION_KIND_MAP[kind];
            const metricLabelKey =
              kind === "TopDeveloper"
                ? "home.individualActivity.commits"
                : kind === "ChatChamp"
                  ? "home.individualActivity.messages"
                  : kind === "BugHunter"
                    ? "home.individualActivity.metricCases"
                    : "home.individualActivity.metricReactions";
            return (
              <NexCard key={kind} variant="outlined" hoverable className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${meta.gradient}`} />
                <NexCardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white font-bold text-sm md:text-base`}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm md:text-base truncate">{name || "—"}</p>
                      <NexBadge variant="outline" size="sm" className={meta.badgeClassName}>
                        {meta.label}
                      </NexBadge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{t(metricLabelKey)}</span>
                      <span className="text-sm font-semibold">{nums}</span>
                    </div>
                  </div>
                </NexCardContent>
              </NexCard>
            );
          })}
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
