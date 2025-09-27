/**
 * GitHub App Installation Callback Handler
 * 
 * GitHub App 설치 완료 후 콜백을 처리하는 API 엔드포인트입니다.
 * installation_id와 setup_action을 받아 연결을 완료합니다.
 */

import { type LoaderFunctionArgs, data, redirect } from "react-router";
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * GitHub App 설치 완료 콜백 처리
 * 
 * URL 파라미터:
 * - installation_id: GitHub App 설치 ID
 * - setup_action: 설치 액션 (install, update 등)
 * - state: 설치 시 전달된 상태 정보 (workspaceId, userId 포함)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installation_id');
    const setupAction = url.searchParams.get('setup_action');
    const state = url.searchParams.get('state');

    logger.info('🔄 GitHub App callback received', { 
      fullUrl: request.url,
      installationId, 
      setupAction, 
      state: state ? 'present' : 'missing',
      allParams: Object.fromEntries(url.searchParams.entries())
    });

    console.log('🔄 GitHub App 콜백 수신:', {
      fullUrl: request.url,
      installationId,
      setupAction,
      state: state ? 'present' : 'missing',
      allParams: Object.fromEntries(url.searchParams.entries())
    });

    // setup_action이 'request'인 경우 관리자 승인 대기 상태
    if (setupAction === 'request' && !installationId) {
      logger.info('GitHub App installation pending admin approval', {
        setupAction,
        fullUrl: request.url
      });
      
      return redirect('/settings/integrations?status=approval_pending&message=' + 
        encodeURIComponent('GitHub App 설치 요청이 관리자에게 전송되었습니다. 승인을 기다려주세요.'));
    }

    // 필수 파라미터 확인
    if (!installationId) {
      logger.error('Missing installation_id in callback');
      return redirect('/settings/integrations?error=missing_installation_id');
    } 

    if (!state) {
      logger.error('Missing state parameter in callback');
      return redirect('/settings/integrations?error=missing_state');
    }

    // state 파라미터 파싱
    let stateData: { workspaceId: string; userId: string };
    try {
      const decodedState = Buffer.from(decodeURIComponent(state), 'base64').toString('utf-8');
      stateData = JSON.parse(decodedState);
      
      if (!stateData.workspaceId || !stateData.userId) {
        throw new Error('Invalid state data structure');
      }
    } catch (error) {
      logger.error('Failed to parse state parameter', { error: String(error) });
      return redirect('/settings/integrations?error=invalid_state');
    }

    // 사용자 인증 확인
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user || user.id !== stateData.userId) {
      logger.error('User authentication failed or mismatched', { 
        expectedUserId: stateData.userId, 
        actualUserId: user?.id 
      });
      return redirect('/settings/integrations?error=authentication_failed');
    }

    // GitHub App 설치 정보 확인
    try {
      const { getInstallationOctokit } = await import("~/core/integrations/github/client");
      const octokit = await getInstallationOctokit(Number(installationId));
      
      const { data: installation } = await octokit.rest.apps.getInstallation({
        installation_id: Number(installationId)
      });

      logger.info('GitHub App installation verified', { 
        installationId, 
        account: installation.account && "login" in installation.account ? installation.account.login : installation.account?.name,
        repositorySelection: installation.repository_selection 
      });

      // GitHub App 설치 처리 (연결 상태 확인, 리소스 캐시 생성, DB 저장)
      const { processGitHubInstallation } = await import("../lib/github/data-utils");
      await processGitHubInstallation(client, installationId, stateData.workspaceId, {
        installation_id: Number(installationId),
        account: installation.account,
        repository_selection: installation.repository_selection,
        permissions: installation.permissions,
        created_at: installation.created_at,
        updated_at: installation.updated_at,
        setup_action: setupAction
      });

      logger.info('GitHub integration saved successfully', { 
        workspaceId: stateData.workspaceId,
        installationId,
        account: installation.account && "login" in installation.account ? installation.account.login : installation.account?.name 
      });

      // 성공 시 설정 페이지로 리다이렉트
      return redirect('/settings/integrations?success=github_connected');

    } catch (error: any) {
      logger.error('Failed to verify GitHub App installation', { 
        error: error.message, 
        installationId 
      });
      
      return redirect(`/settings/integrations?error=installation_failed&details=${encodeURIComponent(error.message)}`);
    }

  } catch (error: any) {
    logger.error('GitHub App callback handler error', { error: error.message });
    return redirect(`/settings/integrations?error=callback_failed&details=${encodeURIComponent(error.message)}`);
  }
}

/**
 * POST 요청은 지원하지 않음 (GitHub는 GET으로 콜백 호출)
 */
export async function action() {
  return data({ error: "Method not allowed" }, { status: 405 });
}
