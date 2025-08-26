import React, { useState, useEffect } from 'react';
import type { Route } from "./+types/dashboard";
import { useFetcher } from 'react-router';
import { 
  LinearCard, 
  LinearCardContent,
  LinearBadge,
  GitHubIcon,
  SlackIcon,
  CheckCircleIcon,
  XCircleIcon,
  SettingsIcon,
  BookOpenIcon,
  LockIcon,
  StarIcon,
  GitBranchIcon
} from '~/core/components/linear';
import { cn } from '~/core/lib/utils';

type ConnectionStatus = 'connected' | 'disconnected' | 'loading';

export const meta: Route.MetaFunction = () => {
  return [{ title: `Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* 통합 현황 카드들 */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* GitHub 연결 상태 카드 */}
        <LinearCard variant="default" className="hover:shadow-lg transition-shadow">
          <LinearCardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#0D1117] rounded-lg flex items-center justify-center">
                  <GitHubIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#0D0E10] dark:text-[#FFFFFF]">GitHub</span>
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
              <div className="space-y-2 text-sm">
                <div className="text-[#8B92B5] dark:text-[#6C6F7E]">
                  계정: <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                    {githubData.user.name || githubData.user.login}
                  </span>
                </div>
                
                {/* 리포지토리 통계 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <BookOpenIcon className="w-3 h-3 text-green-600" />
                    <span className="text-[#8B92B5] dark:text-[#6C6F7E]">공개:</span>
                    <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                      {githubData.user.accessible_repos?.public || githubData.user.public_repos}개
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <LockIcon className="w-3 h-3 text-yellow-600" />
                    <span className="text-[#8B92B5] dark:text-[#6C6F7E]">비공개:</span>
                    <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                      {githubData.user.accessible_repos?.private || githubData.user.total_private_repos || 0}개
                    </span>
                  </div>
                </div>
                
                {/* 접근 가능한 총 리포지토리 수 */}
                {githubData.user.accessible_repos && (
                  <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">
                    총 접근 가능: <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                      {githubData.user.accessible_repos.total}개
                    </span>
                    {githubData.user.accessible_repos.collaborated > 0 && (
                      <span className="ml-2">
                        (팀 리포지토리: {githubData.user.accessible_repos.collaborated}개)
                      </span>
                    )}
                  </div>
                )}

                
                {githubData.rateLimit && (
                  <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] pt-2 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                    API 잔여: <span className={cn(
                      githubData.rateLimit.remaining < 100 
                        ? "text-red-600 dark:text-red-400 font-medium" 
                        : "text-[#0D0E10] dark:text-[#FFFFFF]"
                    )}>
                      {githubData.rateLimit.remaining}/{githubData.rateLimit.limit}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                GitHub 계정을 연결하여 리포지토리 데이터를 수집하세요.
              </div>
            )}
          </LinearCardContent>
        </LinearCard>

        {/* Slack 연결 상태 카드 */}
        <LinearCard variant="default" className="hover:shadow-lg transition-shadow">
          <LinearCardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#4A154B] rounded-lg flex items-center justify-center">
                  <SlackIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#0D0E10] dark:text-[#FFFFFF]">Slack</span>
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
              <div className="space-y-1 text-sm">
                <div className="text-[#8B92B5] dark:text-[#6C6F7E]">
                  워크스페이스: <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                    {slackData.team.name}
                  </span>
                </div>
                <div className="text-[#8B92B5] dark:text-[#6C6F7E]">
                  채널: <span className="text-[#0D0E10] dark:text-[#FFFFFF]">
                    {slackData.channels?.length || 0}개
                  </span>
                </div>
                <div className="text-[#8B92B5] dark:text-[#6C6F7E]">
                  상태: <span className="text-green-600 dark:text-green-400">활성화됨</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                Slack 워크스페이스를 연결하여 채널 데이터를 수집하세요.
              </div>
            )}
          </LinearCardContent>
        </LinearCard>

        {/* 통합 설정 바로가기 카드 */}
        <LinearCard variant="outlined" className="hover:shadow-lg transition-shadow cursor-pointer" 
                   onClick={() => window.location.href = '/settings/integrations'}>
          <LinearCardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#5E6AD2] dark:bg-[#7C89F9] rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#0D0E10] dark:text-[#FFFFFF]">통합 설정</span>
              </div>
            </div>
            <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E] mb-3">
              외부 서비스 연결을 관리하고 설정하세요.
            </div>
            <div className="text-xs text-[#5E6AD2] dark:text-[#7C89F9] font-medium">
              설정 페이지로 이동 →
            </div>
          </LinearCardContent>
        </LinearCard>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="bg-muted/50 min-h-full flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
