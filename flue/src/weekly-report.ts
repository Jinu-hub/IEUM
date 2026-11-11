import { mergeItems, type MergeGroups } from "./weekly-merge.ts";
import type { WeeklyInput } from "./weekly-input.ts";
import type { WeeklyAreas } from "./weekly-areas.ts";

type WeeklyProse = { opening: string; entries: { id: string; text: string }[]; closing: string };

export const WEEKLY_MAIN_CAP = 7;

export function movementKey(ids: string[]) {
  return [...ids]
    .sort((a, b) => {
      const [ad, an] = a.split("#");
      const [bd, bn] = b.split("#");
      return ad.localeCompare(bd) || Number(an) - Number(bn);
    })
    .join("+");
}

const COPY = {
  ja: {
    metrics: "📊 今週の活動指標",
    week: "✨ 今週の動き",
    areas: "🧩 プロジェクト別の動き",
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
    week: "✨ 이번 주의 움직임",
    areas: "🧩 프로젝트별 움직임",
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
    week: "✨ This week's updates",
    areas: "🧩 By project",
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
  movementsHeading: string | null;
  movements: { ids: string[]; title: string; summary: string; status: string | null; dates: string[] }[] | null;
  // By-day list is the unmerged review. The merged report does not repeat it.
  showDays: boolean;
  days: { date: string; note: string | null; entries: { title: string; summary: string; status: string | null }[] }[];
};

// Phase 4: one row per merge group. Title, status, and summary are the last day's. Cap by max importance.
export function weeklyMovements(week: WeeklyInput, groups: MergeGroups["groups"]) {
  const byId = new Map(mergeItems(week).map((item) => [item.id, item]));
  const importance = new Map<string, number | null>();
  for (const day of week.days) {
    day.core?.highlights.forEach((item, index) => importance.set(`${day.date}#${index + 1}`, item.importance));
  }
  return groups
    .map((group) => {
      const cites = group.ids.map((id) => {
        const item = byId.get(id);
        if (!item) throw new Error(`unknown merge id ${id}`);
        return { ...item, importance: importance.get(id) ?? null };
      });
      cites.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
      const last = cites.at(-1)!;
      return {
        ids: [...group.ids],
        cites,
        last,
        score: Math.max(...cites.map((cite) => cite.importance ?? -1)),
      };
    })
    .sort((a, b) => b.score - a.score || a.cites[0]!.date.localeCompare(b.cites[0]!.date) || a.cites[0]!.id.localeCompare(b.cites[0]!.id))
    .slice(0, WEEKLY_MAIN_CAP);
}

const copyOf = (language: string | null) => COPY[language as keyof typeof COPY] ?? COPY.en;

const statusLabel = (copy: Copy, status: string | null) =>
  status && status in copy.status ? copy.status[status as Status] : status;

// Phase 2: header, summed metrics, highlights listed by day. No merge, no weekly prose.
export function weeklyReportView(week: WeeklyInput, groups?: MergeGroups["groups"]): WeeklyReportView {
  const copy = copyOf(week.language);
  const threads = groups ? weeklyMovements(week, groups) : null;
  const movements = threads
    ? threads.map((thread) => ({
        ids: thread.ids,
        title: thread.last.title || thread.last.item_key,
        summary: thread.last.summary,
        status: statusLabel(copy, thread.last.status),
        dates: thread.cites.map((cite) => cite.date),
      }))
    : null;
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
    showDays: !groups,
    movementsHeading: movements ? copy.week : null,
    movements,
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

export function weeklyBodyProblems(week: WeeklyInput, groups: MergeGroups["groups"], view: WeeklyReportView) {
  const problems = weeklyReportProblems(week, view);
  const main = weeklyMovements(week, groups);
  const shown = view.movements ?? [];
  if (shown.length > WEEKLY_MAIN_CAP) problems.push(`movements ${shown.length} > ${WEEKLY_MAIN_CAP}`);
  if (shown.length !== main.length) problems.push(`movements ${shown.length} != selected ${main.length}`);
  const selected = new Set(main.map((thread) => [...thread.ids].sort().join("|")));
  for (const movement of shown) {
    const key = [...movement.ids].sort().join("|");
    if (!selected.has(key)) problems.push(`movement is not a phase 3 group: ${key}`);
  }
  if (view.showDays) problems.push("merged report repeats the by-day list");
  return problems;
}

const mdEsc = (text: string) => text.replace(/([\\`*[\]<>])/g, "\\$1");
const htmlEsc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderWeeklyReport(
  week: WeeklyInput,
  groups?: MergeGroups["groups"],
  prose?: WeeklyProse,
  areas?: WeeklyAreas["areas"],
) {
  const view = weeklyReportView(week, groups);
  const proseById = new Map(prose?.entries.map((entry) => [entry.id, entry.text.trim()]) ?? []);
  const areasHeading = copyOf(week.language).areas;
  const areaRows = (areas ?? []).map((area) => ({
    name: area.name,
    text: area.text.trim(),
    dates: [...new Set(area.ids.map((id) => id.split("/")[0]!))].sort(),
  }));
  const lines = [`# ${mdEsc(view.title)}`, "", view.range, ""];
  if (prose?.opening.trim()) lines.push(prose.opening.trim(), "");
  lines.push(`## ${view.metricsHeading}`, "");
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
  if (view.movements && view.movementsHeading) {
    lines.push(`## ${view.movementsHeading}`, "");
    for (const movement of view.movements) {
      const text = proseById.get(movementKey(movement.ids)) ?? movement.summary;
      const status = prose ? "" : movement.status ? `${movement.status} · ` : "";
      lines.push(`### ${status}${mdEsc(movement.title)}`, "", movement.dates.join(", "), "", mdEsc(text), "");
    }
  }
  if (areaRows.length) {
    lines.push(`## ${areasHeading}`, "");
    for (const area of areaRows) lines.push(`### ${mdEsc(area.name)}`, "", area.dates.join(", "), "", mdEsc(area.text), "");
  }
  if (prose?.closing.trim()) lines.push(prose.closing.trim(), "");
  if (view.showDays) {
    lines.push(`## ${view.byDayHeading}`, "");
    for (const day of view.days) {
      lines.push(`### ${day.date}`, "");
      if (day.note) lines.push(day.note, "");
      for (const entry of day.entries) {
        lines.push(`#### ${entry.status ? `${entry.status} · ` : ""}${mdEsc(entry.title)}`, "", mdEsc(entry.summary), "");
      }
    }
  }
  const markdown = lines.join("\n");
  const metricCards = view.metrics
    .map(
      (metric) =>
        `<div class="metric"><b>${metric.value}</b><span>${htmlEsc(metric.label)}</span></div>`,
    )
    .join("");
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (week.language === "ja") weekday.splice(0, 7, "日", "月", "火", "水", "木", "金", "土");
  if (week.language === "ko") weekday.splice(0, 7, "일", "월", "화", "수", "목", "금", "토");
  const activeCount = new Map(view.activeByDay.map((row) => [row.date, row.value]));
  const active = view.activeByDay.length
    ? `<p class="sub">${htmlEsc(view.activeHeading)}</p><div class="days">${view.days
        .map((day) => {
          const count = activeCount.get(day.date);
          const label = weekday[new Date(`${day.date}T00:00:00Z`).getUTCDay()];
          return `<div class="day${count == null ? " mute" : ""}"><span>${label}</span><b>${day.date.slice(5).replace("-", "/")}</b><em>${count ?? "–"}</em></div>`;
        })
        .join("")}</div>`
    : "";
  const daySections = view.days
    .map((day) => {
      const entries = day.entries
        .map(
          (entry) =>
            `<article class="card"><h3>${entry.status ? `<span class="badge">${htmlEsc(entry.status)}</span> ` : ""}${htmlEsc(entry.title)}</h3><p>${htmlEsc(entry.summary)}</p></article>`,
        )
        .join("");
      return `<section><h2>${day.date}</h2>${day.note ? `<p class="note">${htmlEsc(day.note)}</p>` : ""}${entries}</section>`;
    })
    .join("");
  const movementHtml = (view.movements ?? [])
    .map((movement, index) => {
      const text = proseById.get(movementKey(movement.ids)) ?? movement.summary;
      const status = prose || !movement.status ? "" : `<span class="badge">${htmlEsc(movement.status)}</span>`;
      return `<article class="card"><p class="meta"><span>${String(index + 1).padStart(2, "0")}</span> ${htmlEsc(movement.dates.join(" · "))}${status}</p><h3>${htmlEsc(movement.title)}</h3><p>${htmlEsc(text)}</p></article>`;
    })
    .join("");
  const areaHtml = areaRows
    .map(
      (area) =>
        `<article class="card"><p class="meta">${htmlEsc(area.dates.join(" · "))}</p><h3>${htmlEsc(area.name)}</h3><p>${htmlEsc(area.text)}</p></article>`,
    )
    .join("");
  const byDay = view.showDays ? `<section><h2>${htmlEsc(view.byDayHeading)}</h2>${daySections}</section>` : "";
  const opening = prose?.opening.trim() ? `<section class="lead"><p>${htmlEsc(prose.opening.trim())}</p></section>` : "";
  const closing = prose?.closing.trim() ? `<section class="close"><p>${htmlEsc(prose.closing.trim())}</p></section>` : "";
  const html = `<!doctype html>
<html lang="${htmlEsc(week.language ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlEsc(view.title)}</title>
</head>
<body>
<main>
<header>
<p class="kicker">Weekly Report</p>
<h1>${htmlEsc(view.title.replace(/ Weekly Report$/, ""))}</h1>
<p class="range">${htmlEsc(view.range)}</p>
</header>
${opening}
${metricCards ? `<section><h2>${htmlEsc(view.metricsHeading)}</h2><div class="metrics">${metricCards}</div>${active}</section>` : ""}
${view.movementsHeading ? `<section><h2>${htmlEsc(view.movementsHeading)}</h2>${movementHtml}</section>` : ""}
${areaHtml ? `<section><h2>${htmlEsc(areasHeading)}</h2>${areaHtml}</section>` : ""}
${closing}
${byDay}
</main>
<style>
body{margin:0;background:#eef0f6;color:#1c2434;font:16px/1.7 -apple-system,BlinkMacSystemFont,"Hiragino Sans","Apple SD Gothic Neo",sans-serif}
main{max-width:720px;margin:28px auto;background:#fff;border:1px solid #e1e4ee;border-radius:16px;overflow:hidden}
header{padding:32px 32px 26px;background:linear-gradient(135deg,#5E6AD2,#3f4cb5);color:#fff}
.kicker{margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.8}
h1{margin:0;font-size:28px;line-height:1.25}
.range{margin:8px 0 0;opacity:.9}
section{padding:8px 32px 28px}
h2{margin:22px 0 14px;padding-bottom:8px;border-bottom:1px solid #e8ebf3;font-size:16px}
.lead,.close{margin:0 32px;padding:18px 20px;border-radius:12px;background:#f6f7fb}
.lead{margin-top:24px;border-left:4px solid #5E6AD2}
.close{margin-bottom:28px;background:#f7f6f2}
.lead p,.close p,.card p{margin:0}
.metrics{display:flex;gap:10px;flex-wrap:wrap}
.metric{flex:1;min-width:120px;padding:14px 16px;border-radius:12px;background:#f6f7fb}
.metric b{display:block;font-size:28px;line-height:1.1;color:#3f4cb5}
.metric span{color:#5c6578;font-size:13px}
.sub{margin:18px 0 8px;color:#5c6578;font-size:13px}
.days{display:flex;gap:8px}
.day{flex:1;min-width:0;padding:8px 2px 10px;border-radius:10px;background:#f6f7fb;text-align:center}
.day span{display:block;font-size:11px;color:#5c6578}
.day b{display:block;margin-top:2px;font-size:12px;font-weight:600}
.day em{display:block;margin-top:4px;font-style:normal;font-size:18px;color:#3f4cb5}
.day.mute{opacity:.4}
.note{color:#5c6578}
.card{margin:0 0 12px;padding:16px 18px;border:1px solid #e8ebf3;border-radius:12px}
.card h3{margin:6px 0 8px;font-size:16px;line-height:1.45}
.meta{color:#5c6578;font-size:13px}
.meta span{color:#5E6AD2;font-weight:700}
.badge{margin-left:8px;color:#0F6B66}
@media(max-width:640px){main{margin:0;border-radius:0}header,section{padding-left:18px;padding-right:18px}.lead,.close{margin-left:18px;margin-right:18px}}
</style>
</body>
</html>`;
  return { view, markdown, html };
}
