export type SlackConfig = {
  token: string;
  days: number;
  channelIds: string[];
  outDir: string;
};

export function parseChannels(envValue: string | undefined): string[] {
  return (envValue || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type ConfigOverrides = Partial<{
  token: string;
  days: number;
  outDir: string;
  channels: string; // comma-separated channel IDs
  channelIds: string[];
}>;

export function getSlackConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: ConfigOverrides = {}
): SlackConfig {
  const token = overrides.token ?? env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing SLACK_BOT_TOKEN");
  }

  const daysRaw = overrides.days ?? env.FETCH_DAYS ?? "7";
  const days = Number(daysRaw);
  if (!Number.isFinite(days) || days < 0) {
    throw new Error(`Invalid FETCH_DAYS: ${daysRaw}`);
  }

  const channelIds = overrides.channelIds
    ? overrides.channelIds
    : parseChannels(overrides.channels ?? env.SLACK_CHANNEL_IDS);
  const outDir = overrides.outDir ?? (env.OUT_DIR || "output");

  return { token, days, channelIds, outDir };
}


