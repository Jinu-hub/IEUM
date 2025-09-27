/**
 * GitHub Integration API Endpoint
 *
 * GitHub 통합 설정을 관리하는 API 엔드포인트입니다.
 * 연결 상태 확인, 연결 설정, 연결 해제 기능을 제공합니다.
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { createOctokit } from "~/core/integrations/github/client";
import { logger } from "~/core/lib/logger";
import { 
   createIntegrationWithStatus
  , createIntegrationStatusError    
  , updateCredentialRef } from "../../db/mutations";
import { getIntegrations } from "../../db/queries";
import { generateCredentialRef } from "../common";

/**
 * GitHub 통합 설정 스키마
 */
const githubIntegrationSchema = z.object({
  workspaceId: z.string(),
  actionType: z.enum(['connect', 'disconnect', 'check']),
  credentialRef: z.string().optional(),
});

/**
 * GitHub 연결 상태 확인
 */
export async function checkGitHubConnection(token: string): Promise<{
  connected: boolean;
  user?: any;
  rateLimit?: any;
  //tokenInfo?: any;
  repositories?: any[];
  error?: string;
}> {
  try {

    const octokit = createOctokit(token);
    
    // GitHub API로 인증 확인 (헤더 정보 포함)
    const userResponse = await octokit.rest.users.getAuthenticated();
    const { data: user } = userResponse;
    const { data: rateLimit } = await octokit.rest.rateLimit.get();
    
    // GitHub API 응답 헤더에서 토큰 관련 정보 확인
    //const tokenScopes = userResponse.headers['x-oauth-scopes'];
    //const acceptedScopes = userResponse.headers['x-accepted-oauth-scopes'];
    
    // 사용자가 접근 가능한 모든 리포지토리 가져오기 (개인 + 팀 + 조직)
    const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all', // 모든 리포지토리 (public + private)
      sort: 'updated',
      per_page: 100, // 더 많은 리포지토리 가져오기
      // affiliation: 모든 관련된 리포지토리 (소유자, 협력자, 조직 멤버)
      affiliation: 'owner,collaborator,organization_member',
    });
    
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
 * Loader: 현재 GitHub 연결 상태 반환
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }
 
    // credentialRef가 있으면 Secrets Manager에서 토큰 조회
    const { getGitHubToken, getGitHubTokenFromEnv } = await import("~/core/lib/secrets-manager.server");
    //const token = await getGitHubToken(params.credentialRef) || undefined;
    const token = await getGitHubTokenFromEnv() || undefined;
    if (!token) {
      return data({ 
        status: 'error', 
        error: 'No GitHub token found' 
      }, { status: 400 });
    }

    // GitHub 연결 상태 확인
    const connectionStatus = await checkGitHubConnection(token);
    
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
export async function action({ request, params }: ActionFunctionArgs) {
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

    const { workspaceId, actionType } = validationResult.data;
    // FormData에서 credentialRef 우선, URL 파라미터는 fallback
    const credentialRef = rawData.credentialRef || params.credentialRef;
    
    // 첫 연결 시에는 credentialRef가 없을 수 있음 (OAuth 준비) TODO:
    // 방법1. integration과 integration_statuses가 없거나 connection_status가 never인 경우에 OAuth 처리
    // 방법2. (방법1을 포함)credentialRef가 유효하지 않은 경우에 OAuth 처리 : 좀더 빈번하게 OAuth처리를 하게됨
    /*
    if (actionType === 'connect' && (!credentialRef || credentialRef === 'new')) {
      console.log('First time connection - OAuth flow will be implemented');
      
      // TODO: OAuth 2.0 구현 시 여기서 GitHub OAuth 리디렉션 처리
      return data({
        status: 'success',
        message: 'OAuth integration will be implemented soon',
        data: {
          connected: false,
          oauth_required: true,
          oauth_url: 'https://github.com/login/oauth/authorize' // 추후 실제 OAuth URL
        }
      });
    }
    */

    const { getGitHubToken, getGitHubTokenFromEnv } = await import("~/core/lib/secrets-manager.server");
    //const token = await getGitHubToken(credentialRef as string) || undefined;
    const token = await getGitHubTokenFromEnv() || undefined;
    console.log('token', token);
    if (!token) {
      console.log('No GitHub token found');
      return data({ 
        status: 'error', 
        error: 'No GitHub token found' 
      }, { status: 400 });
    }

    switch (actionType) {
      case 'check': {
        const connectionStatus = await checkGitHubConnection(token);
        return data({
          status: 'success',
          data: connectionStatus
        });
      }

      case 'connect': {
        // credentialRef로 연결 테스트
        const connectionStatus = await checkGitHubConnection(token);
        
        // repositories의 owner 정보를 자세히 로그로 출력
        /*
        if (connectionStatus.repositories && Array.isArray(connectionStatus.repositories)) {
          console.log('📊 Repositories Owner 정보:');
          connectionStatus.repositories.forEach((repo: any, index: number) => {
            console.log(`  ${index + 1}. Repository: ${repo.name}`);
            console.log(`     Owner: ${repo.owner?.login || repo.owner || 'Unknown'}`);
            console.log(`     Full Name: ${repo.full_name || 'N/A'}`);
            console.log(`     ID: ${repo.id || 'N/A'}`);
            console.log(`     Private: ${repo.private ? 'Yes' : 'No'}`);
            console.log('     ---');
          });
        } else {
          console.log('❌ Repositories 정보가 없거나 배열이 아닙니다:', connectionStatus.repositories);
        }
        */
        const isConnected = connectionStatus.connected;

        try {
          // 기존 integration 조회 및 Secret 정리
          let existingCredentialRef = null;
          let existingIntegrationId = null;
          if (credentialRef && credentialRef !== 'new') {
            try {
              const integrations = await getIntegrations(client, { workspaceId, type: 'github' });
              existingCredentialRef = integrations?.credential_ref;
              existingIntegrationId = integrations?.integration_id;
            } catch (error) {
              logger.warn('Failed to fetch existing integration for cleanup', { 
                workspaceId, 
                error: String(error) 
              });
            }
          }

          // 새로운 credentialRef 생성
          const credentialRef_new = generateCredentialRef('github', user.id.substring(0, 8));
          if (isConnected) {

            // Integration과 Status를 트랜잭션으로 함께 저장
            try {
              const result = await createIntegrationWithStatus(client, {
                workspaceId: workspaceId,
                type: 'github',
                name: `GitHub - ${connectionStatus.user?.login || 'Unknown'}`,
                credential_ref: credentialRef_new,
                config_json: {
                  connected_at: new Date().toISOString()
                  , accessible_repos: connectionStatus.user?.accessible_repos
                },
                connectionStatus: 'connected',
                resourceCacheJson: {
                  user: connectionStatus.user,
                  repos: connectionStatus.repositories ? 
                     connectionStatus.repositories.map((r: any) => ({
                       id: r.id,
                       owner: r.owner?.login,
                       name: r.name,
                       full_name: r.full_name,
                       private: r.private,
                     })) : []
                }
              });

            // Secrets Manager에 토큰 저장 TODO:
            /*
            const storeResult = await secretsManager.storeSecret(credentialRef_new, token);
            if (!storeResult.success) {
              return data({ status: 'error', error: `Failed to store GitHub token: ${storeResult.error}`
              }, { status: 500 });
            }
            */
              
              logger.info('Integration record saved successfully', { integrationId: result.integration.integration_id });
            } catch (error) {
              logger.error('Failed to save integration record', { error });
              return data({
                status: 'error',
                error: 'Failed to save integration settings'
              }, { status: 500 });
            }
          } else {
            await createIntegrationStatusError(client, { 
              integrationId: existingIntegrationId as string,
              workspaceId: workspaceId, connectionStatus: 'error', 
              providerErrorCode: 'CONNECTION_ERROR', providerErrorMessage: connectionStatus.error as string});
          }

          // 기존 Secret 삭제 (보안상 중요) TODO:
          if (existingCredentialRef) {
            //await deleteIntegrationSecret({ credentialRef: existingCredentialRef });
          }

          if (isConnected) {
            logger.info('GitHub integration connected successfully', { 
              userId: user.id, credentialRef_new, userLogin: connectionStatus.user?.login 
            });

            return data({
              status: 'success',
              message: 'GitHub integration connected successfully',
              data: {...connectionStatus, credentialRef_new}
            });
          } else {
            logger.info('Failed to connect GitHub integration', { 
              userId: user.id, userLogin: connectionStatus.user?.login 
            });

            return data({
              status: 'error',
              message: 'Failed to connect GitHub integration',
              error: connectionStatus.error || 'Failed to connect to GitHub'
            });
          } 

        } catch (error) {
          logger.error('Failed to connect GitHub integration', { error });
          return data({
            status: 'error',
            error: 'Failed to connect GitHub integration'
          }, { status: 500 });
        }
      }

      case 'disconnect': {
        try {
          
          // 기존 integration 정보 조회
          let existingIntegration = null;
          try {
            const integrations = await getIntegrations(client, { workspaceId, type: 'github' });
            existingIntegration = integrations;
          } catch (error) {
            logger.warn('Failed to fetch existing integration', { 
              workspaceId, 
              type: 'github', 
              error: String(error) 
            });
            // 조회 실패해도 계속 진행 (새로운 integration 생성)
          }

          if (existingIntegration) {
            try {
              // credential_ref를 빈 문자열로 업데이트
              await updateCredentialRef(client, { workspaceId, type: 'github', credential_ref: '' });
            } catch (error) {
              logger.error('Failed to delete integration record', { error });
              return data({
                status: 'error',
                error: 'Failed to disconnect integration'
              }, { status: 500 });
            }
          }

          // Secret 삭제 (integration이 있는 경우) TODO:
          if (existingIntegration?.credential_ref) {
            //  await deleteIntegrationSecret({ credentialRef: existingIntegration.credential_ref });
          }

          logger.info('GitHub integration disconnected successfully', { workspaceId });
          
          return data({
            status: 'success',
            message: 'GitHub integration disconnected successfully'
          });
        } catch (error) {
          logger.error('Failed to disconnect GitHub integration', { error });
          return data({
            status: 'error',
            error: 'Failed to disconnect GitHub integration'
          }, { status: 500 });
        }
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
