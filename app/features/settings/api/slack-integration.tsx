/**
 * Slack Integration API Endpoint
 *
 * Slack 통합 설정을 관리하는 API 엔드포인트입니다.
 * 연결 상태 확인, 연결 설정, 연결 해제 기능을 제공합니다.
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { createSlackClient } from "~/core/integrations/slack/client";
import { listChannels } from "~/core/integrations/slack/fetchers";
import { logger } from "~/core/lib/logger";
import { createIntegration, deleteIntegration } from "../db/mutations";
import { getIntegrations } from "../db/queries";

/**
 * Slack 통합 설정 스키마
 */
const slackIntegrationSchema = z.object({
  workspaceId: z.string(),
  actionType: z.enum(['connect', 'disconnect', 'check']),
  credentialRef: z.string().optional(),
  //config_json: z.any().optional(), // comma-separated channel IDs
});

type SlackIntegrationRequest = z.infer<typeof slackIntegrationSchema>;

/**
 * Slack 연결 상태 확인
 */
async function checkSlackConnection(token: string): Promise<{
  connected: boolean;
  team?: any;
  bot?: any;
  channels?: any[];
  error?: string;
}> {
  try {

    const slack = createSlackClient(token);
    
    // Slack API로 인증 확인
    const authResult = await slack.auth.test();
    
    if (!authResult.ok) {
      return { 
        connected: false, 
        error: authResult.error || 'Failed to authenticate with Slack' 
      };
    }
    
    // 채널 목록 가져오기 (Bot이 초대된 채널만 포함)
    const channels = await listChannels(slack);
    
    // 봇 사용자 정보 가져오기
    let botUserInfo = null;
    if (authResult.user_id) {
      try {
        const userInfo = await slack.users.info({ user: authResult.user_id });
        if (userInfo.ok && userInfo.user) {
          botUserInfo = {
            name: (userInfo.user as any).name,
            real_name: (userInfo.user as any).real_name,
            display_name: (userInfo.user as any).display_name,
            profile: {
              display_name: (userInfo.user as any).profile?.display_name,
              real_name: (userInfo.user as any).profile?.real_name,
              image_72: (userInfo.user as any).profile?.image_72,
            }
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch bot user info', { error: String(error) });
      }
    }
    
    // 채널 목록을 그대로 사용
    const allChannels = [...channels];
    
    return {
      connected: true,
      team: {
        id: authResult.team_id,
        name: authResult.team,
        url: authResult.url,
      },
      bot: {
        id: authResult.bot_id,
        user_id: authResult.user_id,
        user_info: botUserInfo,
      },
      channels: allChannels.map(ch => ({
        id: ch.id,
        name: ch.name,
        is_private: ch.is_private,
        is_member: ch.is_member,
      })),
    };
  } catch (error: any) {
    logger.error('Slack connection check failed', { error: error.message });
    return { 
      connected: false, 
      error: error.message || 'Failed to connect to Slack' 
    };
  }
}

/**
 * Slack 설정 저장 (환경변수나 데이터베이스에)
 * 실제 구현에서는 사용자별 설정을 데이터베이스에 저장해야 합니다.
 */
async function saveSlackSettings(userId: string, settings: {
  token?: string;
  channels?: string;
}) {
  // TODO: 실제 구현에서는 사용자별 Slack 설정을 데이터베이스에 저장
  // 현재는 시뮬레이션만 수행
  logger.info('Saving Slack settings', { userId, hasToken: !!settings.token });
  return true;
}

/**
 * Slack 설정 삭제
 */
async function removeSlackSettings(userId: string) {
  // TODO: 실제 구현에서는 사용자별 Slack 설정을 데이터베이스에서 삭제
  logger.info('Removing Slack settings', { userId });
  return true;
}

/**
 * Loader: 현재 Slack 연결 상태 반환
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    // credentialRef가 있으면 Secrets Manager에서 토큰 조회
    const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
    const token = await getSlackBotToken(params.credentialRef) || undefined;
    if (!token) {
      return data({ 
        status: 'error', 
        error: 'No Slack bot token found' 
      }, { status: 400 });
    }

    // Slack 연결 상태 확인
    const connectionStatus = await checkSlackConnection(token);
    
    return data({
      status: 'success',
      data: {
        connected: connectionStatus.connected,
        team: connectionStatus.team,
        bot: connectionStatus.bot,
        channels: connectionStatus.channels,
        error: connectionStatus.error,
      }
    });
  } catch (error: any) {
    logger.error('Slack integration loader error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Action: Slack 통합 설정 관리
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
    
    const validationResult = slackIntegrationSchema.safeParse(rawData);
    if (!validationResult.success) {
      return data({ 
        status: 'error', 
        error: 'Invalid request data',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { workspaceId, actionType } = validationResult.data;
    // FormData에서 credentialRef 우선, URL 파라미터는 fallback
    const credentialRef = (rawData as any).credentialRef || params.credentialRef;

    // 첫 연결 시에는 credentialRef가 없을 수 있음 (OAuth 준비) TODO:
    /*
    if (actionType === 'connect' && (!credentialRef || credentialRef === 'new')) {
      console.log('First time connection - OAuth flow will be implemented');
      
      // TODO: OAuth 2.0 구현 시 여기서 Slack OAuth 리디렉션 처리
      return data({
        status: 'success',
        message: 'OAuth integration will be implemented soon',
        data: {
          connected: false,
          oauth_required: true,
          oauth_url: 'https://slack.com/oauth/v2/authorize'
        }
      });
    }
    */

    const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
    const token = await getSlackBotToken(credentialRef as string) || undefined;
    //const token = process.env.SLACK_BOT_TOKEN || undefined;
    console.log('token', token);
    if (!token) {
      console.log('No Slack bot token found');
      return data({ 
        status: 'error', 
        error: 'No Slack bot token found' 
      }, { status: 400 });
    }

    switch (actionType) {
      case 'check': {
        const connectionStatus = await checkSlackConnection(token);
        return data({
          status: 'success',
          data: connectionStatus
        });
      }

      case 'connect': {
        // credentialRef로 연결 테스트
        const connectionStatus = await checkSlackConnection(token);
        
        if (!connectionStatus.connected) {
          return data({
            status: 'error',
            error: connectionStatus.error || 'Failed to connect to Slack'
          }, { status: 400 });
        }

        try {
          // 기존 integration 조회 및 Secret 정리
          let existingCredentialRef = null;
          if (credentialRef && credentialRef !== 'new') {
            try {
              const integrations = await getIntegrations(client, { workspaceId, type: 'slack' });
              existingCredentialRef = integrations?.credential_ref;
            } catch (error) {
              logger.warn('Failed to fetch existing integration for cleanup', { 
                workspaceId, 
                error: String(error) 
              });
            }
          }

          // 새로운 credentialRef 생성
          const { generateCredentialRef } = await import("~/core/lib/secrets-manager.server");
          const credentialRef_new = generateCredentialRef('slack', user.id.substring(0, 8));
          
          // Secrets Manager에 토큰 저장 TODO:
          /*
          const storeResult = await secretsManager.storeSecret(credentialRef_new, token, {
            name: `Slack Bot Token - ${connectionStatus.team?.name || 'Unknown'}`,
            description: `Slack integration token for workspace ${workspaceId}`,
            type: 'slack_bot_token'
          });
          
          if (!storeResult.success) {
            return data({
              status: 'error',
              error: `Failed to store Slack token: ${storeResult.error}`
            }, { status: 500 });
          }
          */

          // Integration 레코드를 데이터베이스에 저장
          try {
            const integrationData = await createIntegration(client, {
              workspaceId: workspaceId,
              type: 'slack',
              name: `Slack - ${connectionStatus.team?.name || 'Unknown'}`,
              credential_ref: credentialRef_new,
              config_json: {
                channels: connectionStatus.channels ? connectionStatus.channels.map((c: any) => c.id).join(',') : '',
                team: connectionStatus.team,
                bot: connectionStatus.bot,
                connected_at: new Date().toISOString()
              }
            });
            logger.info('Integration record saved successfully', { integrationId: (integrationData as any).integration_id });
          } catch (error) {
            logger.error('Failed to save integration record', { error });
            // Secret 저장은 성공했으므로 롤백 TODO:
            //await deleteIntegrationSecret({ credentialRef: credentialRef_new });
            return data({
              status: 'error',
              error: 'Failed to save integration settings'
            }, { status: 500 });
          }

          // 기존 Secret 삭제 (보안상 중요) TODO:
          if (existingCredentialRef) {
            //await deleteIntegrationSecret({ credentialRef: existingCredentialRef });
          }

          logger.info('Slack integration connected successfully', { 
            userId: user.id, 
            credentialRef_new,
            teamName: connectionStatus.team?.name 
          });

          return data({
            status: 'success',
            message: 'Slack integration connected successfully',
            data: {
              ...connectionStatus,
              credentialRef_new,
            }
          });
        } catch (error) {
          logger.error('Failed to connect Slack integration', { error });
          return data({
            status: 'error',
            error: 'Failed to connect Slack integration'
          }, { status: 500 });
        }
      }

      case 'disconnect': {
        try {
          // 기존 integration 정보 조회
          let existingIntegration = null;
          try {
            const integrations = await getIntegrations(client, { workspaceId, type: 'slack' });
            existingIntegration = integrations;
          } catch (error) {
            logger.warn('Failed to fetch existing integration', { 
              workspaceId, 
              type: 'slack', 
              error: String(error) 
            });
            // 조회 실패해도 계속 진행 (새로운 integration 생성)
          }

          // Secret 삭제 (integration이 있는 경우) TODO:
          if (existingIntegration?.credential_ref) {
            //await deleteIntegrationSecret({ credentialRef: existingIntegration.credential_ref });
          }

          // Integration 레코드 삭제
          const dbError = await deleteIntegration(client, { workspaceId, type: 'slack' });
          if (dbError) {
            logger.error('Failed to delete integration record', { error: dbError });
            return data({
              status: 'error',
              error: 'Failed to disconnect integration'
            }, { status: 500 });
          }

          logger.info('Slack integration disconnected successfully', { workspaceId });
          
          return data({
            status: 'success',
            message: 'Slack integration disconnected successfully'
          });
        } catch (error) {
          logger.error('Failed to disconnect Slack integration', { error });
          return data({
            status: 'error',
            error: 'Failed to disconnect Slack integration'
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
    logger.error('Slack integration action error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}
