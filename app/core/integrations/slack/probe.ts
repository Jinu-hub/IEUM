// apps/integrations/slack/slackProbe.ts
import "dotenv/config";
import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN!;
if (!token) {
  console.error("Missing SLACK_BOT_TOKEN in .env");
  process.exit(1);
}
const slack = new WebClient(token);

async function main() {
  // 1) 봇 자기 자신 정보
  const auth = await slack.auth.test();
  console.log("✔ auth.test:", auth);

  // 2) 채널 목록(공개 채널) 조회 샘플
  const chans = await slack.conversations.list({
    types: "public_channel",
    limit: 20,
  });
  console.log(
    "✔ public channels:",
    (chans.channels || []).map((c: any) => ({ id: c.id, name: c.name }))
  );

  // 3) 첫 채널에 참여(옵션)
  const first = chans.channels?.[0];
  if (first?.id) {
    await slack.conversations.join({ channel: first.id }).catch(() => {});
    console.log("ℹ tried join:", first.name, first.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
