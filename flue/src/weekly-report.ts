import type { WeeklyInput } from "./weekly-input.ts";

const COPY = {
  ja: {
    metrics: "📊 今週の活動指標",
    byDay: "✨ 日付別の注目",
    noCore: "この日のコアはありません。",
    noHighlights: "注目の動きはありません。",
    active: "活動メンバー（日別）",
    columns: ["指標", "件数"],
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
    metrics: "📊 이번 주 활동 지표",
    byDay: "✨ 날짜별 주목",
    noCore: "이 날은 코어가 없습니다.",
    noHighlights: "주목할 움직임이 없습니다.",
    active: "활동 멤버 (날짜별)",
    columns: ["지표", "건수"],
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
    metrics: "📊 This week's activity",
    byDay: "✨ Highlights by day",
    noCore: "No core for this day.",
    noHighlights: "No highlights.",
    active: "Active members (by day)",
    columns: ["Metric", "Count"],
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

type Copy = (typeof COPY)[keyof typeof COPY];
type Status = keyof Copy["status"];

export type WeeklyReportView = {
  title: string;
  range: string;
  metricsHeading: string;
  columns: readonly [string, string];
  metrics: { label: string; value: number }[];
  activeHeading: string;
  activeByDay: { date: string; value: number }[];
  byDayHeading: string;
  days: { date: string; note: string | null; entries: { title: string; summary: string; status: string | null }[] }[];
};

const copyOf = (language: string | null) => COPY[language as keyof typeof COPY] ?? COPY.en;

const statusLabel = (copy: Copy, status: string | null) =>
  status && status in copy.status ? copy.status[status as Status] : status;

// Phase 2: header, summed metrics, highlights listed by day. No merge, no weekly prose.
export function weeklyReportView(week: WeeklyInput): WeeklyReportView {
  const copy = copyOf(week.language);
  const name = week.target_display_name ?? week.target_id;
  const active = week.unsummed.find((row) => row.key === "active_member_count");
  return {
    title: `${name} Weekly Report`,
    range: `${week.from} – ${week.to}`,
    metricsHeading: copy.metrics,
    columns: copy.columns,
    metrics: week.metrics.map((metric) => ({
      label: copy.metric[metric.key as keyof Copy["metric"]] ?? metric.key,
      value: metric.value,
    })),
    activeHeading: copy.active,
    activeByDay: active?.by_day ?? [],
    byDayHeading: copy.byDay,
    days: week.days.map((day) => {
      if (!day.core) return { date: day.date, note: copy.noCore, entries: [] };
      if (!day.core.highlights.length) return { date: day.date, note: copy.noHighlights, entries: [] };
      return {
        date: day.date,
        note: null,
        entries: day.core.highlights.map((item) => ({
          title: item.title || item.item_key,
          summary: item.summary,
          status: statusLabel(copy, item.status),
        })),
      };
    }),
  };
}

export function weeklyReportProblems(week: WeeklyInput, view: WeeklyReportView) {
  const problems: string[] = [];
  if (view.days.length !== week.days.length) problems.push(`days ${view.days.length} != ${week.days.length}`);
  week.days.forEach((day, i) => {
    const rendered = view.days[i];
    const highlights = day.core?.highlights ?? [];
    if (!rendered || rendered.date !== day.date) problems.push(`missing day ${day.date}`);
    else if (rendered.entries.length !== highlights.length) {
      problems.push(`${day.date}: entries ${rendered.entries.length} != highlights ${highlights.length}`);
    } else {
      highlights.forEach((item, j) => {
        if (rendered.entries[j]?.title !== (item.title || item.item_key)) problems.push(`${day.date}: title ${item.item_key}`);
      });
    }
  });
  week.metrics.forEach((metric, i) => {
    if (view.metrics[i]?.value !== metric.value) problems.push(`metric ${metric.key}`);
  });
  return problems;
}

const mdEsc = (text: string) => text.replace(/([\\`*[\]<>])/g, "\\$1");
const htmlEsc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderWeeklyReport(week: WeeklyInput) {
  const view = weeklyReportView(week);
  const lines = [`# ${mdEsc(view.title)}`, "", view.range, "", `## ${view.metricsHeading}`, ""];
  if (view.metrics.length) {
    lines.push(`| ${view.columns[0]} | ${view.columns[1]} |`, "| --- | ---: |");
    for (const metric of view.metrics) lines.push(`| ${mdEsc(metric.label)} | ${metric.value} |`);
    lines.push("");
  }
  if (view.activeByDay.length) {
    lines.push(`**${view.activeHeading}**`, "");
    for (const row of view.activeByDay) lines.push(`- ${row.date}: ${row.value}`);
    lines.push("");
  }
  lines.push(`## ${view.byDayHeading}`, "");
  for (const day of view.days) {
    lines.push(`### ${day.date}`, "");
    if (day.note) lines.push(day.note, "");
    for (const entry of day.entries) {
      lines.push(`#### ${entry.status ? `${entry.status} · ` : ""}${mdEsc(entry.title)}`, "", mdEsc(entry.summary), "");
    }
  }
  const markdown = lines.join("\n");
  const metricRows = view.metrics
    .map((metric) => `<tr><td>${htmlEsc(metric.label)}</td><td style="text-align:right">${metric.value}</td></tr>`)
    .join("");
  const active = view.activeByDay.map((row) => `<li>${row.date}: ${row.value}</li>`).join("");
  const days = view.days
    .map((day) => {
      const entries = day.entries
        .map(
          (entry) =>
            `<article><h3>${entry.status ? `<span>${htmlEsc(entry.status)}</span> ` : ""}${htmlEsc(entry.title)}</h3><p>${htmlEsc(entry.summary)}</p></article>`,
        )
        .join("");
      return `<section><h2>${day.date}</h2>${day.note ? `<p class="note">${htmlEsc(day.note)}</p>` : ""}${entries}</section>`;
    })
    .join("");
  const html = `<!doctype html>
<html lang="${htmlEsc(week.language ?? "en")}">
<meta charset="utf-8">
<title>${htmlEsc(view.title)}</title>
<body style="margin:0;background:#F1EDE3;color:#16150F;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Apple SD Gothic Neo',sans-serif">
<main style="max-width:720px;margin:0 auto;padding:32px 20px 64px">
<h1 style="margin:0;font-size:28px">${htmlEsc(view.title)}</h1>
<p style="margin:6px 0 28px;color:#6F6A5F">${htmlEsc(view.range)}</p>
<h2>${htmlEsc(view.metricsHeading)}</h2>
<table style="border-collapse:collapse;background:#FFFEFB">${metricRows}</table>
${active ? `<p><strong>${htmlEsc(view.activeHeading)}</strong></p><ul>${active}</ul>` : ""}
<h2>${htmlEsc(view.byDayHeading)}</h2>
${days}
</main>
<style>
h2{margin:32px 0 12px;font-size:18px}
h3{margin:0 0 4px;font-size:16px}
h3 span{font-size:12px;color:#0F6B66}
article{margin:0 0 14px;padding:12px 14px;background:#FFFEFB;border:1px solid #DDD6C6;border-left:3px solid #0F6B66}
p{margin:0}
.note{color:#6F6A5F}
td{padding:6px 16px;border-bottom:1px solid #DDD6C6}
</style>
</body>
</html>`;
  return { view, markdown, html };
}
