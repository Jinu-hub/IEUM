import { useState, useCallback } from 'react';
import type { IntegrationSource } from '../lib/types';
import type { SourceItem } from '../lib/constants';

/**
 * Integration 소스 관리를 위한 커스텀 훅
 * 
 * @param integrations - DB에서 가져온 integration 목록
 * @returns integration 소스 관리에 필요한 상태와 함수들
 */
export function useIntegrationSources(integrations: any[]) {
  const [integrationSources, setIntegrationSources] = useState<IntegrationSource[]>([]);
  const [availableSources, setAvailableSources] = useState<SourceItem[]>([]);

  /**
   * DB integrations에서 특정 타입의 소스 목록을 생성하는 함수
   */
  const getSourcesForIntegration = useCallback((integrationType: string): SourceItem[] => {
    const integ = integrations.find((i: any) => i.type === integrationType);
    if (!integ || integ.connection_status !== 'connected') return [];
    
    const cache: any = integ.resource_cache_json as any;
    
    if (integrationType === 'github' && Array.isArray(cache?.repos)) {
      return cache.repos.map((repo: any) => ({
        id: String(repo.id ?? repo.name),
        name: repo.full_name || repo.name,
        description: repo.description || '',
        url: repo.html_url,
        variant: repo.private ? 'warning' : 'success' as const,
      }));
    }
    
    if (integrationType === 'slack' && Array.isArray(cache?.channels)) {
      return cache.channels
        .filter((ch: any) => ch.is_member)
        .map((ch: any) => ({
          id: ch.id,
          name: `#${ch.name}`,
          description: ch.is_private ? '비공개 채널' : '공개 채널',
          variant: 'success' as const,
        }));
    }
    
    return [];
  }, [integrations]);

  /**
   * 새로운 integration 소스를 추가하는 함수
   */
  const handleAddSource = useCallback((newIntegration: {
    integrationType: string;
    sourceIdent: string;
  }) => {
    if (
      newIntegration.integrationType && 
      newIntegration.sourceIdent &&
      newIntegration.integrationType !== 'no-integrations' &&
      newIntegration.sourceIdent !== 'no-sources-available'
    ) {
      const integration = integrations.find((i: any) => i.type === newIntegration.integrationType);
      const sourceType = integration?.type === 'github' ? 'github_repo' : 'slack_channel';
      
      const newSource: IntegrationSource = {
        id: Date.now().toString(),
        integrationId: integration?.integration_id || '',
        integrationType: newIntegration.integrationType,
        sourceType,
        sourceIdent: newIntegration.sourceIdent,
      };

      setIntegrationSources(prev => [...prev, newSource]);
      return true; // 성공적으로 추가됨을 알림
    }
    return false; // 추가 실패
  }, [integrations]);

  /**
   * integration 소스를 제거하는 함수
   */
  const handleRemoveSource = useCallback((id: string) => {
    setIntegrationSources(prev => prev.filter(source => source.id !== id));
  }, []);

  /**
   * 사용 가능한 소스 목록을 업데이트하는 함수
   */
  const updateAvailableSources = useCallback((integrationType: string) => {
    const sources = getSourcesForIntegration(integrationType);
    setAvailableSources(sources);
  }, [getSourcesForIntegration]);

  return {
    // 상태
    integrationSources,
    availableSources,
    
    // 상태 업데이트 함수
    setIntegrationSources,
    setAvailableSources,
    updateAvailableSources,
    
    // 비즈니스 로직 함수
    getSourcesForIntegration,
    handleAddSource,
    handleRemoveSource,
  };
}

export type { IntegrationSource };
