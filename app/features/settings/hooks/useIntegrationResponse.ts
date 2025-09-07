/**
 * Integration Response Handler Hook
 * 
 * GitHub, Slack 등 다양한 integration 서비스의 API 응답을 처리하는 커스텀 훅입니다.
 * 공통된 응답 패턴을 처리하고 상태 관리를 자동화합니다.
 */

import { useEffect } from 'react';
import type { ConnectionStatus } from '../lib/types';

type IntegrationData = any; // 실제 타입으로 교체 가능

interface IntegrationResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  message?: string;
}

interface UseIntegrationResponseOptions {
  onOAuthRequired?: (oauthUrl: string) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onDisconnect?: () => void;
}

/**
 * Integration API 응답을 처리하는 커스텀 훅
 * 
 * @param fetcherData - Fetcher에서 받은 응답 데이터
 * @param setStatus - 연결 상태를 설정하는 함수
 * @param setData - Integration 데이터를 설정하는 함수
 * @param integrationType - Integration 타입 ('github' | 'slack')
 * @param options - 추가 콜백 옵션들
 * 
 * @example
 * ```typescript
 * useIntegrationResponse(
 *   githubFetcher.data,
 *   setGithubStatus,
 *   setGithubData,
 *   'github',
 *   {
 *     onOAuthRequired: (url) => window.open(url, '_blank'),
 *     onSuccess: (data) => console.log('Connected!', data),
 *     onError: (error) => toast.error(error)
 *   }
 * );
 * ```
 */
export function useIntegrationResponse(
  fetcherData: IntegrationResponse | undefined,
  setStatus: (status: ConnectionStatus) => void,
  integrationType: 'github' | 'slack',
  options: UseIntegrationResponseOptions = {}
) {
  useEffect(() => {
    if (!fetcherData) return;

    const { status, data, error, message } = fetcherData;
    console.log(`${integrationType.toUpperCase()} API 응답:`, { status, data, error, message });
    
    if (status === 'success') {
      if (data) {
        // OAuth 처리
        if (data.oauth_required) {
          setStatus('disconnected');
          console.log('OAuth integration will be implemented:', data.oauth_url);
          if (options.onOAuthRequired) {
            options.onOAuthRequired(data.oauth_url);
          } else {
            alert('GitHub OAuth 연동 기능은 곧 구현될 예정입니다!');
          }
        } else {
          // 일반적인 연결 성공 처리
          const newStatus = data.connected ? 'connected' : 'disconnected';
          console.log(`${integrationType} 상태 변경: ${newStatus}`);
          setStatus(newStatus);
          
          if (integrationType === 'github') {
            console.log('GitHub 데이터 설정됨:', {
              connected: data.connected,
              repositoriesCount: data.repositories?.length || 0,
              repositories: data.repositories?.map((r: any) => r.name) || []
            });
          }
          
          if (options.onSuccess) {
            options.onSuccess(data);
          }
        }
      } else {
        // disconnect 성공 시
        setStatus('disconnected');
        if (options.onDisconnect) {
          options.onDisconnect();
        }
      }
      
      if (message) {
        console.log(message);
      }
    } else {
      // 에러 처리
      setStatus('disconnected');
      console.error(`${integrationType.toUpperCase()} 요청 실패:`, error);
      if (options.onError) {
        options.onError(error || 'Unknown error');
      }
    }
  }, [fetcherData, setStatus, integrationType, options]);
}

export type { IntegrationResponse, UseIntegrationResponseOptions };
