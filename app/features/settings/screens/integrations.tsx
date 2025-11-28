import type { Database } from 'database.types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { data, redirect, useFetcher, useSearchParams, type LoaderFunctionArgs } from 'react-router';
import { toast } from 'sonner';
import {
  BookOpenIcon,
  CheckCircleIcon,
  GitHubIcon,
  HashIcon,
  LockIcon,
  NexBadge,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardHeader,
  NexCardTitle,
  SlackIcon
} from '~/core/components/nex';
import makeServerClient from '~/core/lib/supa-client.server';
import { cn } from '~/core/lib/utils';
import { getIntegrationsInfo, getWorkspace } from '../db/queries';
import { useIntegrationActions } from '../hooks/useIntegrationActions';
import { useIntegrationResponse } from '../hooks/useIntegrationResponse';
import { useIntegrationUI } from '../hooks/useIntegrationUI';
import type { ConnectionStatus } from '../lib/types';
import type { Route } from "./+types/integrations";

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

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  
  if (status === 'approval_pending') {
    // 승인대기 상태로 업데이트
    const { createOrUpdateIntegration } = await import("../db/mutations");
    const result = await createOrUpdateIntegration(client, {
      workspace_id: workspaceId,
      type: 'github' as Database["public"]["Enums"]["integration_type"],
      credential_ref: '',
      connection_status: 'unauthorized',
      metadata: {},
      resourceCacheJson: {}
    });
  }
  const integrationsInfo = await getIntegrationsInfo(client, { workspaceId: workspaceId });
  return data({ user, workspaceId, integrationsInfo });
};

export default function IntegrationsScreen( { loaderData }: Route.ComponentProps ) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "integrations" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { workspaceId, integrationsInfo } = loaderData;
  const githubCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'github')?.credential_ref;
  const slackCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;
  const isConnectedGitHub = integrationsInfo.find((integration: any) => integration.type === 'github')?.connection_status === 'connected';
  const isConnectedSlack = integrationsInfo.find((integration: any) => integration.type === 'slack')?.connection_status === 'connected';
  // 각 서비스의 연결 상태를 관리
  const [githubStatus, setGithubStatus] = useState<ConnectionStatus>(isConnectedGitHub ? 'connected' : 'disconnected');
  const [slackStatus, setSlackStatus] = useState<ConnectionStatus>(isConnectedSlack ? 'connected' : 'disconnected');
  //const [githubData, setGithubData] = useState<any>(null);
  //const [slackData, setSlackData] = useState<any>(null);
  const [expandedChannels, setExpandedChannels] = useState(false);
  const [expandedRepos, setExpandedRepos] = useState(false);
  
  // URL 파라미터에서 상태 메시지 확인
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    
    if (status === 'approval_pending' && message) {
      setStatusMessage({
        type: 'info',
        message: decodeURIComponent(message)
      });
    } else if (error) {
      setStatusMessage({
        type: 'error', 
        message: `연결 실패: ${error}`
      });
    } else if (status === 'success' && message) {
      setStatusMessage({
        type: 'success',
        message: decodeURIComponent(message)
      });
    }
    
    // 메시지를 5초 후 자동으로 숨김
    if (status || error) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  // 채널 멤버십 관리를 위한 상태 및 fetcher
  const [channelMemberships, setChannelMemberships] = useState<Record<string, boolean>>({});
  const [loadingChannels, setLoadingChannels] = useState<Record<string, boolean>>({});
  const [currentLoadingChannel, setCurrentLoadingChannel] = useState<string | null>(null);
  const membershipFetcher = useFetcher();

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

  // GitHub fetcher 응답 처리 (커스텀 훅 사용)
  useIntegrationResponse(
    githubFetcher.data,
    setGithubStatus,
    'github',
    {
      onRedirect: (redirectUrl) => {
        console.log('GitHub App 설치 페이지로 리다이렉트 (새 탭):', redirectUrl);
        const newWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        
        // 팝업 차단 확인
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.log('❌ 팝업이 차단되었습니다.');
          // 사용자에게 선택권 제공 (자동 리다이렉트 제거)
          const shouldRedirect = confirm(
            t("popupBlocked") + "\n\n" +
            t("popupBlockedDescription1") + "\n" +
            t("popupBlockedDescription2") + "\n\n" +
            t("popupBlockedDescription3")
          );
          
          if (shouldRedirect) {
            window.location.href = redirectUrl;
          } else {
            console.log('사용자가 리다이렉트를 취소했습니다.');
          }
        } else {
          console.log('✅ 새 탭에서 GitHub App 설치 페이지 열림 - 원본 페이지는 유지');
        }
      },
      onSuccess: (data) => {
        console.log('GitHub 연결 성공:', data);
      },
      onError: (error) => {
        console.error('GitHub 연결 실패:', error);
      }
    }
  );

  // Slack fetcher 응답 처리 (커스텀 훅 사용)
  useIntegrationResponse(
    slackFetcher.data,
    setSlackStatus,
    'slack',
    {
      onRedirect: (redirectUrl) => {
        console.log('Slack OAuth 페이지로 리다이렉트 (새 탭):', redirectUrl);
        const newWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        
        // 팝업 차단 확인
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.log('❌ 팝업이 차단되었습니다.');
          // 사용자에게 선택권 제공
          const shouldRedirect = confirm(
            t("popupBlocked") + "\n\n" +
            t("popupBlockedDescription1") + "\n" +
            t("popupBlockedDescription2") + "\n\n" +
            t("popupBlockedDescription3")
          );
          
          if (shouldRedirect) {
            window.location.href = redirectUrl;
          } else {
            console.log('사용자가 리다이렉트를 취소했습니다.');
          }
        } else {
          console.log('✅ 새 탭에서 Slack OAuth 페이지 열림 - 원본 페이지는 유지');
        }
      },
      onSuccess: (data) => {
        console.log('Slack 연결 성공:', data);
      },
      onError: (error) => {
        console.error('Slack 연결 실패:', error);
      }
    }
  );

  // 채널 멤버십 토글 함수
  const handleChannelToggle = async (channel: any, integration: any) => {
    const channelId = channel.id;
    const currentMembership = channelMemberships[channelId] ?? channel.is_member;
    const action = currentMembership ? 'leave' : 'join';
    
    // 현재 로딩 중인 채널 추적
    setCurrentLoadingChannel(channelId);
    
    // 로딩 상태 설정
    setLoadingChannels(prev => ({ ...prev, [channelId]: true }));
    
    // 낙관적 업데이트
    setChannelMemberships(prev => ({
      ...prev,
      [channelId]: !currentMembership
    }));
    
    const formData = new FormData();
    formData.append('workspaceId', workspaceId);
    formData.append('integrationId', integration.id);
    formData.append('channelId', channelId);
    formData.append('action', action);
    formData.append('credentialRef', integration.credentialRef);
    
    membershipFetcher.submit(formData, {
      method: 'POST',
      action: '/api/settings/slack-channel-members'
    });
  };

  // 채널 멤버십 fetcher 상태 변화 모니터링
  useEffect(() => {
    // fetcher가 완료되었을 때 (성공 또는 실패)
    if (membershipFetcher.state === 'idle' && currentLoadingChannel) {
      if (membershipFetcher.data) {
        const response = membershipFetcher.data as any;
        
        if (response.status === 'success') {
          // 성공 시 로딩 상태 해제
          setLoadingChannels(prev => ({ ...prev, [currentLoadingChannel]: false }));
          toast.success(response.message);

        } else if (response.status === 'error') {
          // 실패 시 상태 롤백
          setChannelMemberships(prev => ({
            ...prev,
            [currentLoadingChannel]: !prev[currentLoadingChannel] // 원래 상태로 롤백
          }));
          setLoadingChannels(prev => ({ ...prev, [currentLoadingChannel]: false }));
          toast.error(response.error);
        }
      } else {
        // 응답 데이터가 없는 경우 (네트워크 에러 등)
        setChannelMemberships(prev => ({
          ...prev,
          [currentLoadingChannel]: !prev[currentLoadingChannel] // 원래 상태로 롤백
        }));
        setLoadingChannels(prev => ({ ...prev, [currentLoadingChannel]: false }));
        
        // 일반적인 에러 메시지 표시
        setStatusMessage({
          type: 'error',
          message: 'Network error occurred. Please try again.'
        });
        
        setTimeout(() => setStatusMessage(null), 5000);
      }
      
      // 현재 로딩 채널 초기화
      setCurrentLoadingChannel(null);
    }
  }, [membershipFetcher.state, membershipFetcher.data, currentLoadingChannel]);

  // Integration UI 요소들 생성
  const { integrations, getStatusBadge, getActionButton } = useIntegrationUI({
    githubStatus,
    slackStatus,
    handleGitHubConnect,
    handleGitHubDisconnect,
    handleSlackConnect,
    handleSlackDisconnect,
    integrationsInfo
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
            {t("title")}
          </h1>
          <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
            {t("description")}
          </p>
        </div>

        {/* 상태 메시지 표시 */}
        {statusMessage && (
          <div className={cn(
            "p-4 rounded-lg border mb-6",
            statusMessage.type === 'success' && "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
            statusMessage.type === 'error' && "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
            statusMessage.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {statusMessage.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                {statusMessage.type === 'error' && <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</div>}
                {statusMessage.type === 'info' && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">i</div>}
                <span className="font-medium">{statusMessage.message}</span>
              </div>
              <button 
                onClick={() => setStatusMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 통합 서비스 카드 목록 */}
        <div className="grid gap-6">
          {integrations.map((integration) => (
            <NexCard
              key={integration.type}
              variant="default"
              className="transition-all duration-200 hover:shadow-lg"
            >
              <NexCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg",
                      integration.type === 'github' && "bg-[#0D1117] text-white",
                      integration.type === 'slack' && "bg-[#4A154B] text-white"
                    )}>
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <NexCardTitle as="h3" className="text-xl">
                          {integration.name}
                        </NexCardTitle>
                        {getStatusBadge(integration.status)}
                      </div>
                      <NexCardDescription className="mt-1">
                        {integration.description}
                      </NexCardDescription>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getActionButton(integration)}
                  </div>
                </div>
              </NexCardHeader>

              <NexCardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2">
                      {commonT("mainFeatures")}
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
                          {commonT("connectionComplete")}
                        </span>
                      </div>
                      <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mt-1">
                        {integration.name} {t("connectionCompleteDescription")}
                      </p>
                      
                      {/* GitHub 연결 정보 */}
                      {integration.type === 'github' && integration.resourceCache && integration.resourceCache.user && (
                        <div className="mt-3 pt-3 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-[#8B92B5] dark:text-[#6C6F7E]">{t("connectedAccount")}:</span>
                            <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                              {integration.resourceCache.user.name || integration.resourceCache.user.login}
                            </span>
                          </div>
                          
                          {/* 접근 가능한 리포지토리 */}
                          <div className="mt-3">
                            <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mb-2">
                              {t("accessibleRepositories")}
                            </div>
                            {integration.resourceCache.repos && integration.resourceCache.repos.length > 0 ? (
                              <div>
                                {/* 통합된 통계 정보 */}
                                <div className="text-xs text-[#0D0E10] dark:text-[#FFFFFF] font-medium mb-2">
                                  {commonT("total")}: {integration.resourceCache.user.accessible_repos?.total} {commonT("numberOfRepo")} (
                                  <span >
                                    {commonT("public")}: {integration.resourceCache.user.accessible_repos?.public}
                                  </span>
                                  /
                                  <span >
                                    {commonT("private")}: {integration.resourceCache.user.accessible_repos?.private}
                                  </span>
                                  )
                                </div>
                                
                                {/* 리포지토리 목록 */}
                                <div className="flex flex-wrap gap-1">
                                  {integration.resourceCache.repos
                                    .sort((a: any, b: any) => {
                                      // private 리포지토리를 먼저 표시
                                      if (a.private && !b.private) return -1;
                                      if (!a.private && b.private) return 1;
                                      // 같은 타입이면 이름순 정렬
                                      return a.name.localeCompare(b.name);
                                    })
                                    .slice(0, expandedRepos ? integration.resourceCache.repos.length : 10)
                                    .map((repo: any) => {
                                      const RepoIcon = repo.private ? LockIcon : BookOpenIcon;
                                      return (
                                        <NexBadge
                                          key={repo.id}
                                          variant={"success"}
                                          size="sm"
                                          className="text-xs flex items-center gap-1"
                                          icon={<RepoIcon className="w-2.5 h-2.5" />}
                                        >
                                          {repo.name}
                                        </NexBadge>
                                      );
                                    })}
                                  {integration.resourceCache.repos.length > 10 && (
                                    <button
                                      onClick={() => setExpandedRepos(!expandedRepos)}
                                      className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer"
                                    >
                                      {expandedRepos ? commonT("collapse") : `+${integration.resourceCache.repos.length - 10} ${commonT("numberOfRepo")} ${commonT("more")}`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] italic">
                                {integration.resourceCache.repos === undefined 
                                  ? t("loadingRepositories") 
                                  : t("noAccessibleRepositories")
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Slack 연결 정보 */}
                      {integration.type === 'slack' && integration.resourceCache && integration.resourceCache.team && (
                        <div className="mt-3 pt-3 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">{t("workspace")}:</span>
                              <span className="text-[#8B92B5] dark:text-[#6C6F7E]">
                                {integration.resourceCache.team.name}
                              </span>
                            </div>
                            {integration.resourceCache.bot?.user_info && (
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">{t("connectedBot")}:</span>
                                <span className="text-[#8B92B5] dark:text-[#6C6F7E]">
                                  {integration.resourceCache.bot.user_info.profile?.display_name || 
                                  integration.resourceCache.bot.user_info.display_name || 
                                  integration.resourceCache.bot.user_info.real_name || 
                                  integration.resourceCache.bot.user_info.name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* 접근 가능한 채널 */}
                          <div className="mt-3">
                            <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mb-2">
                              <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">{t("channelList")}</span>  
                              <br />
                              <span className="text-[#8B92B5] dark:text-[#6C6F7E] ml-2">{t("collectDataTargetDescription1")}</span>
                              <br />
                              <span className="text-[#8B92B5] dark:text-[#6C6F7E] ml-2">{t("collectDataTargetDescription2")}</span>
                            </div>
                            {integration.resourceCache.channels && integration.resourceCache.channels.length > 0 ? (
                              <div>
                                {/* 통합된 통계 정보 */}
                                <div className="text-xs text-[#0D0E10] dark:text-[#FFFFFF] font-medium mb-2">
                                  {commonT("total")}: {integration.resourceCache.channels.length} {commonT("numberOfChannel")} (
                                  <span className="text-green-600">
                                    {commonT("member")}: {integration.resourceCache.channels.filter((ch: any) => ch.is_member).length}
                                  </span>
                                  /
                                  <span className="text-orange-600 ml-1">
                                    {commonT("nonMember")}: {integration.resourceCache.channels.filter((ch: any) => !ch.is_member).length}
                                  </span>
                                  )
                                </div>
                                
                                {/* 채널 목록 */}
                                <div className="flex flex-wrap gap-1">
                                  {integration.resourceCache.channels
                                    .sort((a: any, b: any) => {
                                      // 멤버 채널을 먼저 표시 (is_member가 true인 것이 먼저)
                                      if (a.is_member && !b.is_member) return -1;
                                      if (!a.is_member && b.is_member) return 1;
                                      // 같은 타입이면 이름순 정렬
                                      return a.name.localeCompare(b.name);
                                    })
                                    .slice(0, expandedChannels ? integration.resourceCache.channels.length : 10)
                                    .map((channel: any, index: number) => {
                                      const currentMembership = channelMemberships[channel.id] ?? channel.is_member;
                                      const isLoading = loadingChannels[channel.id] || false;
                                      const isPrivate = channel.is_private;
                                      const ChannelIcon = isPrivate ? LockIcon : HashIcon;
                                      
                                      // Leave 기능 비활성화 (channels:manage 권한 없음)
                                      const canLeave = false; // TODO: channels:manage 권한 추가 시 true로 변경
                                      const canInteract = !isLoading && (!currentMembership || canLeave);
                                      
                                      return (
                                        <NexBadge
                                          key={channel.id || index}
                                          variant={currentMembership ? "success" : "warning"}
                                          size="sm"
                                          className={`text-xs flex items-center gap-1 transition-all ${
                                            canInteract 
                                              ? 'cursor-pointer hover:opacity-80' 
                                              : currentMembership 
                                                ? 'cursor-not-allowed opacity-75' 
                                                : 'cursor-pointer hover:opacity-80'
                                          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                          icon={
                                            isLoading ? (
                                              <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <ChannelIcon className="w-2.5 h-2.5" />
                                            )
                                          }
                                          onClick={() => {
                                            if (!isLoading) {
                                              if (currentMembership && !canLeave) {
                                                // Leave 불가능한 경우 안내 메시지
                                                toast.info(t("channelLeavePermissionRequired"));
                                                return;
                                              }
                                              handleChannelToggle(channel, integration);
                                            }
                                          }}
                                          title={
                                            currentMembership && !canLeave 
                                              ? t("channelLeavePermissionRequired") 
                                              : currentMembership 
                                                ? t("clickToLeaveChannel") 
                                                : t("clickToJoinChannel")
                                          }
                                        >
                                          {channel.name}
                                          {currentMembership && !isLoading && <span className="ml-1 text-xs">✓</span>}
                                          {currentMembership && !canLeave && !isLoading && (
                                            <span className="ml-1 text-xs opacity-60">🔒</span>
                                          )}
                                        </NexBadge>
                                      );
                                    })}
                                  {integration.resourceCache.channels.length > 10 && (
                                    <button
                                      onClick={() => setExpandedChannels(!expandedChannels)}
                                      className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer"
                                    >
                                      {expandedChannels ? commonT("collapse") : `+${integration.resourceCache.channels.length - 10} ${commonT("numberOfChannel")} ${commonT("more")}`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] italic">
                                {integration.resourceCache.channels === undefined 
                                  ? t("loadingChannels") 
                                  : t("noAccessibleChannels")
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </NexCardContent>
            </NexCard>
          ))}
        </div>

      {/* 도움말 섹션 */}
      <NexCard variant="outlined" className="mt-8">
        <NexCardHeader>
          <NexCardTitle as="h3" className="text-lg">
            {t("help.title")}
          </NexCardTitle>
          <NexCardDescription>
            {t("help.description")}
          </NexCardDescription>
        </NexCardHeader>
        <NexCardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center space-x-2">
                <GitHubIcon className="w-4 h-4" />
                <span>{t("help.githubConnection")}</span>
              </h4>
              <ul className="space-y-1 text-[#8B92B5] dark:text-[#6C6F7E] list-disc list-inside ml-6">
                <li>{t("help.githubConnectionDescription1")}</li>
                <li>{t("help.githubConnectionDescription2")} <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {t("help.githubConnectionDescription3")} [상세보기]</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center space-x-2">
                <SlackIcon className="w-4 h-4" />
                <span>{t("help.slackConnection")}</span>
              </h4>
              <ul className="space-y-1 text-[#8B92B5] dark:text-[#6C6F7E] list-disc list-inside ml-6">
                <li>{t("help.slackConnectionDescription1")}</li>
                <li>{t("help.slackConnectionDescription2")}</li>
                <li>{t("help.slackConnectionDescription3")} <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {t("help.slackConnectionDescription4")}</li>
              </ul>
            </div>

            </div>
          </NexCardContent>
        </NexCard>
      </div>
    </div>
  );
}
