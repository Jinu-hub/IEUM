import { parseChannels, getSlackConfig } from "../config";

export function registerConfigTests({ test, assert }: { test: (n: string, f: () => any) => void; assert: (c: unknown, m: string) => void; }) {
  test("parseChannels: empty", () => {
    const r = parseChannels(undefined);
    assert(Array.isArray(r) && r.length === 0, "should be empty");
  });

  test("parseChannels: comma", () => {
    const r = parseChannels("C1,C2 , C3");
    assert(r.length === 3 && r[1] === "C2", "parsed channels");
  });

  test("getSlackConfig: overrides", () => {
    const cfg = getSlackConfig({}, { token: "t", days: 5, channels: "C99", outDir: "out" });
    assert(cfg.token === "t", "token");
    assert(cfg.days === 5, "days");
    assert(cfg.outDir === "out", "outDir");
    assert(cfg.channelIds.length === 1 && cfg.channelIds[0] === "C99", "channels parsed");
  });

  test("getSlackConfig: env fallback", () => {
    const cfg = getSlackConfig({ SLACK_BOT_TOKEN: "t", FETCH_DAYS: "3", SLACK_CHANNEL_IDS: "C1,C2", OUT_DIR: "o" } as any);
    assert(cfg.token === "t", "token");
    assert(cfg.days === 3, "days");
    assert(cfg.channelIds.length === 2, "channels");
    assert(cfg.outDir === "o", "outDir");
  });
}


