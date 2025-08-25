// apps/integrations/slack/genSlackReport.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";

type UserInfo = {
  id: string;
  name?: string;
  real_name?: string;
  display_name?: string;
  profile?: {
    display_name?: string;
    real_name?: string;
    email?: string;
    image_72?: string;
  };
};

type Msg = {
  ts: string;
  user?: string;
  userInfo?: UserInfo;
  text?: string;
  permalink?: string;
  reactions?: { name: string; count: number }[];
  thread?: { replies: Msg[] };
};

function mdEscape(s: string) {
  return s.replace(/([_*[\]()#+\-!`])/g, "\\$1");
}

function getUserDisplayName(userInfo?: UserInfo): string {
  if (!userInfo) return "Unknown User";
  
  // 優先順位: display_name > real_name > name
  return (
    userInfo.profile?.display_name ||
    userInfo.profile?.real_name ||
    userInfo.real_name ||
    userInfo.display_name ||
    userInfo.name ||
    `@${userInfo.id}`
  );
}

function summarize(messages: Msg[]) {
  // 가장 리액션 많은 Top 메시지 5
  const flat: Msg[] = [];
  for (const m of messages) {
    flat.push(m);
    for (const r of m.thread?.replies || []) flat.push(r);
  }
  const withScore = flat.map((m) => ({
    m,
    score: (m.reactions || []).reduce((a, r) => a + (r.count || 0), 0),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, 5).map(({ m, score }) => ({ m, score }));
}

function renderChannel(channelId: string, msgs: Msg[]) {
  const top = summarize(msgs);
  let md = `## <#${channelId}>\n\n`;
  if (top.length === 0) return md + "_No highlights_\n\n";

  md += `### 🏅 Top Highlights\n`;
  for (const { m, score } of top) {
    const when = dayjs.unix(Number(m.ts.split(".")[0])).format("YYYY-MM-DD HH:mm");
    const line = [
      `- [link](${m.permalink})`,
      `score: ${score}`,
      when,
      `by: ${getUserDisplayName(m.userInfo)}`,
    ]
      .filter(Boolean)
      .join(" · ");
    md += `${line}\n`;
    if (m.text) md += `  \n> ${mdEscape(m.text).slice(0, 200)}\n`;
  }
  md += `\n`;
  return md;
}

function main() {
  const outDir = process.env.OUT_DIR || "output";
  const rawFile = path.join(outDir, "slack_raw.json");
  
  if (!fs.existsSync(rawFile)) {
    console.error(`${rawFile} not found. Run \`npm run slack:fetch\` first.`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(rawFile, "utf-8")) as Record<string, Msg[]>;
  let md = `# Weekly Slack Digest (POC)\nGenerated: ${dayjs().format()}\n\n`;
  for (const [ch, msgs] of Object.entries(raw)) {
    md += renderChannel(ch, msgs);
  }
  // 출력 디렉토리 생성
  fs.mkdirSync(outDir, { recursive: true });
  
  const reportFile = path.join(outDir, "slack_report.md");
  fs.writeFileSync(reportFile, md, "utf-8");
  console.log(`✔ saved: ${reportFile}`);
}

main();
