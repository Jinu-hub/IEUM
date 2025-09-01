import React, { useState, useEffect } from 'react';
import type { Route } from "./+types/dashboard";
import { useFetcher } from 'react-router';
import { 
  LinearCard, 
  LinearCardContent,
  LinearBadge,
  LinearButton,
  GitHubIcon,
  SlackIcon,
  DiscordIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  LockIcon,
} from '~/core/components/linear';
import { cn } from '~/core/lib/utils';
import type { EmailStatus } from '~/features/contents/lib/types';
import { sampleSentEmails } from '~/features/contents/lib/mackData';
import type { TargetData } from '~/features/settings/lib/types';
import { sampleTargets } from '~/features/settings/lib/mockdata';

type ConnectionStatus = 'connected' | 'disconnected' | 'loading';

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

// 다음 발송 예정 시각 계산 함수
const getNextScheduledTime = (cronExpression?: string): Date | null => {
  if (!cronExpression) return null;
  
  const now = new Date();
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return null;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map(p => p === '*' ? -1 : parseInt(p));
  
  // 다음 스케줄 계산 (간단한 구현)
  const nextDate = new Date(now);
  
  if (dayOfWeek !== -1 && dayOfMonth === -1) {
    // 주간 스케줄
    const currentDay = nextDate.getDay();
    const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 일요일을 7로 변환
    const currentDayAdjusted = currentDay === 0 ? 7 : currentDay;
    
    let daysUntilTarget = targetDay - currentDayAdjusted;
    if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && (nextDate.getHours() > hour || (nextDate.getHours() === hour && nextDate.getMinutes() >= minute)))) {
      daysUntilTarget += 7;
    }
    
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
    nextDate.setHours(hour, minute, 0, 0);
  } else if (dayOfMonth !== -1 && dayOfWeek === -1) {
    // 월간 스케줄
    nextDate.setDate(dayOfMonth);
    nextDate.setHours(hour, minute, 0, 0);
    
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  } else {
    // 일간 스케줄
    nextDate.setHours(hour, minute, 0, 0);
    
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }
  
  return nextDate;
};

// 시간 차이를 한국어로 포맷
const formatTimeUntil = (targetDate: Date): string => {
  const now = new Date();
  const diffInMs = targetDate.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays}일 후`;
  } else if (diffInHours > 0) {
    return `${diffInHours}시간 후`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes}분 후`;
  } else {
    return "곧 발송";
  }
};

export default function Dashboard() {
  const [githubStatus, setGithubStatus] = useState<ConnectionStatus>('loading');
  const [slackStatus, setSlackStatus] = useState<ConnectionStatus>('loading');
  const [githubData, setGithubData] = useState<any>(null);
  const [slackData, setSlackData] = useState<any>(null);

  // API 호출을 위한 fetcher
  const githubFetcher = useFetcher();
  const slackFetcher = useFetcher();

  // 컴포넌트 마운트 시 연결 상태 확인
  useEffect(() => {
    githubFetcher.load('/api/settings/github-integration');
    slackFetcher.load('/api/settings/slack-integration');
  }, []);

  // GitHub fetcher 응답 처리
  useEffect(() => {
    if (githubFetcher.data) {
      const { status, data } = githubFetcher.data;
      if (status === 'success' && data) {
        setGithubStatus(data.connected ? 'connected' : 'disconnected');
        setGithubData(data);
      } else {
        setGithubStatus('disconnected');
      }
    }
  }, [githubFetcher.data]);

  // Slack fetcher 응답 처리
  useEffect(() => {
    if (slackFetcher.data) {
      const { status, data } = slackFetcher.data;
      if (status === 'success' && data) {
        setSlackStatus(data.connected ? 'connected' : 'disconnected');
        setSlackData(data);
      } else {
        setSlackStatus('disconnected');
      }
    }
  }, [slackFetcher.data]);

  // 이메일 상태별 설정 함수
  const getStatusConfig = (status: EmailStatus) => {
    switch (status) {
      case 'sent':
        return {
          icon: CheckCircleIcon,
          label: '발송됨',
          variant: 'info' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
        };
      case 'delivered':
        return {
          icon: CheckCircleIcon,
          label: '송신 완료',
          variant: 'success' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
        };
      case 'failed':
        return {
          icon: XCircleIcon,
          label: '송신 실패',
          variant: 'error' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
        };
    }
  };

  // 이메일 통계 계산
  const emailStats = {
    sent: sampleSentEmails.filter(email => email.status === 'sent').length,
    delivered: sampleSentEmails.filter(email => email.status === 'delivered').length,
    failed: sampleSentEmails.filter(email => email.status === 'failed').length,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 space-y-6">
      {/* 대시보드 헤더 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#667eea] to-[#764ba2] p-8 text-white ">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">대시보드</h1>
              <p className="text-white/80 text-sm">시스템 현황을 한눈에 확인하세요</p>
            </div>
          </div>
        </div>
        
        {/* 배경 장식 요소 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* 연결 현황 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">연결 현황</h2>
              <p className="text-sm text-muted-foreground">외부 서비스 연결 상태</p>
            </div>
          </div>
          <LinearButton 
            variant="secondary" 
            size="sm" 
            onClick={() => window.location.href = '/settings/integrations'}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>설정 페이지로 이동</span>
          </LinearButton>
        </div>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* GitHub 연결 상태 카드 */}
        <LinearCard variant="default" className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0D1117] dark:to-[#161B22] border border-slate-200 dark:border-slate-700">
          <LinearCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-[#0D1117] rounded-xl flex items-center justify-center ring-2 ring-slate-200 dark:ring-white/10 group-hover:ring-slate-300 dark:group-hover:ring-white/20 transition-all duration-300">
                  <GitHubIcon className="w-5 h-5 text-slate-700 dark:text-white" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-lg">GitHub</span>
              </div>
              {githubStatus === 'loading' ? (
                <LinearBadge variant="secondary" size="sm">로딩 중</LinearBadge>
              ) : githubStatus === 'connected' ? (
                <LinearBadge variant="success" size="sm" icon={<CheckCircleIcon className="w-3 h-3" />}>
                  연결됨
                </LinearBadge>
              ) : (
                <LinearBadge variant="secondary" size="sm" icon={<XCircleIcon className="w-3 h-3" />}>
                  연결 안됨
                </LinearBadge>
              )}
            </div>
            
            {githubStatus === 'connected' && githubData?.user ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 dark:text-white/80">계정:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {githubData.user.name || githubData.user.login}
                  </span>
                </div>
                
                {/* 리포지토리 통계 */}
                <span className="text-slate-500 dark:text-white/60 text-xs mb-1">접근 가능 리포지토리</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpenIcon className="w-4 h-4 text-green-400" />
                      <span className="text-slate-500 dark:text-white/60 text-xs">공개</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">
                      {githubData.user.accessible_repos?.public || githubData.user.public_repos}개
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <LockIcon className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-500 dark:text-white/60 text-xs">비공개</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">
                      {githubData.user.accessible_repos?.private || githubData.user.total_private_repos || 0}개
                    </span>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GitHubIcon className="w-8 h-8 text-slate-400 dark:text-white/40" />
                </div>
                <p className="text-slate-500 dark:text-white/60 text-sm">
                  GitHub 계정을 연결하여<br />리포지토리 데이터를 수집하세요
                </p>
              </div>
            )}
          </LinearCardContent>
        </LinearCard>

        {/* Slack 연결 상태 카드 */}
        <LinearCard variant="default" className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0D1117] dark:to-[#161B22] border border-slate-200 dark:border-slate-700">
          <LinearCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-[#0D1117] rounded-xl flex items-center justify-center ring-2 ring-slate-200 dark:ring-white/10 group-hover:ring-slate-300 dark:group-hover:ring-white/20 transition-all duration-300">
                  <SlackIcon className="w-5 h-5 text-slate-700 dark:text-white" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-lg">Slack</span>
              </div>
              {slackStatus === 'loading' ? (
                <LinearBadge variant="secondary" size="sm">로딩 중</LinearBadge>
              ) : slackStatus === 'connected' ? (
                <LinearBadge variant="success" size="sm" icon={<CheckCircleIcon className="w-3 h-3" />}>
                  연결됨
                </LinearBadge>
              ) : (
                <LinearBadge variant="secondary" size="sm" icon={<XCircleIcon className="w-3 h-3" />}>
                  연결 안됨
                </LinearBadge>
              )}
            </div>
            
            {slackStatus === 'connected' && slackData?.team ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-white/10 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 dark:text-white/80">워크스페이스:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {slackData.team.name}
                  </span>
                </div>
                
                {/* 워크스페이스 통계 */}
                <span className="text-slate-500 dark:text-white/60 text-xs mb-1">접근 가능 채널</span>
                <div className="grid grid-cols-2 gap-3">
                  
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      <span className="text-slate-500 dark:text-white/60 text-xs">채널</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">
                      {slackData.channels?.length || 0}개
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-500 dark:text-white/60 text-xs">상태</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">활성화됨</span>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SlackIcon className="w-8 h-8 text-slate-400 dark:text-white/40" />
                </div>
                <p className="text-slate-500 dark:text-white/60 text-sm">
                  Slack 워크스페이스를 연결하여<br />채널 데이터를 수집하세요
                </p>
              </div>
            )}
          </LinearCardContent>
        </LinearCard>

        {/* Discord 연결 상태 카드 */}
        <LinearCard variant="default" className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 relative overflow-hidden opacity-75">
          <LinearCardContent className="p-6">
            {/* 출시 예정 라벨 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center ring-1 ring-gray-300 dark:ring-gray-600 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all duration-300">
                  <DiscordIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="font-semibold text-gray-600 dark:text-gray-300 text-lg">Discord</span>
              </div>
            </div>
            
            {/* 출시 예정 시기 */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  출시 예정
                </span>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>
        </div>
      </div>

      {/* 타겟 요약 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">타겟 관리</h2>
              <p className="text-sm text-muted-foreground">발송 타겟 현황 및 다음 발송 예정</p>
            </div>
          </div>
          <LinearButton 
            variant="secondary" 
            size="sm" 
            onClick={() => window.location.href = '/settings/targets'}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>타겟 관리</span>
          </LinearButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleTargets.length === 0 ? (
            <LinearCard variant="outlined" className="col-span-full text-center py-8">
              <LinearCardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm">
                  설정된 타겟이 없습니다<br />
                  첫 번째 발송 타겟을 추가해보세요
                </p>
              </LinearCardContent>
            </LinearCard>
          ) : (
            sampleTargets.map((target) => {
              const nextSchedule = getNextScheduledTime(target.scheduleCron);
              const isActive = target.isActive;
              
              return (
                <LinearCard 
                  key={target.targetId} 
                  variant="default" 
                  hoverable
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0D1117] dark:to-[#161B22] border border-slate-200 dark:border-slate-700 cursor-pointer"
                  onClick={() => window.location.href = `/settings/target/${target.targetId}`}
                >
                  <LinearCardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          isActive 
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        )}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <LinearBadge 
                        variant={isActive ? "success" : "secondary"}
                        size="sm"
                      >
                        {isActive ? "활성" : "비활성"}
                      </LinearBadge>
                    </div>
                    
                    <h3 className="font-semibold text-foreground text-sm mb-2 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {target.displayName}
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">메일링 리스트:</span>
                        <span className="font-medium text-foreground">
                          {target.mailingListName || "미설정"}
                        </span>
                      </div>
                      
                      {target.scheduleCron ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">다음 발송:</span>
                            <span className={cn(
                              "font-medium",
                              nextSchedule && isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )}>
                              {nextSchedule && isActive ? formatTimeUntil(nextSchedule) : "예정 없음"}
                            </span>
                          </div>
                          
                          {nextSchedule && isActive && (
                            <div className="pt-2 border-t border-border">
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                  {nextSchedule.toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">발송 방식:</span>
                          <span className="font-medium text-muted-foreground">수동 발송</span>
                        </div>
                      )}
                    </div>
                  </LinearCardContent>
                </LinearCard>
              );
            })
          )}
        </div>
      </div>

      {/* 이메일 통계 요약 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">이메일 통계</h2>
              <p className="text-sm text-muted-foreground">보낸 이메일 발송 현황</p>
            </div>
          </div>
          <LinearButton 
            variant="secondary" 
            size="sm" 
            onClick={() => window.location.href = '/contents/sent-mail'}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>발송된 메일 보기</span>
          </LinearButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { status: 'sent' as EmailStatus, count: emailStats.sent },
            { status: 'delivered' as EmailStatus, count: emailStats.delivered },
            { status: 'failed' as EmailStatus, count: emailStats.failed }
          ].map(({ status, count }) => {
            const statusConfig = getStatusConfig(status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <LinearCard key={status} variant="outlined" hoverable>
                <LinearCardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                      <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {statusConfig.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {count}
                      </p>
                    </div>
                  </div>
                </LinearCardContent>
              </LinearCard>
            );
          })}
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="bg-muted/50 min-h-full flex-1 rounded-xl md:min-h-min" />
      </div>
  );
}
