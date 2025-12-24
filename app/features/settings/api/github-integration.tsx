/**
 * GitHub Integration API Endpoint
 *
 * GitHub 통합 설정을 관리하는 API 엔드포인트입니다.
 * 연결 상태 확인, 연결 설정, 연결 해제 기능을 제공합니다.
 */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
// GitHub App 관련 import는 필요시 동적으로 로드
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  updateCredentialRef
} from "../db/mutations";
import { getIntegrations } from "../db/queries";

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
export async function checkGitHubConnection(installationId: string): Promise<{
  connected: boolean;
  user?: any;
  rateLimit?: any;
  //tokenInfo?: any;
  repositories?: any[];
  error?: string;
}> {
  try {
    
    const { getInstallationOctokit } = await import("~/core/integrations/github/client");
    const octokit = await getInstallationOctokit(Number(installationId));

    const installs = await octokit.request("GET /app/installations");
    const user = installs.data.find((i: any) => i.id === Number(installationId))?.account as any;
    
    const repositories = await octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      { per_page: 100 }
    );
    
    const { createGitHubConnectionResult } = await import("../lib/github/data-utils");
    const result = createGitHubConnectionResult(user, repositories, { repositoryLimit: 30 });
    
    console.log('result', result);
    
    return result;
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
 
    const installationId = params.credentialRef || undefined;
    if (!installationId) {
      return data({ 
        status: 'error', 
        error: 'No GitHub installationId found' 
      }, { status: 400 });
    }

    // GitHub 연결 상태 확인
    const connectionStatus = await checkGitHubConnection(installationId);
    
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
    const installationId = rawData.credentialRef || params.credentialRef;

    switch (actionType) {
      case 'check': {
        const connectionStatus = await checkGitHubConnection(installationId as string);
        return data({
          status: 'success',
          data: connectionStatus
        });
      }

      case 'connect': {
        console.log('🔧 GitHub connect 시작');
        console.log('🔧 installationId:', installationId);
        console.log('🔧 workspaceId:', workspaceId);
        console.log('🔧 user.id:', user.id);
        
        // installationId가 없으면 GitHub App 설치 페이지로 리다이렉트
        if (!installationId || installationId === 'new') {
          const { GITHUB_APP_SLUG } = await import("~/core/integrations/github/client");
        
          // GitHub App 설치 URL 생성
          const installUrl = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
          
          // state 파라미터로 workspaceId 전달 (보안을 위해 JWT 토큰 사용 가능)
          const state = Buffer.from(JSON.stringify({ workspaceId, userId: user.id })).toString('base64');
          
          // setup_url 파라미터로 콜백 URL 전달
          const redirectUrl = `${installUrl}?state=${encodeURIComponent(state)}`;

          logger.info('Redirecting to GitHub App installation', { 
            workspaceId, 
            userId: user.id, 
            redirectUrl 
          });
          
          return data({
            status: 'redirect',
            redirectUrl,
            message: 'Redirecting to GitHub App installation'
          });
        } else {
          // installationId가 있으면 GitHub App 설치 설정 페이지로 리다이렉트
          const settingsUrl = `https://github.com/settings/installations/${installationId}`;
          
          logger.info('Redirecting to GitHub App installation settings', { 
            workspaceId, 
            userId: user.id, 
            installationId,
            redirectUrl: settingsUrl
          });
          
          return data({
            status: 'redirect',
            redirectUrl: settingsUrl,
            message: 'Redirecting to GitHub App installation settings'
          });
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
