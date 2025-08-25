// apps/integrations/github/genReport.ts
import "dotenv/config";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import dayjs from "dayjs";

type UserInfo = {
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

type CommitInfo = { 
  sha: string; 
  message: string; 
  author: string; 
  html_url: string; 
  date: string;
  userInfo?: UserInfo;
};

type PRInfo = { 
  number: number; 
  title: string; 
  user: string; 
  html_url: string; 
  merged_at: string;
  userInfo?: UserInfo;
};

type IssueInfo = { 
  number: number; 
  title: string; 
  user: string; 
  html_url: string; 
  state: "open"|"closed"; 
  created_at: string; 
  closed_at?: string|null;
  userInfo?: UserInfo;
};

type FetchedRepoData = {
  repo: { owner: string; name: string };
  commits: CommitInfo[];
  mergedPRs: PRInfo[];
  openedIssues: IssueInfo[];
  closedIssues: IssueInfo[];
};

function formatJst(d: Date, tz = "Asia/Tokyo") {
  try {
    return new Intl.DateTimeFormat("ko-KR", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch { return d.toISOString(); }
}

function topCommitters(commits: CommitInfo[], topN = 5) {
  const map = new Map<string, number>();
  for (const c of commits) map.set(c.author, (map.get(c.author) || 0) + 1);
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0, topN)
    .map(([author, count], i) => `${i+1}. ${author} — ${count} commit`);
}

const mdList = (arr: string[]) => arr.map(s => `- ${s}`).join("\n");

function generateMarkdownReport(data: Record<string, FetchedRepoData>, timezone = "Asia/Tokyo"): string {
  const sections: string[] = [];
  const DAYS = Number(process.env.FETCH_DAYS || 7);
  
  for (const [repoKey, repoData] of Object.entries(data)) {
    const { repo, commits, mergedPRs, openedIssues, closedIssues } = repoData;
    
    // 섹션 렌더
    const summary = `커밋: **${commits.length}** ・ 병합된 PR: **${mergedPRs.length}** ・ 신규 이슈: **${openedIssues.length}** ・ 종료 이슈: **${closedIssues.length}**`;
    const commitLines = commits.slice(0, 30)
      .map(c => `[\`${c.sha.substring(0,7)}\`](${c.html_url}) ${c.message} — ${c.author} *( ${c.date?.split("T")[0]||""} )*`);
    const prLines = mergedPRs.sort((a,b)=> (a.merged_at > b.merged_at ? -1 : 1))
      .map(pr => `[#${pr.number}](${pr.html_url}) ${pr.title} — @${pr.user} *(merged ${pr.merged_at?.split("T")[0]||""})*`);
    const openedLines = openedIssues.map(i => `[#${i.number}](${i.html_url}) ${i.title} — @${i.user} *(opened ${i.created_at?.split("T")[0]||""})*`);
    const closedLines = closedIssues.map(i => `[#${i.number}](${i.html_url}) ${i.title} — @${i.user} *(closed ${i.closed_at?.split("T")[0]||""})*`);

    sections.push([
      `## ${repo.owner}/${repo.name}`,
      ``,
      summary,
      ``,
      `### Top Committers`,
      topCommitters(commits).length ? mdList(topCommitters(commits)) : "_데이터 없음_",
      ``,
      `### Merged PRs`,
      prLines.length ? mdList(prLines) : "_없음_",
      ``,
      `### Notable Commits`,
      commitLines.length ? mdList(commitLines) : "_없음_",
      ``,
      `### New Issues`,
      openedLines.length ? mdList(openedLines) : "_없음_",
      ``,
      `### Closed Issues`,
      closedLines.length ? mdList(closedLines) : "_없음_",
      ``
    ].join("\n"));
  }

  const now = new Date();
  const endDate = dayjs().format("YYYY-MM-DD");
  const startDate = dayjs().subtract(DAYS, "day").format("YYYY-MM-DD");
  
  const header = [
    `# GitHub 리포트`,
    `기간: **${startDate} ~ ${endDate}** (기준: UTC, 표시: ${timezone})`,
    `생성 시각: ${formatJst(now, timezone)}`,
    ``,
    `---`,
    ``
  ].join("\n");

  return header + sections.join("\n---\n\n");
}

async function main() {
  const inputFile = process.env.INPUT_FILE || path.join(process.env.OUT_DIR || "output", "github_raw.json");
  
  if (!await fs.access(inputFile).then(() => true).catch(() => false)) {
    console.error(`❌ 입력 파일을 찾을 수 없습니다: ${inputFile}`);
    console.log("먼저 fetch.ts를 실행하여 데이터를 수집하세요.");
    process.exit(1);
  }

  const rawData = JSON.parse(await fs.readFile(inputFile, "utf-8"));
  const report = generateMarkdownReport(rawData, process.env.TIMEZONE || "Asia/Tokyo");

  const outDir = process.env.OUT_DIR || "output";
  const filename = `github_report_${new Date().toISOString().split("T")[0]}.md`;
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, filename), report, "utf8");

  console.log(`✅ saved: ${path.join(outDir, filename)}`);
}

main().catch(e => {
  console.error("❌", e?.message || e);
  process.exit(1);
});
