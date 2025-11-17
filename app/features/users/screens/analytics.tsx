import { CalendarRange, GitCommit, MailCheck, MessageSquareDot, Sparkles } from 'lucide-react';
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
  const { emailMetadata, slackActivity, githubKpi, highlightsCount } = loaderData;

  const emailSummary = extractEmailSentData(emailMetadata);
  //console.log('emailSummary', emailSummary);
  const githubSummary = extractGitHubKpiData(githubKpi);
  const slackSummary = extractSlackActivityData(slackActivity);
  //console.log('slackSummary', slackSummary.latest?.activities);

  const { emailSentCount, emailSentMemberCount, emailSentRange } = emailSummary;
  const hasEmailMetadata = emailSentCount > 0;
  const commitCount: number = typeof githubSummary.latest?.meta?.totalCommits === 'number' 
    ? githubSummary.latest.meta.totalCommits 
    : 0;
  
  // GitHub 커밋 추이 데이터 준비
  const githubCommitData = createGithubCommitRaw(githubSummary.perPeriod);
  const githubDeveloperData = createGithubDeveloperCommitData(githubSummary.perPeriod, 5, 1);
  const githubCaseData = createGithubCaseCommitData(githubSummary.perPeriod);
  const githubCaseDataWithColor = addColorToGithubCaseData(githubCaseData);

  // Slack 데이터 준비
  const slackActivityData = createSlackChannelActivityData(slackSummary.perPeriod);
  const totalMessageCount = slackActivityData.length > 0 ? slackActivityData[slackActivityData.length - 1]?.value ?? 0 : 0;
  const slackChannelSummaryData = createSlackChannelSummaryData(slackSummary.perPeriod);

  // 발송 멤버 수의 평균값과 성장률 계산
  const { averageMemberCount, growthRate, isGrowth, isNoChange } = calculateMemberStats(emailSummary.perPeriod);

  return (
    <div className="p-6 space-y-8">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📊 Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          GitHub, Slack, 뉴스레터의 주요 지표들을 한눈에 확인하세요
        </p>
      </div>

      {!hasEmailMetadata ? (
        <NexCard variant="outlined" className="p-10 text-center space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <CalendarRange className="h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              아직 통계 데이터가 준비되지 않았어요
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              최근 기간에 발송된 뉴스레터가 없거나 데이터 수집이 진행 중입니다.
              뉴스레터를 발송하면 이곳에서 실시간 통계를 확인할 수 있습니다.
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
              이번 주의 통계
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {emailSentRange || "데이터 수집 기간을 확인하세요"}
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
              highlightsCount,
              emailSentCount,
              emailSentMemberCount,
            },
            {
              gitCommit: GitCommit,
              messageSquareDot: MessageSquareDot,
              sparkles: Sparkles,
              mailCheck: MailCheck,
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
            GitHub 개발 활동
          </h2>
          <NexBadge variant="secondary" size="sm">실시간</NexBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 주간 커밋 현황 */}
          <NexCard variant="elevated" className="p-6">
            <NexCardHeader>
              <NexCardTitle>주간 커밋 현황</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                최근 8주간 커밋 현황
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubCommitData.length > 0 ? (
                <NexAreaChartGradient 
                  data={githubCommitData}
                  className="h-64"
                  dataName="commits"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">데이터가 없습니다</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 개발자별 커밋수 */}
          <NexCard variant="elevated" className="p-6">
            <NexCardHeader>
              <NexCardTitle>개발자별 커밋수</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                이번 주 개발자별 커밋 현황
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubDeveloperData.length > 0 ? (
                <NexBarChart 
                  data={githubDeveloperData}
                  className="h-64"
                  barName="commits"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">데이터가 없습니다</p>
                </div>
              )}
            </NexCardContent>
          </NexCard>

          {/* 케이스별 개발 현황 */}
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>케이스별 개발 현황</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                이번주 케이스별 개발 현황
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              {githubCaseDataWithColor.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NexPieChartLabelList 
                    data={githubCaseDataWithColor}
                    className="h-64"
                    barName="commits"
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
                  <p className="text-sm">데이터가 없습니다</p>
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
            Slack 소통 현황
          </h2>
        </div>

        <NexCard variant="elevated" className="p-6">
          <NexCardHeader>
            <NexCardTitle>메시지 및 리액션 활동</NexCardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              최근 8주간 메시지 및 리액션 수 추이
            </p>
          </NexCardHeader>
          <NexCardContent className="mt-6">
            {slackActivityData.length > 0 ? (
              <NexAreaChart 
                data={slackActivityData}
                className="h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">데이터가 없습니다</p>
              </div>
            )}
          </NexCardContent>
        </NexCard>
          {/* 채널별 통계 요약 */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                채널별 통계 요약
              </h3>
              <NexBadge variant="secondary" size="sm">
                {slackChannelSummaryData.length}개 채널
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">메시지</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stat.messages.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">리액션</span>
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
                      채널 데이터가 없습니다
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
            뉴스레터 현황
          </h2>
          {/*<NexBadge variant="success" size="sm">성장 중</NexBadge>*/}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 발송/열람 추이 */}
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>발송추이</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                최근 4주간 뉴스레터 발송 추이
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              <NexLineChart 
                data={emailSummary.perPeriod.length > 0 
                  ? emailSummary.perPeriod.slice().reverse().map(period => ({
                      name:  period.periodKey.replace('2025-', ''),
                      users: period.count,
                      revenue: period.memberCount
                    }))
                  : []
                }
                className="h-64"
                dataName={["발송수", "멤버수"]}
              />
            </NexCardContent>
          </NexCard>

          {/* 핵심 지표 요약 */}
          
          <div className="space-y-4">
            
            <NexCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 발송 멤버 수
                  </span>
                  <NexBadge variant="info" size="sm">주간</NexBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {averageMemberCount.toLocaleString()}
                </div>
                {(growthRate !== 0 || isNoChange) && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      지난 주 대비
                    </div>
                    {isNoChange ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        변화 없음
                      </div>
                    ) : (
                      <div className={`text-sm ${isGrowth ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isGrowth ? '+' : ''}{growthRate.toFixed(1)}% {isGrowth ? '증가' : '감소'}
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
