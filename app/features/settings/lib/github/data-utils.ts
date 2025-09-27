/**
 * GitHub Data Utilities
 * 
 * GitHub 데이터 처리를 위한 유틸리티 함수들입니다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export interface GitHubUser {
  login: string;
  name?: string;
  avatar_url: string;
  [key: string]: any;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string | null; // Allow null to match GitHub API
  owner: {
    login: string;
    avatar_url: string;
  };
  [key: string]: any;
}

export interface RepositoryStats {
  total: number;
  public: number;
  private: number;
  owned: number;
  collaborated: number;
}

export interface ProcessedRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  relationship: 'owner' | 'collaborator';
}

export interface GitHubConnectionResult {
  connected: boolean;
  user: {
    login: string;
    avatar_url: string;
    accessible_repos: RepositoryStats;
  };
  repositories: ProcessedRepository[];
}

/**
 * 리포지토리 통계 계산
 */
export function calculateRepositoryStats(
  repositories: GitHubRepository[], 
  userLogin: string
): RepositoryStats {
  return {
    total: repositories.length,
    public: repositories.filter(repo => !repo.private).length,
    private: repositories.filter(repo => repo.private).length,
    owned: repositories.filter(repo => repo.owner.login === userLogin).length,
    collaborated: repositories.filter(repo => repo.owner.login !== userLogin).length,
  };
}

/**
 * 리포지토리 데이터 변환 (API 응답용)
 */
export function transformRepositories(
  repositories: GitHubRepository[], 
  userLogin: string,
  limit: number = 30
): ProcessedRepository[] {
  return repositories.slice(0, limit).map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description,
    html_url: repo.html_url,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at || new Date().toISOString(), // Handle null case
    owner: {
      login: repo.owner.login,
      avatar_url: repo.owner.avatar_url,
    },
    relationship: repo.owner.login === userLogin ? 'owner' : 'collaborator'
  }));
}

/**
 * GitHub 연결 결과 생성 (통합 함수)
 */
export function createGitHubConnectionResult(
  user: GitHubUser,
  repositories: any[], // Accept any[] to handle GitHub API response
  options: {
    repositoryLimit?: number;
  } = {}
): GitHubConnectionResult {
  const { repositoryLimit = 30 } = options;
  
  // Type-safe conversion
  const typedRepos: GitHubRepository[] = repositories.map(repo => ({
    ...repo,
    updated_at: repo.updated_at || new Date().toISOString()
  }));
  
  const accessibleStats = calculateRepositoryStats(typedRepos, user.login);
  const transformedRepositories = transformRepositories(typedRepos, user.login, repositoryLimit);
  
  return {
    connected: true,
    user: {
      login: user.login,
      avatar_url: user.avatar_url,
      accessible_repos: accessibleStats,
    },
    repositories: transformedRepositories
  };
}

/**
 * GitHub App 설치 처리 통합 함수
 * 
 * GitHub App 설치 완료 후 연결 상태 확인, 리소스 캐시 생성, 
 * 데이터베이스 저장을 한 번에 처리합니다.
 */
export async function processGitHubInstallation(
  client: SupabaseClient<Database>,
  installationId: string,
  workspaceId: string,
  metadata: {
    installation_id: number;
    account: any;
    repository_selection: string;
    permissions: any;
    created_at: string;
    updated_at: string;
    setup_action: string | null;
  }
): Promise<{
  integration: any;
  status: any;
  resourceCacheJson: any;
}> {
  try {
    // 1. GitHub 연결 상태 확인
    const { checkGitHubConnection } = await import("../../api/github-integration");
    const connectionResult = await checkGitHubConnection(installationId);
    
    // 2. resourceCacheJson 형태로 데이터 변환
    const resourceCacheJson = connectionResult.connected ? {
      user: {
        login: connectionResult.user?.login,
        avatar_url: connectionResult.user?.avatar_url,
        accessible_repos: connectionResult.user?.accessible_repos
      },
      repos: connectionResult.repositories?.map(repo => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner?.login,
        private: repo.private,
        full_name: repo.full_name
      })) || []
    } : {};

    // 3. 데이터베이스에 integration 정보 저장/업데이트
    const { createOrUpdateIntegration } = await import("../../db/mutations");
    const result = await createOrUpdateIntegration(client, {
      workspace_id: workspaceId,
      type: 'github',
      credential_ref: installationId,
      connection_status: 'connected',
      metadata,
      resourceCacheJson
    });

    return {
      integration: result.integration,
      status: result.status,
      resourceCacheJson
    };
  } catch (error) {
    console.error('processGitHubInstallation error', error);
    throw error;
  }
}