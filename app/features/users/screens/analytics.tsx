import { CalendarRange, GitCommit, MailCheck, MessageSquareDot, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { data, redirect } from 'react-router';
import {
  NexAreaChart,
  NexAreaChartGradient,
  NexBadge,
  NexBarChart,
  NexCard,
  NexCardContent,
  NexCardHeader,
  NexCardTitle,
  NexLineChart,
  NexPieChartLabelList
} from '~/core/components/nex';
import makeServerClient from '~/core/lib/supa-client.server';
import {
  getHighlightsCount,
  getHighlightsMetadata,
  getSentEmailMetadata
} from '~/features/contents/db/queries';
import { getWorkspace } from '~/features/settings/db/queries';
import {
  addColorToGithubCaseData,
  calculateMemberStats,
  createGithubCaseCommitData,
  createGithubCommitRaw,
  createGithubDeveloperCommitData,
  createSlackChannelActivityData,
  createSlackChannelSummaryData,
  createWeeklyStatsCardData,
  extractEmailSentData,
  extractGitHubKpiData,
  extractSlackActivityData
} from '../lib/utils';
import type { Route } from './+types/analytics';

export const meta: Route.MetaFunction = () => {
  return [{ title: `Analytics | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const emailMetadata = await getSentEmailMetadata(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 4 });
  const slackActivity = await getHighlightsMetadata(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 8, source: 'slack-activity' });
  const githubKpi = await getHighlightsMetadata(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 8, source: 'github-kpi' });
  const highlightsCount = await getHighlightsCount(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 1, source: 'slack' });
  return data({ emailMetadata: emailMetadata || null, slackActivity, githubKpi, highlightsCount });
};

export default function AnalyticsScreen( { loaderData }: Route.ComponentProps ) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "analytics" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { t: tTimes } = useTranslation("common", { keyPrefix: "times" });
  const { emailMetadata, slackActivity, githubKpi, highlightsCount } = loaderData;
  const emailSummary = extractEmailSentData(emailMetadata) || {
    emailSentCount: 0,
    emailSentMemberCount: 0,
    emailSentRange: "",
    latestPeriodKey: "",
    perPeriod: [],
  };
  
  const githubSummary = extractGitHubKpiData(githubKpi) || {
    latest: null,
    perPeriod: [],
  };
  
  const slackSummary = extractSlackActivityData(slackActivity) || {
    latest: null,
    perPeriod: [],
  };

  const { emailSentCount, emailSentMemberCount, emailSentRange } = emailSummary;
  const hasEmailMetadata = emailSentCount > 0;
  const commitCount: number = typeof githubSummary.latest?.meta?.totalCommits === 'number' 
    ? githubSummary.latest.meta.totalCommits 
    : 0;
  
  // GitHub 커밋 추이 데이터 준비 (안전한 기본값)
  const githubCommitData = Array.isArray(githubSummary.perPeriod) 
    ? createGithubCommitRaw(githubSummary.perPeriod) 
    : [];
  const githubDeveloperData = Array.isArray(githubSummary.perPeriod)
    ? createGithubDeveloperCommitData(githubSummary.perPeriod, 5, 1)
    : [];
  const githubCaseData = Array.isArray(githubSummary.perPeriod)
    ? createGithubCaseCommitData(githubSummary.perPeriod)
    : [];
  const githubCaseDataWithColor = addColorToGithubCaseData(githubCaseData);

  // Slack 데이터 준비 (안전한 기본값)
  const slackActivityData = Array.isArray(slackSummary.perPeriod)
    ? createSlackChannelActivityData(slackSummary.perPeriod)
    : [];
  const totalMessageCount = slackActivityData.length > 0 ? slackActivityData[slackActivityData.length - 1]?.value ?? 0 : 0;
  const slackChannelSummaryData = Array.isArray(slackSummary.perPeriod)
    ? createSlackChannelSummaryData(slackSummary.perPeriod)
    : [];
  
  // 발송 멤버 수의 평균값과 성장률 계산
  const { averageMemberCount, growthRate, isGrowth, isNoChange } = Array.isArray(emailSummary.perPeriod)
    ? calculateMemberStats(emailSummary.perPeriod)
    : { averageMemberCount: 0, growthRate: 0, isGrowth: false, isNoChange: true };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 space-y-6">
      {/* 페이지 헤더 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#667eea] to-[#764ba2] p-8 text-white ">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-white/80 text-sm">{t("description")}</p>
            </div>
          </div>
        </div>
        
        {/* 배경 장식 요소 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {!hasEmailMetadata ? (
        <NexCard variant="outlined" className="p-10 text-center space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <CalendarRange className="h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("noData")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              {t("noDataDescription")}
              <br />
              {t("noDataDescription2")}
            </p>
          </div>
        </NexCard>
      ) : (
      <>
      {/* 이번 주 통계 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <CalendarRange className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("thisWeekStatistics")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {emailSentRange || t("checkDataCollectionPeriod")}
            </p>
          </div>
        </div>
      </div>
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {createWeeklyStatsCardData(
            {
              commitCount,
              totalMessageCount,
              highlightsCount: typeof highlightsCount === 'number' ? highlightsCount : 0,
              emailSentCount,
              emailSentMemberCount,
            },
            {
              gitCommit: GitCommit,
              messageSquareDot: MessageSquareDot,
              sparkles: Sparkles,
              mailCheck: MailCheck,
            },
            {
              githubCommit: { label: t("statsCard.githubCommit.label"), subLabel: t("statsCard.githubCommit.subLabel") },
              slackMessage: { label: t("statsCard.slackMessage.label"), subLabel: t("statsCard.slackMessage.subLabel") },
              slackHighlight: { label: t("statsCard.slackHighlight.label"), subLabel: t("statsCard.slackHighlight.subLabel") },
              newsletterSent: { label: t("statsCard.newsletterSent.label"), subLabel: t("statsCard.newsletterSent.subLabel") },
            }
          ).map(({ label, value, subLabel, icon: Icon, iconBg, iconColor }) => (
            <NexCard key={label} variant="outlined" className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-1">
                    {typeof value === "number" ? value.toLocaleString() : "0"}
                  </p>
                </div>
                <div className={`h-12 w-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
              </div>
              {subLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subLabel}
                </p>
              )}
            </NexCard>
          ))}
        </div>
      </section>

      {/* GitHub 지표 섹션 */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
            <span className="text-white dark:text-gray-900 text-sm font-bold">G</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("githubDevelopmentActivity")}
          </h2>
          {/*<NexBadge variant="secondary" size="sm">실시간</NexBadge>*/}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 주간 커밋 현황 */}
          <NexCard variant="elevated" className="p-6">
            <NexCardHeader>
              <NexCardTitle>{t("weeklyCommitStatus")}</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("recent8WeeksCommitStatus")}
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubCommitData.length > 0 ? (
                <NexAreaChartGradient 
                  data={githubCommitData}
                  className="h-64"
                  dataName={commonT("commits")}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">{t("noData")}</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 개발자별 커밋수 */}
          <NexCard variant="elevated" className="p-6">
            <NexCardHeader>
              <NexCardTitle>{t("developerCommitStatus")}</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("thisWeekDeveloperCommitStatus")}
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubDeveloperData.length > 0 ? (
                <NexBarChart 
                  data={githubDeveloperData}
                  className="h-64"
                  barName={commonT("commits")}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">{t("noData")}</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 케이스별 개발 현황 */}
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>{t("caseDevelopmentStatus")}</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("thisWeekCaseDevelopmentStatus")}
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubCaseDataWithColor.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NexPieChartLabelList 
                    data={githubCaseDataWithColor}
                    className="h-64"
                    barName={commonT("commits")}
                  />
                  <div className="space-y-4">
                    {githubCaseDataWithColor.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </span>
                        </div>
                        <NexBadge variant="outline" size="sm">
                          {item.value}건
                        </NexBadge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">{t("noData")}</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 라벨별 이슈 분포 */}
          {/*
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>이슈 라벨별 분포</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                현재 열린 이슈들의 카테고리별 현황
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NexPieChartLabelList 
                  data={gitHubIssuesByLabel}
                  className="h-64"
                />
                <div className="space-y-4">
                  {gitHubIssuesByLabel.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <NexBadge variant="outline" size="sm">
                        {item.value}개
                      </NexBadge>
                    </div>
                  ))}
                </div>
              </div>
            </NexCardContent>
          </NexCard>
          */}
        </div>
      </section>

      {/* Slack 지표 섹션 */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#4A154B] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("slackCommunicationStatus")}
          </h2>
        </div>

        <NexCard variant="elevated" className="p-6">
          <NexCardHeader>
            <NexCardTitle>{t("messageAndReactionActivity")}</NexCardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("recent8WeeksMessageAndReactionCountTrend")}
            </p>
          </NexCardHeader>
          <NexCardContent className="mt-6">
            {slackActivityData.length > 0 ? (
              <NexAreaChart 
                data={slackActivityData}
                className="h-80"
                dataName={[commonT("message"), commonT("reaction")]}
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">{t("noData")}</p>
              </div>
            )}
          </NexCardContent>
        </NexCard>
          
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("channelSummary")}
              </h3>
              <NexBadge variant="secondary" size="sm">
                {slackChannelSummaryData.length} {t("channels")}
              </NexBadge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slackChannelSummaryData.length > 0 ? (
              slackChannelSummaryData.map((stat, index) => (
                <NexCard key={index} variant="elevated" className="p-5 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: 
                              stat.color === 'primary' ? '#3B82F6' :
                              stat.color === 'success' ? '#10B981' :
                              stat.color === 'warning' ? '#F59E0B' :
                              stat.color === 'info' ? '#06B6D4' :
                              '#8B5CF6'
                          }}
                        />
                        <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {stat.channel}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{commonT("message")}</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stat.messages.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{commonT("reaction")}</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stat.reactions.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </NexCard>
              ))
            ) : (
              <div className="col-span-full">
                <NexCard variant="outlined" className="p-10 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <MessageSquareDot className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("noChannelData")}
                    </p>
                  </div>
                </NexCard>
              </div>
            )}
          </div>
        </section>
      </section>

      {/* 뉴스레터 지표 섹션 */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">📧</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("newsletterStatus")}
          </h2>
          {/*<NexBadge variant="success" size="sm">성장 중</NexBadge>*/}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 발송/열람 추이 */}
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>{t("emailSentTrend")}</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("recent4WeeksEmailSentTrend")}
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {Array.isArray(emailSummary.perPeriod) && emailSummary.perPeriod.length > 0 ? (
              <NexLineChart 
                  data={emailSummary.perPeriod.slice().reverse().map(period => ({
                    name: period.periodKey?.replace('2025-', '') || '',
                    users: period.count || 0,
                    revenue: period.memberCount || 0
                  }))}
                className="h-64"
                dataName={[commonT("emailSentCount"), commonT("emailSentMemberCount")]}
              />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">{t("noData")}</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 핵심 지표 요약 */}
          
          <div className="space-y-4">
            
            <NexCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("averageMemberCount")}
                  </span>
                  <NexBadge variant="info" size="sm">{tTimes("weekly")}</NexBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {averageMemberCount.toLocaleString()}
                </div>
                {(growthRate !== 0 || isNoChange) && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("lastWeekComparison")}
                    </div>
                    {isNoChange ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("noChange")}
                      </div>
                    ) : (
                      <div className={`text-sm ${isGrowth ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isGrowth ? '+' : ''}{growthRate.toFixed(1)}% {isGrowth ? commonT("increase") : commonT("decrease")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </NexCard>
            {/*
            <NexCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 발송 수
                  </span>
                  <NexBadge variant="info" size="sm">주간</NexBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,210
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  +5.2% 성장
                </div>
              </div>
            </NexCard>

            <NexCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 열람률
                  </span>
                  <NexBadge variant="success" size="sm">우수</NexBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  66.2%
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  +2.1% 향상
                </div>
              </div>
            </NexCard>

            <NexCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 클릭률
                  </span>
                  <NexBadge variant="warning" size="sm">개선 필요</NexBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  66.2%
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  -1.3% 감소
                </div>
              </div>
            </NexCard>
            */}
          </div>
        </div>
      </section>

      </>
      )}
    </div>
  );
}

