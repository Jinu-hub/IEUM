/**
 * Slack Integration API Endpoint
 *
 * Slack 통합 설정을 관리하는 API 엔드포인트입니다.
 * 연결 상태 확인, 연결 설정, 연결 해제 기능을 제공합니다.
 */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";
import { updateCredentialRef } from "../db/mutations";
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

/**
 * Slack 연결 상태 확인
 */
export async function checkSlackConnection(token: string): Promise<{
  connected: boolean;
  team?: any;
  bot?: any;
  channels?: any[];
  error?: string;
}> {
  try {
    // 서버 사이드에서만 동적 import
    const { createSlackClient } = await import("~/core/integrations/slack/client");
    const { listChannels } = await import("~/core/integrations/slack/fetchers");

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
 * Loader: 현재 Slack 연결 상태 반환
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    const credentialRef = params.credentialRef || undefined;
    if (!credentialRef) {
      return data({ 
        status: 'error', 
        error: 'No Slack credentialRef found' 
      }, { status: 400 });
    }

    // Slack 토큰 조회
    const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
    const token = await getSlackBotToken(credentialRef);
    if (!token) {
      console.log('No Slack bot token found');
      return { 
        connected: false, 
        error: 'No Slack bot token found'
      };
    }
    // Slack 연결 상태 확인
    const connectionStatus = await checkSlackConnection(token);

    if (!connectionStatus.connected) {
      return data({ 
        status: 'error', 
        error: 'Failed to check Slack connection' 
      }, { status: 500 });
    }

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

    if (actionType !== "connect" 
      && (!credentialRef || credentialRef === 'new')) {
      return data({ 
        status: 'error', 
        error: 'No Slack credentialRef Setted' 
      }, { status: 400 });
    }

    switch (actionType) {
      case 'check': {
        // Slack 토큰 조회
        const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
        const token = await getSlackBotToken(credentialRef);
        if (!token) {
          console.log('No Slack bot token found');
          return { 
            connected: false, 
            error: 'No Slack bot token found'
          };
        }
        const connectionStatus = await checkSlackConnection(token);
        if (!connectionStatus.connected) {
          return data({ status: 'error',  error: 'Failed to check Slack connection' }, { status: 500 });
        }
        return data({status: 'success', data: connectionStatus });
      }

      case 'connect': {
        try {
          const { SLACK_CLIENT_ID, SLACK_REDIRECT_URI, SCOPES, USER_SCOPES } = await import("~/core/integrations/slack/client");
          
          if (!SLACK_CLIENT_ID || !SLACK_REDIRECT_URI) {
            logger.error('Missing Slack OAuth credentials');
            return data({
              status: 'error',
              error: 'Slack OAuth credentials not configured'
            }, { status: 500 });
          }

          // Slack OAuth URL 생성
          const state = Buffer.from(JSON.stringify({ 
            workspaceId, 
            userId: user.id,
            timestamp: Date.now()
          })).toString('base64');

          const oauthUrl = `https://slack.com/oauth/v2/authorize?` + new URLSearchParams({
            client_id: SLACK_CLIENT_ID,
            scope: SCOPES,
            redirect_uri: SLACK_REDIRECT_URI,
            state: state,
            user_scope: USER_SCOPES, // 인증 후 연결 화면 복귀용 (identity.basic)
          }).toString();

          logger.info('Redirecting to Slack OAuth', {
            workspaceId,
            userId: user.id,
            oauthUrl: oauthUrl.substring(0, 100) + '...' // 로그에는 URL 일부만
          });

          return data({
            status: 'redirect',
            redirectUrl: oauthUrl,
            message: 'Redirecting to Slack OAuth'
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

          if (existingIntegration) {
            // credential_ref를 빈 문자열로 업데이트
            try {
            await updateCredentialRef(client, { workspaceId, type: 'slack', credential_ref: '' });
            } catch (error) {
              logger.error('Failed to delete integration record', { error });
              return data({
                status: 'error',
                error: 'Failed to disconnect integration'
              }, { status: 500 });
            }
          }

          // Secret 삭제 (integration이 있는 경우) :
          if (existingIntegration?.credential_ref) {
            const { deleteIntegrationSecret } = await import("./common");
            const credentialRef = existingIntegration.credential_ref;
            await deleteIntegrationSecret({ credentialRef: credentialRef });
            await deleteIntegrationSecret({ credentialRef: existingIntegration.integration_id });
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
