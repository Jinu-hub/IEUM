/**
 * GitHub App Webhook Handler
 * 
 * GitHub App 이벤트(설치, 승인, 제거 등)를 처리하는 웹훅 엔드포인트입니다.
 */

import { type ActionFunctionArgs, data } from "react-router";
import { logger } from "~/core/lib/logger";

/**
 * GitHub 웹훅 이벤트 처리
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = await request.json();
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');

    logger.info('GitHub webhook received', { 
      event, 
      delivery,
      action: payload.action,
      installation_id: payload.installation?.id
    });

    switch (event) {
      case 'installation':
        return await handleInstallationEvent(payload);
      
      case 'installation_repositories':
        return await handleInstallationRepositoriesEvent(payload);
      
      default:
        logger.info('Unhandled GitHub webhook event', { event });
        return data({ message: 'Event received' }, { status: 200 });
    }

  } catch (error: any) {
    logger.error('GitHub webhook error', { error: error.message });
    return data({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Installation 이벤트 처리 (승인, 제거 등)
 */
async function handleInstallationEvent(payload: any) {
  const { action, installation } = payload;
  const installationId = installation?.id;

  logger.info('Processing installation event', { 
    action, 
    installationId,
    account: installation?.account?.login 
  });

  switch (action) {
    case 'created':
      // 관리자가 승인하여 설치가 완료된 경우
      logger.info('GitHub App installation approved', { 
        installationId,
        account: installation.account?.login 
      });
      /*
      // GitHub App 설치 시 전달된 state 데이터가 없으므로 다른 방법 필요
      // 일단 가장 최근 pending 요청을 찾고, state 데이터로 검증
      const { findInstallationRequestByState, updateInstallationRequestStatus } = await import("../db/github-installation-requests");
      
      // 모든 pending 요청을 가져와서 하나씩 검증
      const { data: allPendingRequests, error: fetchError } = await adminClient
        .from('github_installation_requests')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        logger.error('Failed to fetch pending requests', { error: fetchError });
        return;
      }

      let matchedRequest = null;
      let workspaceId = null;
      let userId = null;

      // 각 요청의 state 데이터를 확인하여 적절한 요청 찾기
      // 시간 기반 매칭: 웹훅 수신 시점과 가장 가까운 요청을 찾음
      const webhookTime = new Date();
      let bestMatch = null;
      let bestTimeDiff = Infinity;

      for (const request of allPendingRequests || []) {
        try {
          const stateData = JSON.parse(Buffer.from(request.state_data, 'base64').toString('utf-8'));
          const requestTime = new Date(request.created_at);
          const timeDiff = Math.abs(webhookTime.getTime() - requestTime.getTime());
          
          // 15분 이내의 요청 중에서 가장 최근 것을 선택
          if (timeDiff < 15 * 60 * 1000 && timeDiff < bestTimeDiff) {
            bestMatch = {
              request,
              stateData,
              timeDiff
            };
            bestTimeDiff = timeDiff;
          }
        } catch (parseError) {
          logger.error('Failed to parse state data', { 
            requestId: request.request_id, 
            error: parseError 
          });
          continue;
        }
      }

      if (bestMatch) {
        matchedRequest = bestMatch.request;
        workspaceId = bestMatch.stateData.workspaceId;
        userId = bestMatch.stateData.userId;
        
        logger.info('Found matching request', {
          requestId: matchedRequest.request_id,
          timeDiffMinutes: Math.round(bestMatch.timeDiff / (60 * 1000)),
          account: installation.account?.login
        });
      }
      
      if (matchedRequest && workspaceId && userId) {
        
        // 데이터베이스에 승인 완료 상태 업데이트
        const { processGitHubInstallation } = await import("../lib/github/data-utils");
        
        try {
          await processGitHubInstallation(adminClient, String(installationId), workspaceId, {
            installation_id: installationId,
            account: installation.account,
            repository_selection: installation.repository_selection,
            permissions: installation.permissions,
            created_at: installation.created_at,
            updated_at: installation.updated_at,
            setup_action: 'approved'
          });
          
          // 요청 상태 업데이트 (account_login도 함께 저장)
          await updateInstallationRequestStatus(adminClient, {
            requestId: matchedRequest.request_id,
            status: 'approved',
            installationId
          });
          
          // account_login 정보 업데이트 (향후 매칭 정확도 향상을 위해)
          if (installation.account?.login) {
            await adminClient
              .from('github_installation_requests')
              .update({ account_login: installation.account.login })
              .eq('request_id', matchedRequest.request_id);
          }
          
          logger.info('GitHub App installation processed successfully', {
            installationId,
            workspaceId,
            userId,
            account: installation.account?.login
          });
          
        } catch (error: any) {
          logger.error('Failed to process GitHub App installation', {
            error: error.message,
            installationId,
            workspaceId
          });
        }
      } else {
        logger.warn('No matching installation request found', {
          installationId,
          account: installation.account?.login,
          pendingRequestsCount: allPendingRequests?.length || 0
        });
      }
      */
      break;

    case 'deleted':
      // 앱이 제거된 경우
      logger.info('GitHub App installation deleted', { 
        installationId,
        account: installation.account?.login 
      });
      
      // TODO: 데이터베이스에서 integration 제거
      break;

    case 'suspend':
      // 앱이 일시 중단된 경우
      logger.info('GitHub App installation suspended', { 
        installationId,
        account: installation.account?.login 
      });
      break;

    case 'unsuspend':
      // 앱 일시 중단이 해제된 경우
      logger.info('GitHub App installation unsuspended', { 
        installationId,
        account: installation.account?.login 
      });
      break;
  }

  return data({ message: 'Installation event processed' }, { status: 200 });
}

/**
 * Installation repositories 이벤트 처리 (리포지토리 추가/제거)
 */
async function handleInstallationRepositoriesEvent(payload: any) {
  const { action, installation, repositories_added, repositories_removed } = payload;
  const installationId = installation?.id;

  logger.info('Processing installation repositories event', { 
    action, 
    installationId,
    added: repositories_added?.length || 0,
    removed: repositories_removed?.length || 0
  });

  // TODO: 리포지토리 변경사항을 데이터베이스에 반영

  return data({ message: 'Installation repositories event processed' }, { status: 200 });
}

/**
 * GET 요청은 지원하지 않음
 */
export async function loader() {
  return data({ error: "Method not allowed" }, { status: 405 });
}
