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
      
      // TODO: 데이터베이스에 승인 완료 상태 업데이트
      // 사용자에게 알림 전송 등
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
