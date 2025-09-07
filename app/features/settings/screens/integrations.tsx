import React, { useState, useEffect } from 'react';
import { data, redirect, useFetcher, type LoaderFunctionArgs } from 'react-router';
import { 
  LinearCard, 
  LinearCardHeader, 
  LinearCardTitle, 
  LinearCardDescription, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
  GitHubIcon,
  SlackIcon,
  CheckCircleIcon,
  PlusIcon,
  SettingsIcon,
  HashIcon,
  LockIcon,
  BookOpenIcon
} from '~/core/components/linear';
import { cn } from '~/core/lib/utils';
import type { Route } from "./+types/integrations";
import type { ConnectionStatus } from '../lib/types';
import type { IntegrationService } from '../lib/constants';
import makeServerClient from '~/core/lib/supa-client.server';
import { getWorkspace, getIntegrationsInfo } from '../db/queries';
import { useIntegrationResponse } from '../hooks/useIntegrationResponse';
import { useIntegrationActions } from '../hooks/useIntegrationActions';
import { useIntegrationUI } from '../hooks/useIntegrationUI';

export const meta: Route.MetaFunction = () => {
    return [{ title: `Integrations | ${import.meta.env.VITE_APP_NAME}` }];
  };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const workspace = await getWorkspace(client, { userId: user.id });
  
  const workspaceId = workspace[0].workspace_id;
  const integrationsInfo = await getIntegrationsInfo(client, { workspaceId: workspaceId });
  return data({ user, workspaceId, integrationsInfo });
};

export default function IntegrationsScreen( { loaderData }: Route.ComponentProps ) {
  const { user, workspaceId, integrationsInfo } = loaderData;
  const githubCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'github')?.credential_ref;
  const slackCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;
  const isConnectedGitHub = integrationsInfo.find((integration: any) => integration.type === 'github')?.connection_status === 'connected';
  const isConnectedSlack = integrationsInfo.find((integration: any) => integration.type === 'slack')?.connection_status === 'connected';
  // 각 서비스의 연결 상태를 관리
  const [githubStatus, setGithubStatus] = useState<ConnectionStatus>('disconnected');
  const [slackStatus, setSlackStatus] = useState<ConnectionStatus>('disconnected');
  const [githubData, setGithubData] = useState<any>(null);
  const [slackData, setSlackData] = useState<any>(null);
  const [expandedChannels, setExpandedChannels] = useState(false);
  const [expandedRepos, setExpandedRepos] = useState(false);

  // API 호출을 위한 fetcher
  // GitHub integration actions
  const {
    handleConnect: handleGitHubConnect,
    handleDisconnect: handleGitHubDisconnect,
    fetcher: githubFetcher
  } = useIntegrationActions({
    workspaceId,
    credentialRef: githubCredentialRef,
    integrationType: 'github',
    setStatus: setGithubStatus
  });

  // Slack integration actions
  const {
    handleConnect: handleSlackConnect,
    handleDisconnect: handleSlackDisconnect,
    fetcher: slackFetcher
  } = useIntegrationActions({
    workspaceId,
    credentialRef: slackCredentialRef,
    integrationType: 'slack',
    setStatus: setSlackStatus
  });

  // 컴포넌트 마운트 시 연결 상태 확인
  /*
  useEffect(() => {
    // GitHub 상태 확인 (credentialRef가 있을 때만)
    if (githubCredentialRef) {
      githubFetcher.load(`/api/settings/github-integration/${githubCredentialRef}`);
    }
    // Slack 상태 확인 (credentialRef가 있을 때만)
    if (slackCredentialRef) {
      slackFetcher.load(`/api/settings/slack-integration/${slackCredentialRef}`);
    }
  }, []);
  */

  // GitHub fetcher 응답 처리 (커스텀 훅 사용)
  useIntegrationResponse(
    githubFetcher.data,
    setGithubStatus,
    setGithubData,
    'github'
  );

  // Slack fetcher 응답 처리 (커스텀 훅 사용)
  useIntegrationResponse(
    slackFetcher.data,
    setSlackStatus,
    setSlackData,
    'slack'
  );

  // Integration UI 요소들 생성
  const { integrations, getStatusBadge, getActionButton } = useIntegrationUI({
    githubStatus,
    slackStatus,
    handleGitHubConnect,
    handleGitHubDisconnect,
    handleSlackConnect,
    handleSlackDisconnect
  });


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 헤더 섹션 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
          외부 서비스 연결
        </h1>
        <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
          GitHub, Slack 등 외부 서비스를 연결하여 데이터를 수집하고 리포트를 생성하세요.
        </p>
      </div>

      {/* 통합 서비스 카드 목록 */}
      <div className="grid gap-6">
        {integrations.map((integration) => (
          <LinearCard
            key={integration.id}
            variant="default"
            className="transition-all duration-200 hover:shadow-lg"
          >
            <LinearCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg",
                    integration.id === 'github' && "bg-[#0D1117] text-white",
                    integration.id === 'slack' && "bg-[#4A154B] text-white"
                  )}>
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <LinearCardTitle as="h3" className="text-xl">
                        {integration.name}
                      </LinearCardTitle>
                      {getStatusBadge(integration.status)}
                    </div>
                    <LinearCardDescription className="mt-1">
                      {integration.description}
                    </LinearCardDescription>
                  </div>
                </div>
                <div className="flex items-center">
                  {getActionButton(integration)}
                </div>
              </div>
            </LinearCardHeader>

            <LinearCardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2">
                    주요 기능
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {integration.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-[#8B92B5] dark:text-[#6C6F7E]"
                      >
                        <div className="w-1.5 h-1.5 bg-[#5E6AD2] dark:bg-[#7C89F9] rounded-full" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 연결된 상태일 때 추가 정보 표시 */}
                {integration.status === 'connected' && (
                  <div className="bg-[#F8F9FA] dark:bg-[#1A1B1E] rounded-lg p-4 border border-[#E1E4E8] dark:border-[#2C2D30]">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                        연결 완료
                      </span>
                    </div>
                    <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mt-1">
                      {integration.name} 서비스가 성공적으로 연결되었습니다. 이제 데이터 수집이 가능합니다.
                    </p>
                    
                    {/* GitHub 연결 정보 */}
                    {integration.id === 'github' && githubData && githubData.user && (
                      <div className="mt-3 pt-3 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-[#8B92B5] dark:text-[#6C6F7E]">연결된 계정:</span>
                          <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                            {githubData.user.name || githubData.user.login}
                          </span>
                        </div>
                        
                        {/* 접근 가능한 리포지토리 */}
                        <div className="mt-3">
                          <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mb-2">
                            접근 가능한 리포지토리
                          </div>
                          {githubData.repositories && githubData.repositories.length > 0 ? (
                            <div>
                              {/* 통합된 통계 정보 */}
                              <div className="text-xs text-[#0D0E10] dark:text-[#FFFFFF] font-medium mb-2">
                                총: {githubData.repositories.length}개 (
                                <span >
                                  공개: {githubData.user.accessible_repos?.public || githubData.repositories.filter((r: any) => !r.private).length}
                                </span>
                                /
                                <span >
                                  비공개: {githubData.user.accessible_repos?.private || githubData.repositories.filter((r: any) => r.private).length}
                                </span>
                                )
                              </div>
                              
                              {/* 리포지토리 목록 */}
                              <div className="flex flex-wrap gap-1">
                                {githubData.repositories
                                  .sort((a: any, b: any) => {
                                    // private 리포지토리를 먼저 표시
                                    if (a.private && !b.private) return -1;
                                    if (!a.private && b.private) return 1;
                                    // 같은 타입이면 이름순 정렬
                                    return a.name.localeCompare(b.name);
                                  })
                                  .slice(0, expandedRepos ? githubData.repositories.length : 10)
                                  .map((repo: any) => {
                                    const RepoIcon = repo.private ? LockIcon : BookOpenIcon;
                                    return (
                                      <LinearBadge
                                        key={repo.id}
                                        variant={"success"}
                                        size="sm"
                                        className="text-xs flex items-center gap-1"
                                        icon={<RepoIcon className="w-2.5 h-2.5" />}
                                      >
                                        {repo.name}
                                      </LinearBadge>
                                    );
                                  })}
                                {githubData.repositories.length > 10 && (
                                  <button
                                    onClick={() => setExpandedRepos(!expandedRepos)}
                                    className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer"
                                  >
                                    {expandedRepos ? '축소하기' : `+${githubData.repositories.length - 10}개 더 보기`}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] italic">
                              {githubData.repositories === undefined 
                                ? "리포지토리 정보를 불러오는 중..." 
                                : "접근 가능한 리포지토리가 없습니다."
                              }
                            </div>
                          )}
                        </div>
                        
                        {githubData.rateLimit && (
                          <div className="flex items-center space-x-2 text-xs mt-3 pt-2 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                            <span className="text-[#8B92B5] dark:text-[#6C6F7E]">API 제한:</span>
                            <span className={cn(
                              "font-medium",
                              githubData.rateLimit.remaining < 100 
                                ? "text-red-600 dark:text-red-400" 
                                : "text-[#0D0E10] dark:text-[#FFFFFF]"
                            )}>
                              {githubData.rateLimit.remaining}/{githubData.rateLimit.limit}
                            </span>
                            {githubData.rateLimit.remaining < 100 && (
                              <LinearBadge variant="warning" size="sm" className="ml-1">
                                제한 임박
                              </LinearBadge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Slack 연결 정보 */}
                    {integration.id === 'slack' && slackData && slackData.team && (
                      <div className="mt-3 pt-3 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-[#8B92B5] dark:text-[#6C6F7E]">워크스페이스:</span>
                            <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                              {slackData.team.name}
                            </span>
                          </div>
                          {slackData.bot?.user_info && (
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-[#8B92B5] dark:text-[#6C6F7E]">연결된 봇:</span>
                              <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                                {slackData.bot.user_info.profile?.display_name || 
                                 slackData.bot.user_info.display_name || 
                                 slackData.bot.user_info.real_name || 
                                 slackData.bot.user_info.name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* 접근 가능한 채널 */}
                        <div className="mt-3">
                          <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mb-2">
                            접근 가능한 채널 (연결된 봇이 멤버로 초대되어야 데이터를 수집가능)  
                          </div>
                          {slackData.channels && slackData.channels.length > 0 ? (
                            <div>
                              {/* 통합된 통계 정보 */}
                              <div className="text-xs text-[#0D0E10] dark:text-[#FFFFFF] font-medium mb-2">
                                총: {slackData.channels.length}개 (
                                <span className="text-green-600">
                                  멤버: {slackData.channels.filter((ch: any) => ch.is_member).length}
                                </span>
                                /
                                <span className="text-orange-600 ml-1">
                                  비멤버: {slackData.channels.filter((ch: any) => !ch.is_member).length}
                                </span>
                                )
                              </div>
                              
                              {/* 채널 목록 */}
                              <div className="flex flex-wrap gap-1">
                                {slackData.channels
                                  .sort((a: any, b: any) => {
                                    // 멤버 채널을 먼저 표시 (is_member가 true인 것이 먼저)
                                    if (a.is_member && !b.is_member) return -1;
                                    if (!a.is_member && b.is_member) return 1;
                                    // 같은 타입이면 이름순 정렬
                                    return a.name.localeCompare(b.name);
                                  })
                                  .slice(0, expandedChannels ? slackData.channels.length : 10)
                                  .map((channel: any, index: number) => {
                                    const isMember = channel.is_member;
                                    const isPrivate = channel.is_private;
                                    const ChannelIcon = isPrivate ? LockIcon : HashIcon;
                                    
                                    return (
                                      <LinearBadge
                                        key={channel.id || index}
                                        variant={isMember ? "success" : "warning"}
                                        size="sm"
                                        className="text-xs flex items-center gap-1"
                                        icon={<ChannelIcon className="w-2.5 h-2.5" />}
                                      >
                                        {channel.name}
                                      </LinearBadge>
                                    );
                                  })}
                                {slackData.channels.length > 10 && (
                                  <button
                                    onClick={() => setExpandedChannels(!expandedChannels)}
                                    className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer"
                                  >
                                    {expandedChannels ? '축소하기' : `+${slackData.channels.length - 10}개 더 보기`}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] italic">
                              {slackData.channels === undefined 
                                ? "채널 정보를 불러오는 중..." 
                                : "접근 가능한 채널이 없습니다."
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </LinearCardContent>
          </LinearCard>
        ))}
      </div>

      {/* 도움말 섹션 */}
      <LinearCard variant="outlined" className="mt-8">
        <LinearCardHeader>
          <LinearCardTitle as="h3" className="text-lg">
            연결 도움말
          </LinearCardTitle>
          <LinearCardDescription>
            외부 서비스 연결에 대한 추가 정보
          </LinearCardDescription>
        </LinearCardHeader>
        <LinearCardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center space-x-2">
                <GitHubIcon className="w-4 h-4" />
                <span>GitHub 연결</span>
              </h4>
              <ul className="space-y-1 text-[#8B92B5] dark:text-[#6C6F7E] list-disc list-inside ml-6">
                <li>Personal Access Token이 필요합니다</li>
                <li>리포지토리 읽기 권한이 있어야 합니다</li>
                <li>Issues, Pull Requests 권한 권장</li>
                <li>수집할 리포지토리 목록을 설정할 수 있습니다</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center space-x-2">
                <SlackIcon className="w-4 h-4" />
                <span>Slack 연결</span>
              </h4>
              <ul className="space-y-1 text-[#8B92B5] dark:text-[#6C6F7E] list-disc list-inside ml-6">
                <li>Bot Token이 필요합니다 (xoxb-로 시작)</li>
                <li>워크스페이스에 앱을 설치해야 합니다</li>
                <li>채널 읽기, 메시지 히스토리 권한 필요</li>
                <li>연결된 봇이 멤버로 초대된 채널에만 읽기 가능</li>
              </ul>
            </div>

          </div>
        </LinearCardContent>
      </LinearCard>
    </div>
  );
}
