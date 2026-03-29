import type { WebClient } from "@slack/web-api";
import pLimit from "p-limit";
import { logger } from "~/core/lib/logger";
import type { FetchedMessage, UserInfo } from "./types";

const userCache = new Map<string, UserInfo>();
const pendingUser = new Map<string, Promise<UserInfo | null>>();

// ============================================
// Slack API フェッチ設定
// ここで一括管理して、レート制限を考慮した調整が可能
// ============================================
const SLACK_FETCH_CONFIG = {
  // 테스트 : 5 -> 7
  // 同時実行数設定
  concurrency: {
    user: 5,        // ユーザー情報取得の同時実行数
    message: 5,     // メッセージ処理の同時実行数
    reply: 5,       // スレッド返信処理の同時実行数
  },
  // 테스트 : 350 -> 280
  // ページネーション待機時間（ミリ秒）
  paginationDelay: 350,  // ページネーション間の待機時間
} as const;

// 設定値を使用してpLimitを作成
const userLimit = pLimit(SLACK_FETCH_CONFIG.concurrency.user);
const messageLimit = pLimit(SLACK_FETCH_CONFIG.concurrency.message);
const replyLimit = pLimit(SLACK_FETCH_CONFIG.concurrency.reply);

/** conversations.history / replies 의 봇·앱 표시명 → ingest의 author */
function slackMessageAuthor(m: { username?: string; bot_profile?: { name?: string } }): string | undefined {
  if (typeof m.username === "string" && m.username.trim()) return m.username.trim();
  const bn = m.bot_profile?.name;
  if (typeof bn === "string" && bn.trim()) return bn.trim();
  return undefined;
}

export async function fetchUserInfo(slack: WebClient, userId: string): Promise<UserInfo | null> {
  if (userCache.has(userId)) return userCache.get(userId)!;
  if (pendingUser.has(userId)) return pendingUser.get(userId)!;

  const p = userLimit(async () => {
    try {
      const res = await slack.users.info({ user: userId });
      if (res.user) {
        const userInfo: UserInfo = {
          id: userId,
          name: (res.user as any).name,
          real_name: (res.user as any).real_name,
          display_name: (res.user as any).display_name,
          profile: {
            display_name: (res.user as any).profile?.display_name,
            real_name: (res.user as any).profile?.real_name,
            email: (res.user as any).profile?.email,
            image_72: (res.user as any).profile?.image_72,
          },
        };
        userCache.set(userId, userInfo);
        return userInfo;
      }
    } catch (error) {
      logger.warn(`Failed to fetch user info for ${userId}`, { error: String(error) });
    } finally {
      pendingUser.delete(userId);
    }
    return null;
  });

  pendingUser.set(userId, p);
  return p;
}

export async function fetchChannelInfo(slack: WebClient, channelId: string): Promise<any | null> {
  try {
    const res = await slack.conversations.info({
      channel: channelId,
      include_num_members: true,
    });
    return res.channel;
  } catch (error: any) {
    logger.error('Error fetching channel info', { channelId, error: error.message });
    return null;
  }
}

export async function listChannels(slack: WebClient): Promise<{ id: string; name: string; is_private: boolean; is_member: boolean }[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  
  try {
    // 1. 기본 conversations.list (Bot이 멤버인 채널들)
    do {
      const res = await slack.conversations.list({
        types: "public_channel,private_channel",
        limit: 200,
        cursor,
        exclude_archived: true,
      });

      // 봇이 멤버인 채널
      /*
      const accessibleChannels = (res.channels || []).filter((c: any) => 
        c.is_member
      );
      */
      out.push(...(res.channels || []));
      cursor = res.response_metadata?.next_cursor || undefined;
    } while (cursor);

    const mappedChannels = out.map((c) => {
      //console.log('Channel:', c.name, 'is_private:', c.is_private);
      return { 
        id: c.id!, 
        name: c.name,
        is_private: c.is_private || false,
        is_member: c.is_member || false
      };
    });
    
    return mappedChannels;
    
  } catch (error: any) {
    logger.error('Error in listChannels', { error: error.message });
    return [];
  }
}

export async function fetchPermalink(slack: WebClient, channel: string, ts: string) {
  const res = await slack.chat.getPermalink({ channel, message_ts: ts });
  return res.permalink;
}

export async function fetchReplies(
  slack: WebClient,
  channel: string,
  thread_ts: string,
  oldest: string
): Promise<FetchedMessage[]> {
  const replies: FetchedMessage[] = [];
  let cursor: string | undefined;
  do {
    const res = await slack.conversations.replies({
      channel,
      ts: thread_ts,
      oldest,
      limit: 200,
      cursor,
      include_all_metadata: true as any,
    });
    const batch = await Promise.all(
      (res.messages ?? []).map((m: any) =>
        replyLimit(async () => {
          const userId = m.user;
          const userInfo = userId ? await fetchUserInfo(slack, userId) : null;
          const built: FetchedMessage = {
            ts: m.ts!,
            author: slackMessageAuthor(m),
            user: userId,
            userInfo: userInfo || undefined,
            text: m.text,
            reactions: (m.reactions as any)?.map((r: any) => ({ name: r.name, count: r.count, users: r.users })),
            files: (m.files as any)?.map((f: any) => ({ name: f.name, url: f.url_private })),
          };
          return built;
        })
      )
    );
      replies.push(...batch);
      cursor = (res.response_metadata?.next_cursor as string) || undefined;
      if (cursor) await new Promise((r) => setTimeout(r, SLACK_FETCH_CONFIG.paginationDelay));
  } while (cursor);
  return replies;
}

export interface FetchChannelMessagesOptions {
  /**
   * スレッドの返信を取得するかどうか
   * @default true
   */
  includeThread?: boolean;
  /**
   * パーマリンクを取得するかどうか
   * @default true
   */
  includePermalink?: boolean;
}

export async function fetchChannelMessages(
  slack: WebClient,
  channel: string,
  oldestTs: string,
  options: FetchChannelMessagesOptions = {}
): Promise<FetchedMessage[]> {
  const { includeThread = true, includePermalink = true } = options;
  const collected: FetchedMessage[] = [];
  let cursor: string | undefined;
  do {
    try {
      const res = await slack.conversations.history({
        channel,
        oldest: oldestTs,
        limit: 200,
        cursor,
        include_all_metadata: true as any,
      });
      const batch = await Promise.all(
        (res.messages ?? []).map((m: any) =>
          messageLimit(async () => {
            const userId = m.user;
            const userInfo = userId ? await fetchUserInfo(slack, userId) : null;
            const base: FetchedMessage = {
              ts: m.ts!,
              author: slackMessageAuthor(m),
              user: userId,
              userInfo: userInfo || undefined,
              text: m.text,
              reactions: (m.reactions as any)?.map((r: any) => ({ name: r.name, count: r.count, users: r.users })),
              files: (m.files as any)?.map((f: any) => ({ name: f.name, url: f.url_private })),
              // スレッドメタ情報（conversations.historyから取得可能、追加のAPI呼び出し不要）
              thread_ts: m.thread_ts as string | undefined,
              reply_count: m.reply_count as number | undefined,
              latest_reply: m.latest_reply as string | undefined,
            };
            
            // スレッドの返信を取得（オプション）
            if (includeThread) {
              const thread_ts = m.thread_ts as string | undefined;
              if (thread_ts) {
                base.thread = { replies: await fetchReplies(slack, channel, thread_ts, oldestTs) };
              }
            }
            
            // パーマリンクを取得（オプション）
            if (includePermalink) {
              base.permalink = await fetchPermalink(slack, channel, m.ts!);
            }
            
            return base;
          })
        )
      );
      collected.push(...batch);
      cursor = res.response_metadata?.next_cursor || undefined;
      if (cursor) await new Promise((r) => setTimeout(r, SLACK_FETCH_CONFIG.paginationDelay));
    } catch (e: any) {
      if (e.data?.error === "ratelimited") {
        const retry = Number(e.data?.headers?.["retry-after"] || 3) * 1000;
        logger.warn("slack ratelimited", { retryMs: retry });
        await new Promise((r) => setTimeout(r, retry));
      } else {
        logger.error("history error", { error: String(e) });
        break;
      }
    }
  } while (cursor);
  return collected;
}

/**
 * チャンネルIDとtsを使って、メッセージのpermalinkを取得する
 * @param slack Slack WebClient
 * @param channel チャンネルID
 * @param ts メッセージのタイムスタンプ
 * @returns permalinkを含むオブジェクト
 */
export async function enrichMessageWithThreadAndPermalink(
  slack: WebClient,
  channel: string,
  ts: string
): Promise<{
  permalink?: string;
}> {
  const result: {
    permalink?: string;
  } = {};

  // パーマリンクを取得
  try {
    result.permalink = await fetchPermalink(slack, channel, ts);
  } catch (error) {
    logger.warn(`Failed to fetch permalink for ${ts}`, { error: String(error), channel, ts });
  }

  return result;
}

/**
 * チャンネルのメンバーリストとメール情報を取得
 */
export async function fetchChannelMembers(
  slack: WebClient,
  channelId: string
): Promise<UserInfo[]> {
  const members: UserInfo[] = [];
  let cursor: string | undefined;
  
  try {
    // conversations.membersでチャンネルのメンバーIDリストを取得
    do {
      const res = await slack.conversations.members({
        channel: channelId,
        limit: 200,
        cursor,
      });
      
      const memberIds = res.members || [];
      
      // 各メンバーの詳細情報を取得（並列処理）
      const memberInfos = await Promise.all(
        memberIds.map(async (userId) => {
          return await fetchUserInfo(slack, userId as string);
        })
      );
      
      // null以外の結果のみ追加
      members.push(...memberInfos.filter((info): info is UserInfo => info !== null));
      
      cursor = res.response_metadata?.next_cursor || undefined;
      if (cursor) await new Promise((r) => setTimeout(r, SLACK_FETCH_CONFIG.paginationDelay));
    } while (cursor);
    
    return members;
  } catch (error: any) {
    logger.error('Error fetching channel members', { channelId, error: error.message });
    return [];
  }
}

