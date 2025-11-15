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
  NexPieChartLabelList,
  chartColors,
} from '~/core/components/nex';
import makeServerClient from '~/core/lib/supa-client.server';
import { getHighlightsCount, getHighlightsMetadata, getSentEmailMetadata } from '~/features/contents/db/queries';
import { getWorkspace } from '~/features/settings/db/queries';
import { newsletterMetrics, slackChannelActivity } from '~/features/users/lib/mockdata';
import { createGithubCaseCommitData, createGithubCommitRaw, createGithubDeveloperCommitData, extractEmailSentData, extractGitHubKpiData, extractSlackActivityData } from '../lib/utils';
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
  const slackActivity = await getHighlightsMetadata(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 4, source: 'slack-activity' });
  const githubKpi = await getHighlightsMetadata(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 8, source: 'github-kpi' });
  const highlightsCount = await getHighlightsCount(client, { workspaceId: workspaceId, period: 'weekly', periodNumber: 1, source: 'slack' });
  return data({ emailMetadata: emailMetadata || null, slackActivity, githubKpi, highlightsCount });
};

export default function AnalyticsScreen( { loaderData }: Route.ComponentProps ) {
  const { emailMetadata, slackActivity, githubKpi, highlightsCount } = loaderData;

  const emailSummary = extractEmailSentData(emailMetadata);
  const githubSummary = extractGitHubKpiData(githubKpi);
  const slackSummary = extractSlackActivityData(slackActivity);
  
  const { emailSentCount, emailSentMemberCount, emailSentRange } = emailSummary;
  const hasEmailMetadata = emailSentCount > 0;
  const commitCount = githubSummary.latest?.meta.totalCommits ?? 0;
  
  // GitHub 커밋 추이 데이터 준비 (최근 8주간)
  const githubCommitData = createGithubCommitRaw(githubSummary.perPeriod);
  const githubCaseData = createGithubCaseCommitData(githubSummary.perPeriod);
  const caseColorPalette = [
    chartColors.primary[0],        // Nex Blue
    '#0EA5E9',                     // Sky Blue
    chartColors.success[0],        // Emerald
    chartColors.warning[0],        // Amber
    '#F472B6',                     // Pink
    chartColors.primary[1],
    '#22D3EE',                     // Cyan
    chartColors.success[1],
    '#FB923C',                     // Orange
    '#C084FC',                     // Soft Purple
  ];
  const githubCaseDataWithColor = githubCaseData.map((item, index) => ({
    ...item,
    color: caseColorPalette[index % caseColorPalette.length],
  }));
  const githubDeveloperData = createGithubDeveloperCommitData(githubSummary.perPeriod);
  const slackActivities = slackSummary.latest?.activities ?? [];
  const slackRange = slackSummary.latest?.range ?? "";
  const totalMessageCount = slackActivities.reduce<number>((sum, activity) => {
    if (activity && typeof activity === "object" && !Array.isArray(activity)) {
      const value = (activity as Record<string, unknown>).messageCount;
      if (typeof value === "number") {
        return sum + value;
      }
    }
    return sum;
  }, 0);

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
          {[
            {
              label: "GitHub 커밋",
              value: commitCount,
              subLabel: "커밋 총 개수",
              icon: GitCommit,
              iconBg: "bg-blue-100 dark:bg-blue-900/40",
              iconColor: "text-blue-600 dark:text-blue-300",
            },
            {
              label: "Slack 메시지",
              value: totalMessageCount,
              subLabel: "주고받은 메시지 총 개수",
              icon: MessageSquareDot,
              iconBg: "bg-green-100 dark:bg-green-900/40",
              iconColor: "text-green-600 dark:text-green-300",
            },
            {
              label: "Slack 하이라이트",
              value: highlightsCount,
              subLabel: "수집된 하이라이트 수",
              icon: Sparkles,
              iconBg: "bg-purple-100 dark:bg-purple-900/40",
              iconColor: "text-purple-600 dark:text-purple-300",
            },
            {
              label: "뉴스레터 발송",
              value: emailSentCount,
              subLabel: "발송 대상자 수 : " + emailSentMemberCount,
              icon: MailCheck,
              iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
              iconColor: "text-indigo-600 dark:text-indigo-300",
            },
            /*
            {
              label: "발송 대상 수",
              value: emailSentMemberCount,
              subLabel: "총 누적 대상자",
              icon: Users,
              iconBg: "bg-amber-100 dark:bg-amber-900/40",
              iconColor: "text-amber-600 dark:text-amber-300",
            },
            */
          ].map(({ label, value, subLabel, icon: Icon, iconBg, iconColor }) => (
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
                최근 4주간 개발자별 커밋 현황
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
          <NexBadge variant="success" size="sm">활성</NexBadge>
        </div>

        <NexCard variant="elevated" className="p-6">
          <NexCardHeader>
            <NexCardTitle>채널별 메시지 활동</NexCardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              최근 7일간 채널별 메시지 수 추이
            </p>
          </NexCardHeader>
          <NexCardContent className="mt-6">
            <NexAreaChart 
              data={slackChannelActivity.map(day => ({
                name: day.date,
                value: day.general + day.development,
                value2: day.design + day.random
              }))}
              className="h-80"
            />
          </NexCardContent>
        </NexCard>

        {/* 채널별 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { channel: '#general', messages: 325, reactions: 89, color: 'primary' },
            { channel: '#development', messages: 481, reactions: 156, color: 'success' },
            { channel: '#design', messages: 178, reactions: 67, color: 'warning' },
            { channel: '#random', messages: 170, reactions: 45, color: 'info' }
          ].map((stat, index) => (
            <NexCard key={index} variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.channel}
                  </span>
                  <NexBadge variant={stat.color as any} size="sm">
                    활성
                  </NexBadge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">메시지</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stat.messages}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">리액션</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stat.reactions}
                    </span>
                  </div>
                </div>
              </div>
            </NexCard>
          ))}
        </div>
      </section>

      {/* 뉴스레터 지표 섹션 */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">📧</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            뉴스레터 성과
          </h2>
          <NexBadge variant="success" size="sm">성장 중</NexBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 발송/열람 추이 */}
          <NexCard variant="elevated" className="p-6 lg:col-span-2">
            <NexCardHeader>
              <NexCardTitle>발송 및 열람률 추이</NexCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                최근 4주간 뉴스레터 성과 변화
              </p>
            </NexCardHeader>
            <NexCardContent className="mt-6">
              <NexLineChart 
                data={newsletterMetrics.map(metric => ({
                  name: metric.week,
                  users: metric.sent,
                  revenue: metric.opened
                }))}
                className="h-64"
              />
            </NexCardContent>
          </NexCard>

          {/* 핵심 지표 요약 */}
          <div className="space-y-4">
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
          </div>
        </div>
      </section>

      </>
      )}
    </div>
  );
}
