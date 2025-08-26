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

/**
 * Slack 통합 설정 스키마
 */
const slackIntegrationSchema = z.object({
  action: z.enum(['connect', 'disconnect', 'check']),
  token: z.string().optional(),
  channels: z.string().optional(), // comma-separated channel IDs
});

/**
 * Slack 연결 상태 확인
 */
async function checkSlackConnection(token?: string): Promise<{
  connected: boolean;
  team?: any;
  bot?: any;
  channels?: any[];
  error?: string;
}> {
  try {
    if (!token) {
      // 환경변수에서 토큰 확인
      token = process.env.SLACK_BOT_TOKEN;
    }
    
    if (!token) {
      return { connected: false, error: "No Slack bot token found" };
    }

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
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    // Slack 연결 상태 확인
    const connectionStatus = await checkSlackConnection();
    
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
export async function action({ request }: ActionFunctionArgs) {
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

    const { action: actionType, token, channels } = validationResult.data;

    switch (actionType) {
      case 'check': {
        const connectionStatus = await checkSlackConnection(token);
        return data({
          status: 'success',
          data: connectionStatus
        });
      }

      case 'connect': {
        if (!token) {
          return data({ 
            status: 'error', 
            error: 'Slack bot token is required for connection' 
          }, { status: 400 });
        }

        // 토큰으로 연결 테스트
        const connectionStatus = await checkSlackConnection(token);
        
        if (!connectionStatus.connected) {
          return data({
            status: 'error',
            error: connectionStatus.error || 'Failed to connect to Slack'
          }, { status: 400 });
        }

        // 설정 저장
        await saveSlackSettings(user.id, { token, channels });
        
        return data({
          status: 'success',
          message: 'Slack integration connected successfully',
          data: connectionStatus
        });
      }

      case 'disconnect': {
        // 설정 삭제
        await removeSlackSettings(user.id);
        
        return data({
          status: 'success',
          message: 'Slack integration disconnected successfully'
        });
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
