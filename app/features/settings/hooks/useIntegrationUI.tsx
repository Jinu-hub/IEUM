/**
 * Integration UI Hook
 * 
 * Integration 관련 UI 요소들(배지, 버튼, 서비스 목록 등)을 생성하는 커스텀 훅입니다.
 * UI 로직을 컴포넌트에서 분리하여 재사용성과 테스트 가능성을 높입니다.
 */

import React from 'react';
import { 
  LinearBadge,
  LinearButton,
  CheckCircleIcon,
  PlusIcon,
  SettingsIcon,
  GitHubIcon,
  SlackIcon
} from '~/core/components/linear';
import type { ConnectionStatus } from '../lib/types';
import type { IntegrationService } from '../lib/constants';

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

  /**
   * 연결 상태에 따른 배지 컴포넌트 생성
   */
  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <LinearBadge 
            variant="success" 
            icon={<CheckCircleIcon className="w-3 h-3" />}
            className="ml-3"
          >
            연결됨
          </LinearBadge>
        );
      case 'connecting':
        return (
          <LinearBadge 
            variant="warning" 
            className="ml-3"
          >
            연결 중...
          </LinearBadge>
        );
      case 'disconnecting':
        return (
          <LinearBadge 
            variant="warning" 
            className="ml-3"
          >
            해제 중...
          </LinearBadge>
        );
      case 'disconnected':
      default:
        return (
          <LinearBadge 
            variant="secondary" 
            className="ml-3"
          >
            연결 안됨
          </LinearBadge>
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
        <LinearButton
          variant="secondary"
          size="sm"
          loading={true}
          disabled
        >
          연결 중...
        </LinearButton>
      );
    }

    if (status === 'disconnecting') {
      return (
        <LinearButton
          variant="secondary"
          size="sm"
          loading={true}
          disabled
        >
          해제 중...
        </LinearButton>
      );
    }

    if (status === 'connected') {
      return (
        <div className="flex gap-2">
          {onConfigure && (
            <LinearButton
              variant="ghost"
              size="sm"
              leftIcon={<SettingsIcon className="w-4 h-4" />}
              onClick={onConfigure}
            >
              설정
            </LinearButton>
          )}
          <LinearButton
            variant="secondary"
            size="sm"
            onClick={onDisconnect}
            className="flex items-center space-x-2 cursor-pointer"
          >
            연결 해제
          </LinearButton>
        </div>
      );
    }

    return (
      <LinearButton
        variant="primary"
        size="sm"
        leftIcon={<PlusIcon className="w-4 h-4" />}
        onClick={onConnect}
        className="flex items-center space-x-2 cursor-pointer"
      >
        연결하기
      </LinearButton>
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
      id: 'github',
      name: 'GitHub',
      description: 'GitHub 리포지토리에서 커밋, 이슈, PR 정보를 수집하고 리포트를 생성합니다.',
      icon: <GitHubIcon className="w-8 h-8" />,
      status: githubStatus,
      features: [
        '커밋 정보 수집',
        'PR(Pull Request) 추적',
        '이슈 관리',
        '기여자 분석',
        '자동 리포트 생성'
      ],
      onConnect: handleGitHubConnect,
      onDisconnect: handleGitHubDisconnect,
      onConfigure: () => console.log('GitHub 설정'),
      // DB에서 가져온 추가 정보
      ...(githubInfo && {
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
      id: 'slack',
      name: 'Slack',
      description: 'Slack 워크스페이스의 채널 메시지와 활동을 수집하고 분석합니다.',
      icon: <SlackIcon className="w-8 h-8" />,
      status: slackStatus,
      features: [
        '채널 메시지 수집',
        '사용자 활동 분석',
        '반응 및 참여도 측정',
        '팀 커뮤니케이션 인사이트',
        '자동 리포트 생성'
      ],
      onConnect: handleSlackConnect,
      onDisconnect: handleSlackDisconnect,
      onConfigure: () => console.log('Slack 설정'),
      // DB에서 가져온 추가 정보
      ...(slackInfo && {
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
