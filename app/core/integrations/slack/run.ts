import "dotenv/config";
import dayjs from "dayjs";
import { getSlackConfig } from "./config";
import { createSlackClient } from "./client";
import { listChannels, fetchChannelMessages } from "./fetchers";
import type { FetchedMessage } from "./types";
import { FileWriter } from "../../lib/writer";
import { logger } from "../../lib/logger";
import pLimit from "p-limit";

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
        logger.info("fetch channel", { channel: ch });
        result[ch] = await fetchChannelMessages(slack, ch, oldestTs);
      })
    )
  );

  const writer = new FileWriter<Record<string, FetchedMessage[]>>(cfg.outDir || "output", "slack_raw.json");
  await writer.save(result);
  logger.info("saved slack_raw.json", { path: `${cfg.outDir || "output"}/slack_raw.json` });
}


