/**
 * GitHub Integration API Endpoint
 *
 * GitHub 통합 설정을 관리하는 API 엔드포인트입니다.
 * 연결 상태 확인, 연결 설정, 연결 해제 기능을 제공합니다.
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { getGithubConfig } from "~/core/integrations/github/config";
import { createOctokit } from "~/core/integrations/github/client";
import { logger } from "~/core/lib/logger";

/**
 * GitHub 통합 설정 스키마
 */
const githubIntegrationSchema = z.object({
  action: z.enum(['connect', 'disconnect', 'check']),
  token: z.string().optional(),
  repos: z.string().optional(), // comma-separated repository list
});

type GitHubIntegrationRequest = z.infer<typeof githubIntegrationSchema>;

/**
 * GitHub 연결 상태 확인
 */
async function checkGitHubConnection(token?: string): Promise<{
  connected: boolean;
  user?: any;
  rateLimit?: any;
  repositories?: any[];
  error?: string;
}> {
  try {
    if (!token) {
      // 환경변수에서 토큰 확인
      token = process.env.GITHUB_TOKEN;
    }
    
    if (!token) {
      return { connected: false, error: "No GitHub token found" };
    }

    const octokit = createOctokit(token);
    
    // GitHub API로 인증 확인
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: rateLimit } = await octokit.rest.rateLimit.get();
    
    // 사용자가 접근 가능한 모든 리포지토리 가져오기 (개인 + 팀 + 조직)
    const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all', // 모든 리포지토리 (public + private)
      sort: 'updated',
      per_page: 100, // 더 많은 리포지토리 가져오기
      // affiliation: 모든 관련된 리포지토리 (소유자, 협력자, 조직 멤버)
      affiliation: 'owner,collaborator,organization_member',
    });
    
    /*
    logger.info('GitHub repositories fetched', { 
      count: repositories.length,
      userLogin: user.login,
      repositoryNames: repositories.map(r => r.full_name)
    });
    */
    
    // 접근 가능한 리포지토리 통계 계산
    const accessibleStats = {
      total: repositories.length,
      public: repositories.filter(repo => !repo.private).length,
      private: repositories.filter(repo => repo.private).length,
      owned: repositories.filter(repo => repo.owner.login === user.login).length,
      collaborated: repositories.filter(repo => repo.owner.login !== user.login).length,
    };
    
    return {
      connected: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        public_repos: user.public_repos,
        total_private_repos: user.total_private_repos,
        owned_private_repos: user.owned_private_repos,
        // 실제 접근 가능한 리포지토리 통계 추가
        accessible_repos: accessibleStats,
      },
      rateLimit: {
        limit: rateLimit.rate.limit,
        remaining: rateLimit.rate.remaining,
        reset: rateLimit.rate.reset,
      },
      repositories: repositories.slice(0, 30).map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
        // 사용자와의 관계 표시
        relationship: repo.owner.login === user.login ? 'owner' : 'collaborator'
      }))
    };
  } catch (error: any) {
    logger.error('GitHub connection check failed', { error: error.message });
    return { 
      connected: false, 
      error: error.message || 'Failed to connect to GitHub' 
    };
  }
}

/**
 * GitHub 설정 저장 (환경변수나 데이터베이스에)
 * 실제 구현에서는 사용자별 설정을 데이터베이스에 저장해야 합니다.
 */
async function saveGitHubSettings(userId: string, settings: {
  token?: string;
  repos?: string;
}) {
  // TODO: 실제 구현에서는 사용자별 GitHub 설정을 데이터베이스에 저장
  // 현재는 시뮬레이션만 수행
  logger.info('Saving GitHub settings', { userId, hasToken: !!settings.token });
  return true;
}

/**
 * GitHub 설정 삭제
 */
async function removeGitHubSettings(userId: string) {
  // TODO: 실제 구현에서는 사용자별 GitHub 설정을 데이터베이스에서 삭제
  logger.info('Removing GitHub settings', { userId });
  return true;
}

/**
 * Loader: 현재 GitHub 연결 상태 반환
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    // GitHub 연결 상태 확인
    const connectionStatus = await checkGitHubConnection();
    
    return data({
      status: 'success',
      data: {
        connected: connectionStatus.connected,
        user: connectionStatus.user,
        rateLimit: connectionStatus.rateLimit,
        repositories: connectionStatus.repositories, // 🔧 repositories 추가!
        error: connectionStatus.error,
      }
    });
  } catch (error: any) {
    logger.error('GitHub integration loader error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Action: GitHub 통합 설정 관리
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData);
    
    const validationResult = githubIntegrationSchema.safeParse(rawData);
    if (!validationResult.success) {
      return data({ 
        status: 'error', 
        error: 'Invalid request data',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { action: actionType, token, repos } = validationResult.data;

    switch (actionType) {
      case 'check': {
        const connectionStatus = await checkGitHubConnection(token);
        return data({
          status: 'success',
          data: connectionStatus
        });
      }

      case 'connect': {
        if (!token) {
          return data({ 
            status: 'error', 
            error: 'GitHub token is required for connection' 
          }, { status: 400 });
        }

        // 토큰으로 연결 테스트
        const connectionStatus = await checkGitHubConnection(token);
        
        if (!connectionStatus.connected) {
          return data({
            status: 'error',
            error: connectionStatus.error || 'Failed to connect to GitHub'
          }, { status: 400 });
        }

        // 설정 저장
        await saveGitHubSettings(user.id, { token, repos });
        
        return data({
          status: 'success',
          message: 'GitHub integration connected successfully',
          data: connectionStatus
        });
      }

      case 'disconnect': {
        // 설정 삭제
        await removeGitHubSettings(user.id);
        
        return data({
          status: 'success',
          message: 'GitHub integration disconnected successfully'
        });
      }

      default:
        return data({ 
          status: 'error', 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('GitHub integration action error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}
