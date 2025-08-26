import type { WebClient } from "@slack/web-api";
import type { FetchedMessage, UserInfo } from "./types";
import { logger } from "../../lib/logger";
import pLimit from "p-limit";

const userCache = new Map<string, UserInfo>();
const pendingUser = new Map<string, Promise<UserInfo | null>>();
const userLimit = pLimit(5);
const messageLimit = pLimit(5);
const replyLimit = pLimit(5);

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
      console.log('Channel:', c.name, 'is_member:', c.is_member);
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
    if (cursor) await new Promise((r) => setTimeout(r, 350));
  } while (cursor);
  return replies;
}

export async function fetchChannelMessages(
  slack: WebClient,
  channel: string,
  oldestTs: string
): Promise<FetchedMessage[]> {
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
              user: userId,
              userInfo: userInfo || undefined,
              text: m.text,
              reactions: (m.reactions as any)?.map((r: any) => ({ name: r.name, count: r.count, users: r.users })),
              files: (m.files as any)?.map((f: any) => ({ name: f.name, url: f.url_private })),
            };
            const thread_ts = m.thread_ts as string | undefined;
            if (thread_ts) {
              base.thread = { replies: await fetchReplies(slack, channel, thread_ts, oldestTs) };
            }
            base.permalink = await fetchPermalink(slack, channel, m.ts!);
            return base;
          })
        )
      );
      collected.push(...batch);
      cursor = res.response_metadata?.next_cursor || undefined;
      if (cursor) await new Promise((r) => setTimeout(r, 350));
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


