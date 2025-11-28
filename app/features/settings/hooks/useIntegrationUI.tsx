/**
 * Integration UI Hook
 * 
 * Integration 관련 UI 요소들(배지, 버튼, 서비스 목록 등)을 생성하는 커스텀 훅입니다.
 * UI 로직을 컴포넌트에서 분리하여 재사용성과 테스트 가능성을 높입니다.
 */

import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  GitHubIcon,
  NexBadge,
  NexButton,
  PlusIcon,
  SettingsIcon,
  SlackIcon
} from '~/core/components/nex';
import type { IntegrationService } from '../lib/constants';
import type { ConnectionStatus } from '../lib/types';

interface UseIntegrationUIOptions {
  githubStatus: ConnectionStatus;
  slackStatus: ConnectionStatus;
  handleGitHubConnect: () => void;
  handleGitHubDisconnect: () => void;
  handleSlackConnect: () => void;
  handleSlackDisconnect: () => void;
  integrationsInfo?: any[]; // DB에서 가져온 integration 정보
}

/**
 * Integration UI 요소들을 생성하는 커스텀 훅
 * 
 * @param options - UI 생성에 필요한 상태와 핸들러들
 * @returns Integration 서비스 목록과 UI 유틸리티 함수들
 * 
 * @example
 * ```typescript
 * const { integrations, getStatusBadge, getActionButton } = useIntegrationUI({
 *   githubStatus,
 *   slackStatus,
 *   handleGitHubConnect,
 *   handleGitHubDisconnect,
 *   handleSlackConnect,
 *   handleSlackDisconnect
 * });
 * ```
 */
export function useIntegrationUI({
  githubStatus,
  slackStatus,
  handleGitHubConnect,
  handleGitHubDisconnect,
  handleSlackConnect,
  handleSlackDisconnect,
  integrationsInfo = []
}: UseIntegrationUIOptions) {
  const { t } = useTranslation("common", { keyPrefix: "integrations" });

  /**
   * 연결 상태에 따른 배지 컴포넌트 생성
   */
  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <NexBadge 
            variant="success" 
            icon={<CheckCircleIcon className="w-3 h-3" />}
            className="ml-3"
          >
            {t("status.connected")}
          </NexBadge>
        );
      case 'connecting':
        return (
          <NexBadge 
            variant="warning" 
            className="ml-3"
          >
            {t("status.connecting")}
          </NexBadge>
        );
      case 'disconnecting':
        return (
          <NexBadge 
            variant="warning" 
            className="ml-3"
          >
            {t("status.disconnecting")}
          </NexBadge>
        );
      case 'unauthorized':
        return (
          <NexBadge 
            variant="warning" 
            className="ml-3"
          >
            {t("status.unauthorized")}
          </NexBadge>
        );
      case 'disconnected':
      default:
        return (
          <NexBadge 
            variant="secondary" 
            className="ml-3"
          >
            {t("status.disconnected")}
          </NexBadge>
        );
    }
  };

  /**
   * 연결 상태에 따른 액션 버튼 생성
   */
  const getActionButton = (integration: IntegrationService) => {
    const { status, onConnect, onDisconnect, onConfigure } = integration;
    
    if (status === 'connecting') {
      return (
        <NexButton
          variant="secondary"
          size="sm"
          loading={true}
          disabled
        >
          {t("status.connecting")}
        </NexButton>
      );
    }

    if (status === 'disconnecting') {
      return (
        <NexButton
          variant="secondary"
          size="sm"
          loading={true}
          disabled
        >
          {t("status.disconnecting")}
        </NexButton>
      );
    }

    if (status === 'unauthorized') {
      return (
        <NexButton
          variant="secondary"
          size="sm"
          onClick={onConnect}
          className="flex items-center space-x-2 cursor-pointer"
        >
          {t("actions.verify")}
        </NexButton>
      );
    }

    if (status === 'connected') {
      return (
        <div className="flex gap-2">
          {onConfigure && (
            <NexButton
              variant="ghost"
              size="sm"
              leftIcon={<SettingsIcon className="w-4 h-4" />}
              onClick={onConfigure}
            >
              {t("actions.settings")}
            </NexButton>
          )}
          <NexButton
            variant="secondary"
            size="sm"
            onClick={onDisconnect}
            className="flex items-center space-x-2 cursor-pointer"
          >
            {t("actions.disconnect")}
          </NexButton>
        </div>
      );
    }

    return (
      <NexButton
        variant="primary"
        size="sm"
        leftIcon={<PlusIcon className="w-4 h-4" />}
        onClick={onConnect}
        className="flex items-center space-x-2 cursor-pointer"
      >
        {t("actions.connect")}
      </NexButton>
    );
  };

  /**
   * DB 데이터에서 특정 integration 정보 찾기
   */
  const getIntegrationInfo = (type: string) => {
    return integrationsInfo.find((info: any) => info.type === type);
  };

  /**
   * 통합 서비스 목록 생성 (DB 데이터와 머지)
   */
  const githubInfo = getIntegrationInfo('github');
  const slackInfo = getIntegrationInfo('slack');

  const integrations: IntegrationService[] = [
    {
      type: 'github',
      name: 'GitHub',
      description: t("github.description"),
      icon: <GitHubIcon className="w-8 h-8" />,
      status: githubStatus,
      features: [
        t("github.features.commits"),
        t("github.features.pullRequests"),
        t("github.features.issues"),
        t("github.features.contributors"),
        t("github.features.reports")
      ],
      onConnect: handleGitHubConnect,
      onDisconnect: handleGitHubDisconnect,
      onConfigure: () => console.log('GitHub 설정'),
      // DB에서 가져온 추가 정보
      ...(githubInfo && {
        id: githubInfo.integration_id,
        credentialRef: githubInfo.credential_ref,
        connectionStatus: githubInfo.connection_status,
        lastCheckedAt: githubInfo.last_checked_at,
        lastOkAt: githubInfo.last_ok_at,
        resourceCache: githubInfo.resource_cache_json,
        connectedAt: githubInfo.config_json?.connected_at,
        accessibleRepos: githubInfo.config_json?.accessible_repos
      })
    },
    {
      type: 'slack',
      name: 'Slack',
      description: t("slack.description"),
      icon: <SlackIcon className="w-8 h-8" />,
      status: slackStatus,
      features: [
        t("slack.features.messages"),
        t("slack.features.activity"),
        t("slack.features.engagement"),
        t("slack.features.insights"),
        t("slack.features.reports")
      ],
      onConnect: handleSlackConnect,
      onDisconnect: handleSlackDisconnect,
      onConfigure: () => console.log('Slack 설정'),
      // DB에서 가져온 追加 정보
      ...(slackInfo && {
        id: slackInfo.integration_id,
        credentialRef: slackInfo.credential_ref,
        connectionStatus: slackInfo.connection_status,
        lastCheckedAt: slackInfo.last_checked_at,
        lastOkAt: slackInfo.last_ok_at,
        resourceCache: slackInfo.resource_cache_json,
        connectedAt: slackInfo.config_json?.connected_at,
        accessibleChannels: slackInfo.config_json?.accessible_channels
      })
    }
  ];

  return {
    integrations,
    getStatusBadge,
    getActionButton
  };
}
