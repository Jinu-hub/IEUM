import type { buildCoreJson } from "./daily-core.ts";

export type DailyCoreJson = ReturnType<typeof buildCoreJson>;
type CoreItem = DailyCoreJson["highlights"][number];

export const REPORT_FORMAT_VERSION = "daily-report-code-v1";

// Items with more evidence than this show the first links and a count of the rest.
const MAX_LINKS = 5;

const LABELS = {
  ja: {
    overview: "今日の概要",
    highlights: "ハイライト",
    progress_roadmap: "進捗",
    topics: "トピック",
    member_activity: "メンバー",
    metrics: "数字",
    empty: "この日の活動はありませんでした。",
    status: { completed: "完了", in_progress: "進行中", blocked: "ブロック", planned: "予定" },
    metric: {
      slack_message_count: "Slack メッセージ",
      github_commit_count: "コミット",
      github_pull_request_count: "PR",
      github_issue_opened_count: "Issue 作成",
      github_issue_closed_count: "Issue クローズ",
      active_member_count: "活動メンバー",
    },
  },
  ko: {
    overview: "오늘의 요약",
    highlights: "하이라이트",
    progress_roadmap: "진행 상황",
    topics: "토픽",
    member_activity: "멤버",
    metrics: "숫자",
    empty: "이날은 활동이 없었습니다.",
    status: { completed: "완료", in_progress: "진행 중", blocked: "막힘", planned: "예정" },
    metric: {
      slack_message_count: "Slack 메시지",
      github_commit_count: "커밋",
      github_pull_request_count: "PR",
      github_issue_opened_count: "이슈 생성",
      github_issue_closed_count: "이슈 종료",
      active_member_count: "활동 멤버",
    },
  },
  en: {
    overview: "Overview",
    highlights: "Highlights",
    progress_roadmap: "Progress",
    topics: "Topics",
    member_activity: "Members",
    metrics: "Numbers",
    empty: "No activity on this day.",
    status: { completed: "Done", in_progress: "In progress", blocked: "Blocked", planned: "Planned" },
    metric: {
      slack_message_count: "Slack messages",
      github_commit_count: "Commits",
      github_pull_request_count: "PRs",
      github_issue_opened_count: "Issues opened",
      github_issue_closed_count: "Issues closed",
      active_member_count: "Active members",
    },
  },
} as const;
type Labels = (typeof LABELS)[keyof typeof LABELS];

const SECTIONS = ["highlights", "progress_roadmap", "topics", "member_activity"] as const;

export type ReportEntry = { title: string; status: string | null; summary: string; links: string[]; more: number };
export type ReportSection = { key: (typeof SECTIONS)[number]; heading: string; entries: ReportEntry[] };
export type ReportMetric = { label: string; value: number; parts: { name: string; value: number }[] };
export type ReportView = {
  title: string;
  date: string;
  overview: { heading: string; summary: string } | null;
  sections: ReportSection[];
  metrics: { heading: string; rows: ReportMetric[] };
  empty: string | null;
};

const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

function entry(item: CoreItem, labels: Labels): ReportEntry {
  const urls = [...new Set(item.evidence.map((e) => e.url).filter(isHttp))];
  const status = item.status && item.status in labels.status ? labels.status[item.status as keyof Labels["status"]] : null;
  return { title: item.title, status, summary: item.summary, links: urls.slice(0, MAX_LINKS), more: Math.max(0, urls.length - MAX_LINKS) };
}

export function reportView(core: DailyCoreJson): ReportView {
  const labels = LABELS[core.meta.language as keyof typeof LABELS] ?? LABELS.en;
  // Event sections lead with the most important items. Members keep the Structurer's order:
  // sorting people by importance reads as a ranking in a team mail.
  const sections = SECTIONS.map((key) => {
    const items = key === "member_activity" ? core[key] : [...core[key]].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
    return { key, heading: labels[key], entries: items.map((item) => entry(item, labels)) };
  }).filter((section) => section.entries.length);

  const rows = new Map<string, ReportMetric>();
  for (const metric of core.metrics) {
    const label = labels.metric[metric.key as keyof Labels["metric"]] ?? metric.key;
    const row = rows.get(metric.key) ?? { label, value: 0, parts: [] };
    row.value += metric.value;
    if ("dimensions" in metric) row.parts.push({ name: metric.dimensions.source_ident, value: metric.value });
    rows.set(metric.key, row);
  }

  return {
    title: `${core.meta.target_display_name} Daily Report`,
    date: core.meta.core_date,
    overview: core.overview.summary.trim() ? { heading: labels.overview, summary: core.overview.summary } : null,
    sections,
    metrics: { heading: labels.metrics, rows: [...rows.values()].filter((row) => row.value > 0) },
    empty: core.quality.status === "empty" ? labels.empty : null,
  };
}

const metricText = ({ label, value, parts }: ReportMetric) =>
  `${label}: ${value}` + (parts.length > 1 ? ` (${parts.map((p) => `${p.name} ${p.value}`).join(", ")})` : "");

function markdown(view: ReportView) {
  // `_` stays: names like D_G_S are common and an underscore inside a word is not emphasis.
  const md = (text: string) => text.replace(/([\\`*[\]<>])/g, "\\$1");
  const lines = [`# ${md(view.title)}`, "", view.date, ""];
  if (view.empty) lines.push(md(view.empty), "");
  if (view.overview) lines.push(`## ${view.overview.heading}`, "", md(view.overview.summary), "");
  for (const section of view.sections) {
    lines.push(`## ${section.heading}`, "");
    for (const e of section.entries) {
      const links = [...e.links.map((url, i) => `[${i + 1}](${url})`), ...(e.more ? [`+${e.more}`] : [])].join(" ");
      lines.push(`- **${md(e.title)}**${e.status ? ` (${e.status})` : ""}`, `  ${md(e.summary)}${links ? ` ${links}` : ""}`);
    }
    lines.push("");
  }
  if (view.metrics.rows.length) {
    lines.push(`## ${view.metrics.heading}`, "", ...view.metrics.rows.map((row) => `- ${metricText(row)}`), "");
  }
  return lines.join("\n");
}

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Apple SD Gothic Neo',sans-serif";

function html(view: ReportView) {
  const h2 = (text: string) =>
    `<h2 style="margin:28px 0 8px;font-size:16px;color:#0D0E10;border-bottom:1px solid #E1E4E8;padding-bottom:6px">${esc(text)}</h2>`;
  const p = (text: string, style = "") => `<p style="margin:0 0 12px;line-height:1.7;${style}">${esc(text)}</p>`;
  const body: string[] = [
    `<h1 style="margin:0;font-size:20px;color:#0D0E10">${esc(view.title)}</h1>`,
    `<p style="margin:4px 0 0;color:#6C6F7E;font-size:13px">${esc(view.date)}</p>`,
  ];
  if (view.empty) body.push(p(view.empty, "margin-top:24px"));
  if (view.overview) body.push(h2(view.overview.heading), p(view.overview.summary));
  for (const section of view.sections) {
    body.push(h2(section.heading));
    for (const e of section.entries) {
      const status = e.status
        ? ` <span style="font-size:11px;font-weight:normal;color:#5E6AD2;border:1px solid #5E6AD2;border-radius:8px;padding:0 6px">${esc(e.status)}</span>`
        : "";
      const links = [
        ...e.links.map((url, i) => `<a href="${esc(url)}" style="color:#5E6AD2;text-decoration:none">[${i + 1}]</a>`),
        ...(e.more ? [`+${e.more}`] : []),
      ].join(" ");
      body.push(
        `<div style="margin:0 0 14px">`,
        `<div style="font-weight:bold;line-height:1.5">${esc(e.title)}${status}</div>`,
        `<div style="line-height:1.7">${esc(e.summary)}${links ? ` <span style="font-size:12px;color:#6C6F7E">${links}</span>` : ""}</div>`,
        `</div>`,
      );
    }
  }
  if (view.metrics.rows.length) {
    body.push(h2(view.metrics.heading), ...view.metrics.rows.map((row) => p(metricText(row), "margin-bottom:4px")));
  }
  return [
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`,
    `<body style="margin:0;background:#FFFFFF">`,
    `<div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:${FONT};font-size:14px;color:#0D0E10">`,
    ...body,
    `</div></body></html>`,
  ].join("\n");
}

export function renderDailyReport(core: DailyCoreJson) {
  const view = reportView(core);
  return { subject: `${view.title} ${view.date}`, markdown: markdown(view), html: html(view) };
}
