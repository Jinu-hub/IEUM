/**
 * Integration Actions Hook
 * 
 * Integration 연결/해제 액션을 처리하는 커스텀 훅입니다.
 * GitHub, Slack 등 다양한 integration 서비스의 공통된 액션 패턴을 처리합니다.
 */

import { useFetcher } from 'react-router';
import type { ConnectionStatus } from '../lib/types';

interface UseIntegrationActionsOptions {
  workspaceId: string;
  credentialRef?: string | null;
  integrationType: 'github' | 'slack';
  setStatus: (status: ConnectionStatus) => void;
}

/**
 * Integration 연결/해제 액션을 처리하는 커스텀 훅
 * 
 * @param options - 훅 설정 옵션들
 * @returns 연결/해제 핸들러 함수들과 fetcher
 * 
 * @example
 * ```typescript
 * const { handleConnect, handleDisconnect, fetcher } = useIntegrationActions({
 *   workspaceId,
 *   credentialRef: githubCredentialRef,
 *   integrationType: 'github',
 *   setStatus: setGithubStatus
 * });
 * ```
 */
export function useIntegrationActions({
  workspaceId,
  credentialRef,
  integrationType,
  setStatus
}: UseIntegrationActionsOptions) {
  const fetcher = useFetcher();

  /**
   * Integration 연결 처리
   */
  const handleConnect = async () => {
    setStatus('connecting');
    
    const formData = new FormData();
    formData.append('actionType', 'connect');
    formData.append('workspaceId', workspaceId);
    
    // credentialRef가 있으면 추가
    if (credentialRef) {
      formData.append('credentialRef', credentialRef);
    }
    
    // 첫 연결 시에는 /new 경로 사용
    const actionUrl = credentialRef 
      ? `/api/settings/${integrationType}-integration/${credentialRef}`
      : `/api/settings/${integrationType}-integration/new`;
    
    fetcher.submit(formData, {
      method: 'POST',
      action: actionUrl
    });
  };

  /**
   * Integration 연결 해제 처리  
   */
  const handleDisconnect = async () => {
    setStatus('disconnecting');
    
    const formData = new FormData();
    formData.append('actionType', 'disconnect');
    formData.append('workspaceId', workspaceId);
    formData.append('credentialRef', credentialRef || '');
    
    const actionUrl = credentialRef 
      ? `/api/settings/${integrationType}-integration/${credentialRef}`
      : `/api/settings/${integrationType}-integration/new`;
    
    fetcher.submit(formData, {
      method: 'POST',
      action: actionUrl
    });
  };

  return {
    handleConnect,
    handleDisconnect,
    fetcher
  };
}
