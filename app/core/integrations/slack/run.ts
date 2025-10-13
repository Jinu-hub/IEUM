import dayjs from "dayjs";
import "dotenv/config";
import pLimit from "p-limit";
import { logger } from "../../lib/logger";
import { createSlackClient } from "./client";
import { getSlackConfig } from "./config";
import { fetchChannelInfo, fetchChannelMessages, listChannels } from "./fetchers";
import type { FetchedMessage } from "./types";

export async function runSlackFetch(overrides?: {
  token?: string;
  days?: number;
  channels?: string;
  outDir?: string;
}) {
  const cfg = getSlackConfig(process.env, overrides);
  const slack = createSlackClient(cfg.token);

  const now = dayjs();
  const oldestTs = now.subtract(cfg.days, "day").unix().toString();

  const channelIds = cfg.channelIds.length
    ? cfg.channelIds
    : (await listChannels(slack)).slice(0, 3).map((c) => c.id);

  const result: Record<string, FetchedMessage[]> = {};
  const limit = pLimit(3);
  await Promise.all(
    channelIds.map((ch) =>
      limit(async () => {
        // 채널 정보 가져오기
        const channelInfo = await fetchChannelInfo(slack, ch);
        if (channelInfo) {
          logger.info("📢 fetch channel info", {
            "channel ID": channelInfo.id,
            "channel name": channelInfo.name,
            "description": channelInfo.purpose?.value || "none",
            "topic": channelInfo.topic?.value || "none",
            "members": channelInfo.num_members,
          });

          // 탭 정보가 있으면 출력
          /*
          if (channelInfo.properties?.tabs && channelInfo.properties.tabs.length > 0) {
            const tabs = channelInfo.properties.tabs
              .filter((tab: any) => tab.label)
              .map((tab: any) => tab.label);
            if (tabs.length > 0) {
              logger.info("  📌 채널 탭", { tabs });
            }
          }
          */
        }
        const key = ch + ":" + (channelInfo?.name || "");
        result[key] = await fetchChannelMessages(slack, ch, oldestTs);
      })
    )
  );

  /*
  const writer = new FileWriter<Record<string, FetchedMessage[]>>(cfg.outDir || "output", "slack_raw.json");
  await writer.save(result);
  logger.info("saved slack_raw.json", { path: `${cfg.outDir || "output"}/slack_raw.json` });
  */
  return result;
}


