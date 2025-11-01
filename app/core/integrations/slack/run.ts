import dayjs from "dayjs";
import "dotenv/config";
import pLimit from "p-limit";
import { logger } from "../../lib/logger";
import { createSlackClient } from "./client";
import { getSlackConfig } from "./config";
import { fetchChannelInfo, fetchChannelMessages, listChannels } from "./fetchers";
import type { ChannelData } from "./types";

export async function runSlackFetch(overrides?: {
  token?: string;
  days?: number;
  channels?: string;
  outDir?: string;
  skipThreadReplies?: boolean; // スレッド返信をスキップするオプション
}) {
  const cfg = getSlackConfig(process.env, overrides);
  const slack = createSlackClient(cfg.token);

  // トークン情報とスコープを確認
  /*
  try {
    const authTest = await slack.auth.test();
    logger.info('🔐 Token Info', {
      team: authTest.team,
      user: authTest.user,
      bot_id: authTest.bot_id,
      is_enterprise_install: authTest.is_enterprise_install,
    });
    
    // トークンの完全なレスポンスをログ出力（スコープ情報が含まれる可能性）
    logger.info('📋 Full auth.test response', { response: authTest });
    
    // トークン文字列の最初の部分を表示（デバッグ用）
    const tokenPrefix = cfg.token.substring(0, 20) + '...';
    logger.info('🔤 Token prefix', { prefix: tokenPrefix });
    
  } catch (error: any) {
    logger.error('Failed to verify token', { error: String(error) });
  }
  */

  const now = dayjs();
  const oldestTs = now.subtract(cfg.days, "day").unix().toString();

  const channelIds = cfg.channelIds.length
    ? cfg.channelIds
    : (await listChannels(slack)).slice(0, 3).map((c) => c.id);

  logger.info(`🔄 Starting Slack fetch for ${channelIds.length} channel(s)`, { channelIds });

  const result: Record<string, ChannelData> = {};
  const limit = pLimit(3);
  await Promise.all(
    channelIds.map((ch, index) =>
      limit(async () => {
        const startTime = Date.now();
        logger.info(`[${index + 1}/${channelIds.length}] 🚀 Starting to fetch channel: ${ch}`);
        
        // 채널 정보 가져오기
        logger.info(`[${index + 1}/${channelIds.length}] 📡 Fetching channel info...`);
        const channelInfo = await fetchChannelInfo(slack, ch);
        if (channelInfo) {
          logger.info("📢 fetch channel info", {
            "channel ID": channelInfo.id,
            "channel name": channelInfo.name,
            "description": channelInfo.purpose?.value || "none",
            "topic": channelInfo.topic?.value || "none",
            "members": channelInfo.num_members,
            "is_member": channelInfo.is_member,
          });
          
          // ボットがチャンネルに参加していない場合、ログを出力
          if (!channelInfo.is_member) {
            if (channelInfo.is_private) {
              logger.warn(`⚠️ Bot is not a member of private channel: ${channelInfo.name}. Please invite the bot manually with /invite @BotName`);
            } else {
              logger.warn(`⚠️ Bot is not a member of public channel: ${channelInfo.name}. Please invite the bot manually with /invite @BotName or add it from channel settings.`);
            }
          }
        }
        
        const key = ch + ":" + (channelInfo?.name || "");
        /*
        logger.info(`[${index + 1}/${channelIds.length}] 👥 Fetching channel members...`);
        const membersStartTime = Date.now();
        const members = await fetchChannelMembers(slack, ch);
        logger.info(`[${index + 1}/${channelIds.length}] ✅ Fetched ${members.length} members (${Date.now() - membersStartTime}ms)`);
        let emailList: string[] = [];
        members.forEach((member) => {
          emailList.push(member.profile?.email || "");
        });
        */
        logger.info(`[${index + 1}/${channelIds.length}] 💬 Fetching channel messages...`);
        const messagesStartTime = Date.now();
        const messages = await fetchChannelMessages(slack, ch, oldestTs);
        logger.info(`[${index + 1}/${channelIds.length}] ✅ Fetched ${messages.length} messages (${Date.now() - messagesStartTime}ms)`);
        
        result[key] = { messages};
        const totalTime = Date.now() - startTime;
        logger.info(`[${index + 1}/${channelIds.length}] ✨ Completed channel ${channelInfo?.name || ch} (Total: ${totalTime}ms)`);
      })
    )
  );

  logger.info(`🎉 Slack fetch completed for all ${channelIds.length} channel(s)`);
  return result;
}


