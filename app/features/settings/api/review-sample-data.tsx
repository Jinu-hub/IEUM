/**
 * Review Sample Data API
 * 
 * レビューモード用の簡易版Slackデータ収集とAI要約API。
 * 対象チャンネルから直近{@link REVIEW_SAMPLE_DAYS}日間のメッセージを取得し、要約を生成します。
 */

import { setDefaultOpenAIKey } from "@openai/agents";
import dayjs from "dayjs";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { createSlackClient, SCOPES } from "~/core/integrations/slack/client";
import { fetchChannelInfo, fetchChannelMessages } from "~/core/integrations/slack/fetchers";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";
import { getSlackBotToken } from "~/core/lib/secrets-manager.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { generateSampleSummary } from "~/core/openai/sample-summary";
import { getIntegrationsInfo, getWorkspace } from "../db/queries";

/**
 * レビュー用サンプルデータ取得期間（日数）
 */
const REVIEW_SAMPLE_DAYS = 7;

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
 * Slack botのスコープをチェック
 * 実際にAPIを呼び出して、必要なスコープが付与されているか確認します
 */
async function checkSlackScopes(slack: ReturnType<typeof createSlackClient>): Promise<{
  authInfo: any;
  requiredScopes: string[];
  scopeTests: Record<string, { hasScope: boolean; error?: string }>;
}> {
  // auth.test()で基本情報を取得
  const authResult = await slack.auth.test();
  
  if (!authResult.ok) {
    throw new Error(`Slack auth.test failed: ${authResult.error}`);
  }

  // 要求されたスコープリスト
  const requiredScopes = SCOPES.split(',').map(s => s.trim());
  
  // 各スコープをテスト
  const scopeTests: Record<string, { hasScope: boolean; error?: string }> = {};
  
  // スコープごとに実際のAPIを呼び出してテスト
  for (const scope of requiredScopes) {
    try {
      let hasScope = false;
      let error: string | undefined;
      
      // スコープに応じて適切なAPIを呼び出す
      switch (scope) {
        case 'channels:read':
        case 'channels:history':
          try {
            const channels = await slack.conversations.list({ limit: 1 });
            hasScope = channels.ok === true;
            if (!channels.ok) error = channels.error;
          } catch (e: any) {
            error = e.message;
          }
          break;
        case 'groups:read':
        case 'groups:history':
          try {
            const groups = await slack.conversations.list({ types: 'private_channel', limit: 1 });
            hasScope = groups.ok === true;
            if (!groups.ok) error = groups.error;
          } catch (e: any) {
            error = e.message;
          }
          break;
        case 'users:read':
        case 'users:read.email':
          try {
            const users = await slack.users.list({ limit: 1 });
            hasScope = users.ok === true;
            if (!users.ok) error = users.error;
          } catch (e: any) {
            error = e.message;
          }
          break;
        case 'team:read':
          try {
            const team = await slack.team.info();
            hasScope = team.ok === true;
            if (!team.ok) error = team.error;
          } catch (e: any) {
            error = e.message;
          }
          break;
        case 'reactions:read':
          // reactions:readはメッセージ取得時に確認
          hasScope = true; // 後でメッセージ取得時に確認
          break;
        case 'channels:join':
          // channels:joinは実際にjoinを試みないと確認できない
          hasScope = true; // 後で実際のjoin時に確認
          break;
        case 'chat:write':
          // chat:writeは実際にメッセージを送信してみないと確認できない
          // より正確なテストのため、実際にchat.postMessageを呼び出してみる
          // ただし、実際にメッセージを送信してしまうのは避けるべきなので、
          // 無効なチャンネルIDを使用してエラーメッセージから判断
          try {
            // 無効なチャンネルIDでchat.postMessageを試みる
            // missing_scopeエラーが出ればスコープがない、channel_not_foundエラーならスコープがある
            const testResult = await slack.chat.postMessage({
              channel: 'C0000000000', // 無効なチャンネルID
              text: '', // 空のメッセージ
            });
            // エラーがなく、missing_scopeエラーでない場合はスコープがある
            hasScope = testResult.ok !== false || testResult.error !== 'missing_scope';
            if (!testResult.ok && testResult.error === 'missing_scope') {
              error = 'missing_scope';
              hasScope = false;
            } else if (!testResult.ok) {
              // channel_not_foundなどの他のエラーはスコープがあることを示す
              hasScope = true;
            }
          } catch (e: any) {
            // missing_scopeエラーの場合はスコープがない
            if (e.data?.error === 'missing_scope') {
              error = 'missing_scope';
              hasScope = false;
            } else {
              // その他のエラー（channel_not_foundなど）はスコープがあることを示す
              hasScope = true;
            }
          }
          break;
        default:
          hasScope = true; // 不明なスコープはtrueと仮定
      }
      
      scopeTests[scope] = { hasScope, error };
    } catch (error: any) {
      scopeTests[scope] = { hasScope: false, error: error.message };
    }
  }
  
  return {
    authInfo: {
      ok: authResult.ok,
      url: authResult.url,
      team: authResult.team,
      team_id: authResult.team_id,
      user: authResult.user,
      user_id: authResult.user_id,
      bot_id: authResult.bot_id,
    },
    requiredScopes,
    scopeTests,
  };
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
    
    // Slack botのスコープをチェック
    const scopeCheck = await checkSlackScopes(slack);
    logger.info('📋 Slack bot scope check:', {
      authInfo: scopeCheck.authInfo,
      requiredScopes: scopeCheck.requiredScopes,
      scopeTests: scopeCheck.scopeTests,
    });
    
    // スコープチェック結果をログに出力（デバッグ用）
    const missingScopes = Object.entries(scopeCheck.scopeTests)
      .filter(([_, test]) => !test.hasScope)
      .map(([scope, _]) => scope);
    
    if (missingScopes.length > 0) {
      logger.warn('⚠️ Missing Slack scopes:', { missingScopes });
    } else {
      logger.info('✅ All required Slack scopes are available');
    }
    
    // 過去7日間のメッセージを取得
    const now = dayjs();
    const oldestTs = now.subtract(REVIEW_SAMPLE_DAYS, "day").unix().toString();
    
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
        //saveContentToFile(messages, 'output-test', 'messages_', 'json');
        
        // レビュー用なので最大200件に制限
        const limitedMessages = messages.slice(0, 200);
        
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

    // chat:writeスコープがある場合、各チャンネルに通知を送信
    const hasChatWriteScope = scopeCheck.scopeTests['chat:write']?.hasScope === true;
    const notificationResults: Record<string, { success: boolean; error?: string }> = {};

    if (hasChatWriteScope) {
      logger.info('📢 Sending notifications to channels...');
      
      for (const [channelId, result] of Object.entries(channelResults)) {
        try {
          const channelName = result.channelName;
          const messageCount = result.messageCount;
          
          // Key Pointsセクションを抽出
          const keyPointsMatch = summary.match(/💡\s*\*\*Key Points\*\*\s*\n([\s\S]*?)(?=\n\n|$)/i);
          let keyPoints = '';
          let summaryWithoutKeyPoints = summary;
          if (keyPointsMatch && keyPointsMatch[1]) {
            keyPoints = keyPointsMatch[1].trim();
            // Key Pointsセクションをsummaryから除外
            summaryWithoutKeyPoints = summary.replace(/💡\s*\*\*Key Points\*\*\s*\n[\s\S]*?(?=\n\n|$)/i, '').trim();
          }
          
          // トピック数をカウント（- で始まる行を数える、Key Pointsセクションは除外）
          const topicCount = (summaryWithoutKeyPoints.match(/^[-•]\s/gm) || []).length;
          
          // Key PointsをSlack用にフォーマット
          // 長いテキストの場合は適切に短縮し、改行を処理
          let formattedKeyPoints = '';
          if (keyPoints) {
            // 最大500文字まで（Slackのメッセージ制限を考慮）
            const maxKeyPointsLength = 500;
            let processedKeyPoints = keyPoints;
            if (processedKeyPoints.length > maxKeyPointsLength) {
              processedKeyPoints = processedKeyPoints.substring(0, maxKeyPointsLength) + '...';
            }
            // 改行を保持し、Markdown形式で見やすく
            // 複数行の場合は各行を適切にフォーマット
            formattedKeyPoints = processedKeyPoints
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .map(line => {
                // 既にリスト形式の場合はそのまま、そうでない場合は適切にフォーマット
                if (line.startsWith('-') || line.startsWith('•')) {
                  return line;
                }
                return `• ${line}`;
              })
              .join('\n');
          }
          
          // 通知メッセージを作成（英語）
          let notificationMessage = `✅ *Review sample data processing completed*\n\n` +
            `📊 *Statistics:*\n` +
            `• Channels processed: ${stats.channelCount}\n` +
            `• Total messages: ${stats.totalMessages}\n` +
            `• This channel: ${messageCount} messages processed\n` +
            `• Topics identified: ${topicCount}`;
          
          // Key Pointsがある場合は追加
          if (formattedKeyPoints) {
            notificationMessage += `\n\n💡 *Key Points:*\n${formattedKeyPoints}`;
          }
          
          notificationMessage += `\n\n🔗 *Full details are available in the NexLetter dashboard.*`;

          const postResult = await slack.chat.postMessage({
            channel: channelId,
            text: notificationMessage,
            unfurl_links: false,
            unfurl_media: false,
          });

          if (postResult.ok) {
            notificationResults[channelId] = { success: true };
            logger.info(`✅ Notification sent to #${channelName} (${channelId})`);
          } else {
            notificationResults[channelId] = { 
              success: false, 
              error: postResult.error || 'Unknown error' 
            };
            logger.warn(`⚠️ Failed to send notification to #${channelName}: ${postResult.error}`);
          }
        } catch (error: any) {
          notificationResults[channelId] = { 
            success: false, 
            error: error.message || String(error) 
          };
          logger.error(`❌ Error sending notification to channel ${channelId}`, { 
            error: error.message 
          });
        }
      }
    } else {
      logger.warn('⚠️ chat:write scope is not available. Skipping channel notifications.');
    }

    // スコープチェック結果をまとめる
    const scopeSummary = {
      requiredScopes: scopeCheck.requiredScopes,
      availableScopes: Object.entries(scopeCheck.scopeTests)
        .filter(([_, test]) => test.hasScope)
        .map(([scope, _]) => scope),
      missingScopes: Object.entries(scopeCheck.scopeTests)
        .filter(([_, test]) => !test.hasScope)
        .map(([scope, test]) => ({ scope, error: test.error })),
      allScopesAvailable: Object.values(scopeCheck.scopeTests).every(test => test.hasScope),
    };

    return data({ 
      status: 'success', 
      data: {
        summary,
        stats,
        notifications: {
          sent: hasChatWriteScope,
          results: notificationResults,
        },
        slackScopes: {
          authInfo: scopeCheck.authInfo,
          scopeSummary,
          detailedTests: scopeCheck.scopeTests,
        }
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
