import React from 'react';
import { 
  LinearCard, 
  LinearCardHeader, 
  LinearCardTitle, 
  LinearCardContent,
  LinearBarChart,
  LinearPieChartLabelList,
  LinearAreaChart,
  LinearLineChart,
  LinearBadge
} from '~/core/components/linear';
import { gitHubCommitsByDeveloper, gitHubCommitsByRepo, gitHubIssuesByLabel, slackChannelActivity, newsletterMetrics } from '~/features/users/lib/mockdata';

export default function AnalyticsScreen() {
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

      {/* GitHub 지표 섹션 */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
            <span className="text-white dark:text-gray-900 text-sm font-bold">G</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            GitHub 개발 활동
          </h2>
          <LinearBadge variant="secondary" size="sm">실시간</LinearBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 개발자별 커밋수 */}
          <LinearCard variant="elevated" className="p-6">
            <LinearCardHeader>
              <LinearCardTitle>개발자별 커밋수</LinearCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                이번 달 기준 커밋 활동
              </p>
            </LinearCardHeader>
            <LinearCardContent className="mt-6">
              <LinearBarChart 
                data={gitHubCommitsByDeveloper.map(dev => ({ 
                  name: dev.name, 
                  desktop: dev.commits,
                  mobile: dev.additions 
                }))}
                className="h-64"
              />
            </LinearCardContent>
          </LinearCard>

          {/* 레포별 커밋 분포 */}
          <LinearCard variant="elevated" className="p-6">
            <LinearCardHeader>
              <LinearCardTitle>레포지토리별 커밋 분포</LinearCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                프로젝트별 개발 비중
              </p>
            </LinearCardHeader>
            <LinearCardContent className="mt-6">
              <LinearPieChartLabelList 
                data={gitHubCommitsByRepo}
                className="h-64"
              />
            </LinearCardContent>
          </LinearCard>

          {/* 라벨별 이슈 분포 */}
          <LinearCard variant="elevated" className="p-6 lg:col-span-2">
            <LinearCardHeader>
              <LinearCardTitle>이슈 라벨별 분포</LinearCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                현재 열린 이슈들의 카테고리별 현황
              </p>
            </LinearCardHeader>
            <LinearCardContent className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LinearPieChartLabelList 
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
                      <LinearBadge variant="outline" size="sm">
                        {item.value}개
                      </LinearBadge>
                    </div>
                  ))}
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>
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
          <LinearBadge variant="success" size="sm">활성</LinearBadge>
        </div>

        <LinearCard variant="elevated" className="p-6">
          <LinearCardHeader>
            <LinearCardTitle>채널별 메시지 활동</LinearCardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              최근 7일간 채널별 메시지 수 추이
            </p>
          </LinearCardHeader>
          <LinearCardContent className="mt-6">
            <LinearAreaChart 
              data={slackChannelActivity.map(day => ({
                name: day.date,
                value: day.general + day.development,
                value2: day.design + day.random
              }))}
              className="h-80"
            />
          </LinearCardContent>
        </LinearCard>

        {/* 채널별 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { channel: '#general', messages: 325, reactions: 89, color: 'primary' },
            { channel: '#development', messages: 481, reactions: 156, color: 'success' },
            { channel: '#design', messages: 178, reactions: 67, color: 'warning' },
            { channel: '#random', messages: 170, reactions: 45, color: 'info' }
          ].map((stat, index) => (
            <LinearCard key={index} variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.channel}
                  </span>
                  <LinearBadge variant={stat.color as any} size="sm">
                    활성
                  </LinearBadge>
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
            </LinearCard>
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
          <LinearBadge variant="success" size="sm">성장 중</LinearBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 발송/열람 추이 */}
          <LinearCard variant="elevated" className="p-6 lg:col-span-2">
            <LinearCardHeader>
              <LinearCardTitle>발송 및 열람률 추이</LinearCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                최근 4주간 뉴스레터 성과 변화
              </p>
            </LinearCardHeader>
            <LinearCardContent className="mt-6">
              <LinearLineChart 
                data={newsletterMetrics.map(metric => ({
                  name: metric.week,
                  users: metric.sent,
                  revenue: metric.opened
                }))}
                className="h-64"
              />
            </LinearCardContent>
          </LinearCard>

          {/* 핵심 지표 요약 */}
          <div className="space-y-4">
            <LinearCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 발송 수
                  </span>
                  <LinearBadge variant="info" size="sm">주간</LinearBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,210
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  +5.2% 성장
                </div>
              </div>
            </LinearCard>

            <LinearCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 열람률
                  </span>
                  <LinearBadge variant="success" size="sm">우수</LinearBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  66.2%
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  +2.1% 향상
                </div>
              </div>
            </LinearCard>

            <LinearCard variant="outlined" className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    평균 클릭률
                  </span>
                  <LinearBadge variant="warning" size="sm">개선 필요</LinearBadge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  66.2%
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  -1.3% 감소
                </div>
              </div>
            </LinearCard>
          </div>
        </div>
      </section>

      {/* 하단 요약 통계 */}
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 이번 주 하이라이트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              285
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              총 커밋 수
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              1,154
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Slack 메시지
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              1,250
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              뉴스레터 발송
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
