import type { Database } from 'database.types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { data, Link, redirect, useFetcher, useSearchParams, type LoaderFunctionArgs } from 'react-router';
import { toast } from 'sonner';
import {
  CheckCircleIcon,
  GitHubIcon,
  HashIcon,
  LockIcon,
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardHeader,
  NexCardTitle,
  SlackIcon
} from '~/core/components/nex';
import makeServerClient from '~/core/lib/supa-client.server';
import { cn } from '~/core/lib/utils';
import { ReviewGuideTooltip, ReviewModeBanner } from '../components/review-guide-tooltip';
import { getIntegrationsInfo, getWorkspace, getWorkspaceOnboardingState } from '../db/queries';
import { useIntegrationActions } from '../hooks/useIntegrationActions';
import { useIntegrationResponse } from '../hooks/useIntegrationResponse';
import { useIntegrationUI } from '../hooks/useIntegrationUI';
import type { ConnectionStatus } from '../lib/types';
import type { Route } from "./+types/integrations-review";

type ReviewStep = Database["public"]["Enums"]["review_step"];
type WorkspaceRow = Database["public"]["Tables"]["workspace"]["Row"];
type IntegrationsInfo = Awaited<ReturnType<typeof getIntegrationsInfo>>;
type OnboardingState = Awaited<ReturnType<typeof getWorkspaceOnboardingState>> | null;
type LoaderData = {
  workspace: WorkspaceRow;
  integrationsInfo: IntegrationsInfo;
  onboardingState: OnboardingState;
};

export const meta: Route.MetaFunction = () => {
    return [{ title: `Integrations Review | ${import.meta.env.VITE_APP_NAME}` }];
  };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const workspaceData = await getWorkspace(client, { userId: user.id });
  const workspace = workspaceData[0];
  const workspaceId = workspace.workspace_id;
  const isReviewMode = workspace.kind === "app_review" ? true : false;
  const isOnboardingCompleted = workspace.is_onboarding_completed;
  let onboardingState = null;
  if (isReviewMode || isOnboardingCompleted) {
    onboardingState = await getWorkspaceOnboardingState(client, { workspaceId: workspaceId });
  }

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
  return data({ user, workspace, integrationsInfo, onboardingState });
};

export default function IntegrationsReviewScreen( { loaderData }: Route.ComponentProps ) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "integrations" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { workspace, integrationsInfo, onboardingState } = loaderData;
  const workspaceId = workspace.workspace_id;
  const isReviewMode = onboardingState?.onboarding_mode === "slack_review" ? true : false;

  // Force English locale in review mode
  useEffect(() => {
    if (isReviewMode && i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
  }, [isReviewMode, i18n]);

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
  
  // レビューモード関連の状態
  const [currentReviewStep, setCurrentReviewStep] = useState<ReviewStep | null>(
    onboardingState?.review_step as ReviewStep | null
  );
  const [sampleDataResult, setSampleDataResult] = useState<{
    summary: string;
    stats: { channelCount: number; totalMessages: number; channels: { name: string; messageCount: number }[] };
  } | null>(null);
  const [isCollectingSampleData, setIsCollectingSampleData] = useState(false);
  
  // レビューステップ更新用のfetcher
  const reviewStepFetcher = useFetcher();
  const sampleDataFetcher = useFetcher();
  
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
    integrationsInfo,
    disableGitHubConnect: isReviewMode
  });

  // レビューステップ更新関数
  const updateReviewStep = useCallback((newStep: ReviewStep) => {
    if (!isReviewMode) return;
    
    reviewStepFetcher.submit(
      { workspaceId, reviewStep: newStep },
      { method: 'POST', action: '/api/settings/update-review-step', encType: 'application/json' }
    );
    setCurrentReviewStep(newStep);
  }, [isReviewMode, workspaceId, reviewStepFetcher]);

  // レビューモード初期化
  useEffect(() => {
    if (isReviewMode && !currentReviewStep) {
      // 最初のステップを設定
      updateReviewStep('review_start');
    }
  }, [isReviewMode, currentReviewStep, updateReviewStep]);

  // Slack接続完了時のレビューステップ更新
  useEffect(() => {
    if (isReviewMode && slackStatus === 'connected' && currentReviewStep === 'review_connect') {
      updateReviewStep('review_setup_channel');
    }
  }, [isReviewMode, slackStatus, currentReviewStep, updateReviewStep]);

  // チャンネル参加時のレビューステップ更新
  useEffect(() => {
    if (isReviewMode && currentReviewStep === 'review_setup_channel') {
      // ボットが参加しているチャンネルがあるかチェック
      const slackIntegration = integrations.find(i => i.type === 'slack');
      const channels = slackIntegration?.resourceCache?.channels || [];
      const memberChannels = channels.filter((ch: any) => {
        const currentMembership = channelMemberships[ch.id] ?? ch.is_member;
        return currentMembership;
      });
      
      if (memberChannels.length > 0) {
        updateReviewStep('review_collecting_data');
      }
    }
  }, [isReviewMode, currentReviewStep, integrations, channelMemberships, updateReviewStep]);

  // サンプルデータ収集関数
  const handleCollectSampleData = useCallback(() => {
    if (!isReviewMode) return;
    
    const slackIntegration = integrations.find(i => i.type === 'slack');
    const channels = slackIntegration?.resourceCache?.channels || [];
    const memberChannelIds = channels
      .filter((ch: any) => {
        const currentMembership = channelMemberships[ch.id] ?? ch.is_member;
        return currentMembership;
      })
      .map((ch: any) => ch.id);
    
    if (memberChannelIds.length === 0) {
      toast.error('The bot is not a member of any channels');
      return;
    }
    
    setIsCollectingSampleData(true);
    sampleDataFetcher.submit(
      { workspaceId, channelIds: memberChannelIds },
      { method: 'POST', action: '/api/settings/review-sample-data', encType: 'application/json' }
    );
  }, [isReviewMode, integrations, channelMemberships, workspaceId, sampleDataFetcher]);

  // サンプルデータ収集結果の処理
  useEffect(() => {
    if (sampleDataFetcher.state === 'idle' && sampleDataFetcher.data) {
      setIsCollectingSampleData(false);
      const response = sampleDataFetcher.data as any;
      
      if (response.status === 'success') {
        setSampleDataResult(response.data);
        // Only update if not already completed (prevent infinite loop)
        if (currentReviewStep !== 'review_completed') {
          updateReviewStep('review_completed');
          toast.success('Sample data collection completed!');
        }
      } else {
        toast.error(response.error || 'Data collection failed');
      }
    }
  }, [sampleDataFetcher.state, sampleDataFetcher.data, updateReviewStep, currentReviewStep]);

  // レビューモード: Slack未接続時は review_connect ステップへ
  useEffect(() => {
    if (isReviewMode && currentReviewStep === 'review_start' && slackStatus !== 'connected') {
      const timer = setTimeout(() => {
        updateReviewStep('review_connect');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isReviewMode, currentReviewStep, slackStatus, updateReviewStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Legal Links */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/legal/privacy-policy"
            className="text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-[#8B92B5] dark:text-[#6C6F7E]">|</span>
          <Link
            to="/legal/terms-of-service"
            className="text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-[#8B92B5] dark:text-[#6C6F7E]">|</span>
          <Link
            to="/legal/security-whitepaper"
            className="text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline transition-colors"
          >
            Security Whitepaper
          </Link>
        </div>

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

        {/* レビューモードバナー */}
        {isReviewMode && currentReviewStep && (
          <ReviewModeBanner currentStep={currentReviewStep} />
        )}

        {/* 통합 서비스 카드 목록 */}
        <div className="grid gap-6">
          {integrations
            .sort((a, b) => {
              // Slackを先に表示（integrations-review.tsxでのみ適用）
              if (a.type === 'slack' && b.type !== 'slack') return -1;
              if (a.type !== 'slack' && b.type === 'slack') return 1;
              return 0;
            })
            .map((integration) => (
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
                    {/* レビューモード: Slack Connect ボタンにツールチップ */}
                    {isReviewMode && integration.type === 'slack' && integration.status !== 'connected' ? (
                      <ReviewGuideTooltip
                        currentStep={currentReviewStep}
                        targetStep="review_connect"
                        position="left"
                      >
                        {getActionButton(integration)}
                      </ReviewGuideTooltip>
                    ) : (
                      getActionButton(integration)
                    )}
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
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                            {commonT("connectionComplete")} 
                          </span>
                        </div>
                        {isReviewMode && (
                          <ReviewGuideTooltip
                            currentStep={currentReviewStep}
                            targetStep="review_collecting_data"
                            position="left"
                          >
                            <NexButton
                              variant="primary"
                              size="sm"
                              onClick={handleCollectSampleData}
                              loading={isCollectingSampleData}
                              disabled={
                                currentReviewStep !== 'review_collecting_data' && 
                                currentReviewStep !== 'review_completed'
                              }
                            >
                              {isCollectingSampleData ? 'Collecting data...' : '📊 Collect Sample Data'}
                            </NexButton>
                          </ReviewGuideTooltip>
                        )}
                      </div>
                      <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mt-1">
                        {integration.name} {t("connectionCompleteDescription")}
                      </p>
                      
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
                                
                                {/* 채널 목록 - レビューモード時はツールチップ付き */}
                                <ReviewGuideTooltip
                                  currentStep={isReviewMode ? currentReviewStep : null}
                                  targetStep="review_setup_channel"
                                  position="bottom"
                                >
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
                                </ReviewGuideTooltip>
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

                          {/* レビューモード: サンプルデータ収集セクション */}
                          {isReviewMode && (
                            <div className="mt-4 pt-4 border-t border-[#E1E4E8] dark:border-[#2C2D30]">

                              {/* サンプルデータ結果表示 */}
                              {sampleDataResult && (
                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl">✅</span>
                                    <h4 className="font-bold text-green-800 dark:text-green-200">
                                      Sample data collection completed!
                                    </h4>
                                  </div>
                                  
                                  {/* 統計情報 */}
                                  <div className="mb-3 text-sm text-green-700 dark:text-green-300">
                                    <span className="font-medium">Collection result: </span>
                                    {sampleDataResult.stats.channelCount} channels / 
                                    {sampleDataResult.stats.totalMessages} messages
                                  </div>
                                  
                                  {/* AI要約 */}
                                  <div className="bg-white dark:bg-[#1A1B1E] rounded-lg p-4 border border-green-100 dark:border-green-900">
                                    <h5 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center gap-2">
                                      <span>🤖</span> AI Summary
                                    </h5>
                                    <div 
                                      className="text-sm text-[#8B92B5] dark:text-[#B4B5B9] whitespace-pre-wrap"
                                      dangerouslySetInnerHTML={{ 
                                        __html: sampleDataResult.summary
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\n/g, '<br />') 
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
              <div>
                <h4 className="font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2 flex items-center space-x-2">
                  <GitHubIcon className="w-4 h-4" />
                  <span>{t("help.githubConnection")}</span>
                </h4>
                <ul className="space-y-1 text-[#8B92B5] dark:text-[#6C6F7E] list-disc list-inside ml-6">
                  <li>{t("help.githubConnectionDescription1")}</li>
                  <li>{t("help.githubConnectionDescription2")} <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {t("help.githubConnectionDescription3")}</li>
                </ul>
              </div>
            </div>
          </NexCardContent>
        </NexCard>
      </div>
    </div>
  );
}

