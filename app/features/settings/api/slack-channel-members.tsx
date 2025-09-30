/**
 * Slack Channel Membership API Endpoint
 *
 * Slack 채널 멤버십 관리를 위한 API 엔드포인트입니다.
 * 봇이 채널에 참여하거나 나가는 기능을 제공합니다.
 */

import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { updateSlackChannelMembership } from "~/features/settings/db/mutations";

/**
 * 채널 멤버십 관리 스키마
 */
const channelMembershipSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  action: z.enum(['join', 'leave'], {
    errorMap: () => ({ message: "Action must be 'join' or 'leave'" })
  }),
  credentialRef: z.string().min(1, "Credential reference is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  integrationId: z.string().min(1, "Integration ID is required"),
});

/**
 * Action: 채널 멤버십 관리
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ error: "Unauthorized" }, { status: 401 });
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return data({ 
        status: 'error', 
        error: 'Method not allowed' 
      }, { status: 405 });
    }

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData);
    
    const validationResult = channelMembershipSchema.safeParse(rawData);
    if (!validationResult.success) {
      return data({ 
        status: 'error', 
        error: 'Invalid request data',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { channelId, action: membershipAction, credentialRef, workspaceId, integrationId } = validationResult.data;
    
    // Slack Bot Token 조회
    const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
    const botToken = await getSlackBotToken(credentialRef);
    
    if (!botToken) {
      logger.error('Slack bot token not found', { credentialRef });
      return data({ 
        status: 'error', 
        error: 'Slack bot token not found' 
      }, { status: 404 });
    }

    // Slack 클라이언트 생성
    const { createSlackClient } = await import("~/core/integrations/slack/client");
    const slack = createSlackClient(botToken);

    try {
      let result;
      
      if (membershipAction === 'join') {
        logger.info('Attempting to join channel', { channelId, credentialRef });
        result = await slack.conversations.join({ channel: channelId });
        
        if (!result.ok) {
          throw new Error(result.error || 'Failed to join channel');
        }
        
        logger.info('Successfully joined channel', { channelId, credentialRef });
        
      } else if (membershipAction === 'leave') {
        logger.info('Attempting to leave channel', { channelId, credentialRef });
        result = await slack.conversations.leave({ channel: channelId });
        
        if (!result.ok) {
          throw new Error(result.error || 'Failed to leave channel');
        }
        
        logger.info('Successfully left channel', { channelId, credentialRef });
      }
      
      // resource_cache_json 업데이트
      const updateResult = await updateSlackChannelMembership(adminClient, {
        workspaceId,
        integrationId,
        channelId,
        isMember: membershipAction === 'join'
      });
      
      if (updateResult.success) {
        logger.info('Successfully updated resource cache', { 
          workspaceId, 
          integrationId, 
          channelId, 
          membershipAction 
        });
      } else {
        logger.error('Failed to update resource cache', { 
          error: updateResult.error, 
          workspaceId, 
          integrationId, 
          channelId 
        });
      }
      
      return data({ 
        status: 'success', 
        action: membershipAction,
        channelId,
        message: `Successfully ${membershipAction === 'join' ? 'joined' : 'left'} channel`
      });
      
    } catch (slackError: any) {
      logger.error('Slack API error', { 
        error: slackError.message,
        code: slackError.data?.error,
        channelId,
        action: membershipAction,
        credentialRef 
      });
      
      // Slack 에러 코드별 사용자 친화적 메시지
      let errorMessage = slackError.message;
      const errorCode = slackError.data?.error;
      
      switch (errorCode) {
        case 'channel_not_found':
          errorMessage = 'Channel not found or has been deleted';
          break;
        case 'not_in_channel':
          errorMessage = membershipAction === 'leave' 
            ? 'Bot is not a member of this channel' 
            : 'Cannot join this channel';
          break;
        case 'already_in_channel':
          errorMessage = 'Bot is already a member of this channel';
          break;
        case 'restricted_action':
          errorMessage = 'Not authorized to perform this action on this channel';
          break;
        case 'missing_scope':
          errorMessage = membershipAction === 'leave' 
            ? 'Bot does not have permission to leave channels. Please reconnect with updated permissions.' 
            : 'Bot does not have permission to join this channel';
          break;
        case 'user_is_bot':
          errorMessage = 'Bot users have limited channel access';
          break;
        case 'invalid_auth':
          errorMessage = 'Invalid Slack authentication';
          break;
        default:
          errorMessage = `Failed to ${membershipAction} channel: ${errorMessage}`;
      }
      
      return data({ 
        status: 'error', 
        error: errorMessage,
        code: errorCode,
        channelId,
        action: membershipAction
      }, { status: 400 });
    }
    
  } catch (error: any) {
    logger.error('Channel membership action error', { 
      error: error.message,
      stack: error.stack 
    });
    
    return data({ 
      status: 'error', 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
