/**
 * Review Sample Data API
 * 
 * レビューモード用の簡易版Slackデータ収集とAI要約API。
 * 対象チャンネルから直近7日間のメッセージを取得し、要約を生成します。
 */

import { setDefaultOpenAIKey } from "@openai/agents";
import dayjs from "dayjs";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { createSlackClient } from "~/core/integrations/slack/client";
import { fetchChannelInfo, fetchChannelMessages } from "~/core/integrations/slack/fetchers";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";
import { getSlackBotToken } from "~/core/lib/secrets-manager.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { generateSampleSummary } from "~/core/openai/sample-summary";
import { getIntegrationsInfo, getWorkspace } from "../db/queries";

/**
 * OpenAI APIキーを初期化
 */
let isOpenAIInitialized = false;
function initializeOpenAI() {
  if (!isOpenAIInitialized) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    setDefaultOpenAIKey(apiKey);
    isOpenAIInitialized = true;
    logger.info('✅ OpenAI API key initialized for review sample');
  }
}

/**
 * Action: レビューモード用サンプルデータ収集
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.info('🚀 Review sample data API called');

  if (request.method !== "POST") {
    return data({ 
      status: 'error', 
      error: 'Only POST requests are allowed' 
    }, { status: 405 });
  }

  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, channelIds } = body;

    if (!workspaceId || !channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return data({ 
        status: 'error', 
        error: 'workspaceId and channelIds are required' 
      }, { status: 400 });
    }

    // ワークスペース検証
    const workspaceData = await getWorkspace(client, { userId: user.id });
    if (!workspaceData.some(w => w.workspace_id === workspaceId)) {
      return data({ status: 'error', error: 'Invalid workspace' }, { status: 403 });
    }

    // Slack integration 情報を取得
    const integrationsInfo = await getIntegrationsInfo(client, { workspaceId });
    const slackIntegration = integrationsInfo.find((i: any) => i.type === 'slack');
    const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
    //const sources = await getTargetSources(client, { workspaceId, targetId: 'review-sample' });
    //const slackChannels = slackData?.channels || [];

    if (!slackIntegration || slackIntegration.connection_status !== 'connected') {
      return data({ 
        status: 'error', 
        error: 'Slack is not connected' 
      }, { status: 400 });
    }

    const credentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;

    const slackToken = await getSlackBotToken(credentialRef as string);
    
    if (!slackToken) {
      return data({ 
        status: 'error', 
        error: 'Failed to get Slack token' 
      }, { status: 500 });
    }

    // Slack クライアントを作成
    const slack = createSlackClient(slackToken);
    
    // 過去7日間のメッセージを取得
    const now = dayjs();
    const oldestTs = now.subtract(100, "day").unix().toString();
    
    const channelResults: Record<string, { 
      channelName: string;
      messages: FetchedMessage[];
      messageCount: number;
    }> = {};
    
    // 各チャンネルからメッセージを取得（最大3チャンネル、レビュー用なので軽量化）
    const targetChannels = channelIds.slice(0, 3);
    
    for (const channelId of targetChannels) {
      try {
        const channelInfo = await fetchChannelInfo(slack, channelId);
        
        if (!channelInfo?.is_member) {
          logger.warn(`Bot is not a member of channel ${channelId}`);
          continue;
        }
        
        const messages = await fetchChannelMessages(slack, channelId, oldestTs);
        
        // レビュー用なので最大50件に制限
        const limitedMessages = messages.slice(0, 50);
        
        channelResults[channelId] = {
          channelName: channelInfo?.name || channelId,
          messages: limitedMessages,
          messageCount: messages.length
        };
        
        logger.info(`Fetched ${limitedMessages.length} messages from #${channelInfo?.name}`);
      } catch (error: any) {
        logger.error(`Failed to fetch channel ${channelId}`, { error: error.message });
      }
    }

    if (Object.keys(channelResults).length === 0) {
      return data({ 
        status: 'error', 
        error: 'No messages could be fetched. Please make sure the bot has joined the channels.' 
      }, { status: 400 });
    }

    // OpenAI で要約を生成
    initializeOpenAI();
    
    const slackResult: Record<string, FetchedMessage[]> = {};
    Object.entries(channelResults).forEach(([channelId, result]) => {
      slackResult[`${channelId}:${result.channelName}`] = result.messages;
    });
    
    const summary = await generateSampleSummary(slackResult);
    
    const stats = {
      channelCount: Object.keys(channelResults).length,
      totalMessages: Object.values(channelResults).reduce((acc, r) => acc + r.messageCount, 0),
      channels: Object.values(channelResults).map(r => ({
        name: r.channelName,
        messageCount: r.messageCount
      }))
    };

    logger.info('✅ Review sample data generated successfully', stats);

    return data({ 
      status: 'success', 
      data: {
        summary,
        stats
      }
    });

  } catch (error: any) {
    logger.error('Review sample data error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

