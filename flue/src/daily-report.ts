import * as v from "valibot";
import { type buildCoreJson, plainSlackText } from "./daily-core.ts";

export type DailyCoreJson = ReturnType<typeof buildCoreJson>;
type CoreItem = DailyCoreJson["highlights"][number];

export const REPORT_FORMAT_VERSION = "daily-report-code-v2";

// Entries with more evidence than this show the first links and a count of the rest.
const MAX_LINKS = 3;

const ICON = { completed: "✅", in_progress: "🚧", blocked: "⛔", planned: "📅" } as const;
type Status = keyof typeof ICON;

const LABELS = {
  ja: {
    overview: "👋 今日の概要",
    points: "今日のポイント",
    highlights: "✨ ハイライト",
    progress_roadmap: "🔄 進捗・予定",
    topics: "💬 議論・調整",
    closing: "⏭ 次の焦点",
    member_activity: "👥 メンバーアクティビティ",
    metrics: "📊 今日のKPI",
    metric_columns: ["指標", "件数"],
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
    overview: "👋 오늘의 요약",
    points: "오늘의 포인트",
    highlights: "✨ 하이라이트",
    progress_roadmap: "🔄 진행·예정",
    topics: "💬 논의·조정",
    closing: "⏭ 다음 초점",
    member_activity: "👥 멤버 활동",
    metrics: "📊 오늘의 KPI",
    metric_columns: ["지표", "건수"],
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
    overview: "👋 Overview",
    points: "Key points",
    highlights: "✨ Highlights",
    progress_roadmap: "🔄 Progress & next",
    topics: "💬 Discussions",
    closing: "⏭ Next focus",
    member_activity: "👥 Member activity",
    metrics: "📊 Today's KPIs",
    metric_columns: ["Metric", "Count"],
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

const EVENT_SECTIONS = ["highlights", "progress_roadmap", "topics"] as const;
type EventSection = (typeof EVENT_SECTIONS)[number];
// The writer sees event items under short ids: item_key is unique only within its array.
const ID_PREFIX: Record<EventSection, string> = { highlights: "H", progress_roadmap: "P", topics: "T" };
const sectionOf = (id: string) => EVENT_SECTIONS.find((section) => id.startsWith(ID_PREFIX[section]));

const byImportance = (items: CoreItem[]) => [...items].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));

export function eventItems(core: DailyCoreJson) {
  return EVENT_SECTIONS.flatMap((section) =>
    byImportance(core[section]).map((item, i) => ({ id: `${ID_PREFIX[section]}${i + 1}`, section, item })),
  );
}

const MAX_QUOTES = 3;
// Shorter lines are acknowledgements; longer ones are reports, not remarks (and may be cut at 200).
const QUOTE_CHARS = { min: 15, max: 120 };
export type Quote = { id: string; author: string; text: string };

// Daily status posts ("【本日の作業予定】 #123 →開発 【体調】 普通", "・No.1 ⇒ 完了 ・No.2 …") are forms,
// not something someone said.
const isStatusForm = (text: string) =>
  /^\s*【[^】]*】/.test(text) || (text.match(/【[^】]*】/g) ?? []).length >= 2 || (text.match(/・/g) ?? []).length >= 2;

// Quote candidates: lines people wrote that day (author is null for bots and context lines).
// The longest few carry the most substance; they are offered in time order.
// Excerpts stored before generation 8 still carry emoji codes and URL labels.
export function itemQuotes(item: CoreItem, itemId: string): Quote[] {
  const seen = new Set<string>();
  const lines = (item.evidence ?? []).flatMap((e) => {
    const text = e.author && e.excerpt ? plainSlackText(e.excerpt) : "";
    if (!text || seen.has(text)) return [];
    if (text.length < QUOTE_CHARS.min || text.length > QUOTE_CHARS.max || isStatusForm(text)) return [];
    seen.add(text);
    return [{ author: e.author!, text, at: e.occurred_at }];
  });
  return lines
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, MAX_QUOTES)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ author, text }, i) => ({ id: `${itemId}.${i + 1}`, author, text }));
}

const payload = (item: CoreItem) => ({ owners: item.payload?.owners ?? [], next_steps: item.payload?.next_steps ?? [] });

// Writer output, and the shape the finalizer rewrites.
// Code fixes the section frame and the model fills it. Flat on purpose: with paragraphs nested in
// sections, the model left sections empty and put closing inside the last one (run p1-1).
const ItemIds = v.pipe(v.array(v.string()), v.minLength(1), v.description("ids of the items this is written from, e.g. H1, T3."));
export const ReportDraft = v.object({
  opening: v.pipe(v.string(), v.minLength(1)),
  points: v.pipe(v.array(v.object({ text: v.pipe(v.string(), v.minLength(1)), item_ids: ItemIds })), v.minLength(1), v.maxLength(3)),
  entries: v.pipe(
    v.array(
      v.object({
        section: v.picklist(EVENT_SECTIONS),
        headline: v.pipe(v.string(), v.minLength(1)),
        text: v.pipe(v.string(), v.minLength(1)),
        item_ids: ItemIds,
        quote_ids: v.pipe(
          v.array(v.string()),
          v.maxLength(2),
          v.description("Quotes shown verbatim under a highlights entry, e.g. H1.2. Empty for other sections."),
        ),
      }),
    ),
    v.minLength(1),
  ),
  closing: v.string(),
});
export type ReportDraft = v.InferOutput<typeof ReportDraft>;

const reportItems = (core: DailyCoreJson) =>
  eventItems(core).map(({ id, section, item }) => ({
    id,
    section,
    title: item.title,
    summary: item.summary,
    status: item.status,
    importance: item.importance,
    ...payload(item),
    quotes: itemQuotes(item, id),
  }));

export function writerInput(core: DailyCoreJson) {
  return JSON.stringify({
    target: core.meta.target_display_name,
    date: core.meta.core_date,
    overview: core.overview.summary,
    items: reportItems(core),
  });
}

// The finalizer sees the same items as the writer: they are the only facts it may use.
export function finalizerInput(core: DailyCoreJson, draft: ReportDraft) {
  return JSON.stringify({ target: core.meta.target_display_name, date: core.meta.core_date, items: reportItems(core), draft });
}

// A finalizer may merge, split and reorder entries and points: links, icons and quotes are rebuilt from
// item_ids and quote_ids. Only an item the draft covered and the edit dropped loses content.
export function coverageProblems(before: ReportDraft, after: ReportDraft) {
  const used = new Set(after.entries.flatMap((e) => e.item_ids));
  const dropped = [...new Set(before.entries.flatMap((e) => e.item_ids))].filter((id) => !used.has(id));
  return dropped.length ? [`items dropped: ${dropped.join(", ")}; every item the draft covers stays in some entry`] : [];
}

// Quotes show only under highlights; a finalizer's quote_ids elsewhere are cleared instead of rejected.
export const withoutStrayQuotes = (draft: ReportDraft): ReportDraft => ({
  ...draft,
  entries: draft.entries.map((e) => (e.section === "highlights" || !e.quote_ids.length ? e : { ...e, quote_ids: [] })),
});

// Icons already show the status; a leading 【進行中】 or [Done] repeats it (finalizer run p1-4).
const LEADING_LABEL = /^\s*[【\[［(（]/;
export function labelProblems(draft: ReportDraft) {
  const labeled = [...draft.points.map((p) => p.text), ...draft.entries.map((e) => e.headline)].filter((t) => LEADING_LABEL.test(t));
  return labeled.length ? [`remove leading labels or brackets: ${labeled.map((t) => `"${t}"`).join(", ")}; status icons are added by code`] : [];
}

// changed: texts of the edit not found word for word in the draft (entries may be merged or reordered).
export function revisionStats(before: ReportDraft, after: ReportDraft) {
  const texts = (d: ReportDraft) => [d.opening, ...d.points.map((p) => p.text), ...d.entries.flatMap((e) => [e.headline, e.text]), d.closing];
  const [a, b] = [texts(before), texts(after)];
  return {
    texts_before: a.length,
    texts_after: b.length,
    changed: b.filter((text) => !a.includes(text)).length,
    chars_before: a.join("").length,
    chars_after: b.join("").length,
  };
}

const TICKET = /#\d{3,}/g;
// quotes: quote ids offered per item id.
export type DraftEvidence = { ids: string[]; required: string[]; tickets: string[]; quotes: Record<string, string[]> };

export function draftEvidence(core: DailyCoreJson): DraftEvidence {
  const items = eventItems(core).map(({ id, section, item }) => ({ id, section, item, quotes: itemQuotes(item, id) }));
  const text = [
    core.overview.summary,
    ...[...EVENT_SECTIONS, "member_activity" as const].flatMap((s) => core[s].flatMap((i) => [i.title, i.summary, ...payload(i).next_steps])),
    ...items.flatMap((i) => i.quotes.map((q) => q.text)),
  ].join("\n");
  return {
    ids: items.map((i) => i.id),
    required: items.filter((i) => i.section === "highlights").map((i) => i.id),
    tickets: [...new Set(text.match(TICKET) ?? [])],
    quotes: Object.fromEntries(items.map((i) => [i.id, i.quotes.map((q) => q.id)])),
  };
}

const draftText = (draft: ReportDraft) =>
  [draft.opening, ...draft.points.map((p) => p.text), ...draft.entries.flatMap((e) => [e.headline, e.text]), draft.closing].join("\n");

export function draftProblems(draft: ReportDraft, { ids, required, tickets, quotes }: DraftEvidence) {
  const known = new Set(ids);
  const cited = new Set([...draft.points, ...draft.entries].flatMap((e) => e.item_ids));
  const used = new Set(draft.entries.flatMap((e) => e.item_ids));
  const problems: string[] = [];
  const unknown = [...cited].filter((id) => !known.has(id));
  if (unknown.length) problems.push(`unknown item_ids ${unknown.join(", ")}; use only ids from the input items`);
  const misplaced = draft.entries.filter((e) => !e.item_ids.some((id) => known.has(id) && sectionOf(id) === e.section));
  if (misplaced.length) {
    problems.push(
      `entries citing no item of their section: ${misplaced.map((e) => `"${e.headline}" (${e.section})`).join(", ")}; ` +
        "set section to where its main item belongs (H = highlights, P = progress_roadmap, T = topics)",
    );
  }
  const missing = required.filter((id) => !used.has(id));
  if (missing.length) problems.push(`highlights not covered: ${missing.join(", ")}; cite each highlight in some entry`);
  const invented = [...new Set(draftText(draft).match(TICKET) ?? [])].filter((t) => !tickets.includes(t));
  if (invented.length) problems.push(`ticket numbers not in the input: ${invented.join(", ")}; use only numbers written in the items`);
  const quoted = draft.entries.filter((e) => e.section !== "highlights" && e.quote_ids.length);
  if (quoted.length) problems.push(`quotes outside highlights: ${quoted.map((e) => `"${e.headline}"`).join(", ")}; use [] there`);
  const foreign = draft.entries.flatMap((e) => {
    const offered = new Set(e.item_ids.flatMap((id) => quotes[id] ?? []));
    return e.quote_ids.filter((q) => !offered.has(q));
  });
  if (foreign.length) problems.push(`quote_ids not offered by the entry's items: ${foreign.join(", ")}; pick from the quotes of the items it cites`);
  return problems;
}

export function draftStats(draft: ReportDraft, { ids }: DraftEvidence) {
  const used = new Set(draft.entries.flatMap((e) => e.item_ids));
  return {
    items: ids.length,
    items_used: ids.filter((id) => used.has(id)).length,
    unused: ids.filter((id) => !used.has(id)),
    points: draft.points.length,
    entries: Object.fromEntries(EVENT_SECTIONS.map((s) => [s, draft.entries.filter((e) => e.section === s).length])),
    quotes: draft.entries.reduce((n, e) => n + e.quote_ids.length, 0),
    chars: draftText(draft).length,
  };
}

export type ReportEntry = {
  title: string;
  icon: string | null;
  status: string | null;
  summary: string;
  links: string[];
  more: number;
  quotes: { author: string; text: string }[];
};
// block: entries with their own heading; list: one line each; members: name, then summary.
export type ReportSection = { heading: string; layout: "block" | "list" | "members"; entries: ReportEntry[] };
export type ReportMetric = { label: string; value: number; parts: { name: string; value: number }[] };
export type ReportView = {
  title: string;
  date: string;
  overview: { heading: string; summary: string; points: { heading: string; items: { icon: string | null; text: string }[] } | null } | null;
  sections: ReportSection[];
  closing: { heading: string; text: string } | null;
  members: ReportSection | null;
  metrics: { heading: string; columns: readonly [string, string]; rows: ReportMetric[] };
  empty: string | null;
};

const LAYOUT = { highlights: "block", progress_roadmap: "list", topics: "list" } as const;

const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

function links(items: CoreItem[]) {
  const urls = [...new Set(items.flatMap((item) => item.evidence.map((e) => e.url)).filter(isHttp))];
  return { links: urls.slice(0, MAX_LINKS), more: Math.max(0, urls.length - MAX_LINKS) };
}

// A merged entry shows a status only when every cited item has it.
function commonStatus(items: CoreItem[]): Status | null {
  const statuses = new Set(items.map((item) => item.status));
  const [only] = statuses;
  return statuses.size === 1 && only && only in ICON ? (only as Status) : null;
}

function entry(title: string, summary: string, items: CoreItem[], labels: Labels, quotes: Quote[] = []): ReportEntry {
  const status = commonStatus(items);
  return {
    title,
    icon: status && ICON[status],
    status: status && labels.status[status],
    summary,
    ...links(items),
    quotes: quotes.map(({ author, text }) => ({ author, text })),
  };
}

const blockedFirst = (entries: ReportEntry[]) =>
  [...entries].sort((a, b) => Number(b.icon === ICON.blocked) - Number(a.icon === ICON.blocked));

// Without a draft the event arrays are listed as Core wrote them; with a draft its entries fill the
// same sections. Members always come from Core, in the Structurer's order: sorting people by
// importance reads as a ranking in a team mail.
export function reportView(core: DailyCoreJson, draft?: ReportDraft): ReportView {
  const labels = LABELS[core.meta.language as keyof typeof LABELS] ?? LABELS.en;
  const story = draft && core.quality.status !== "empty" ? draft : undefined;
  const events = eventItems(core);
  const byId = new Map(events.map(({ id, item }) => [id, item]));
  const quoteById = new Map(events.flatMap(({ id, item }) => itemQuotes(item, id).map((q) => [q.id, q] as const)));
  const cite = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);

  const sections = EVENT_SECTIONS.map((key): ReportSection => {
    const entries = story
      ? story.entries
          .filter((e) => e.section === key)
          .map((e) => entry(e.headline, e.text, cite(e.item_ids), labels, e.quote_ids.flatMap((q) => quoteById.get(q) ?? [])))
      : byImportance(core[key]).map((item) => entry(item.title, item.summary, [item], labels));
    return { heading: labels[key], layout: LAYOUT[key], entries: key === "progress_roadmap" ? blockedFirst(entries) : entries };
  });
  const summary = story ? story.opening : core.overview.summary;
  const points = (story?.points ?? []).map((p) => {
    const status = commonStatus(cite(p.item_ids));
    return { icon: status && ICON[status], text: p.text };
  });
  const members: ReportSection = {
    heading: labels.member_activity,
    layout: "members",
    entries: core.member_activity.map((item) => entry(item.title, item.summary, [item], labels)),
  };

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
    overview: summary.trim()
      ? { heading: labels.overview, summary, points: points.length ? { heading: labels.points, items: points } : null }
      : null,
    sections: sections.filter((section) => section.entries.length),
    closing: story?.closing.trim() ? { heading: labels.closing, text: story.closing } : null,
    members: members.entries.length ? members : null,
    metrics: {
      heading: labels.metrics,
      columns: labels.metric_columns,
      rows: [...rows.values()]
        .filter((row) => row.value > 0)
        .map((row) => ({ ...row, parts: row.parts.length > 1 ? row.parts.filter((p) => p.value > 0) : [] })),
    },
    empty: core.quality.status === "empty" ? labels.empty : null,
  };
}

// A total row, then one row per source when it came from more than one (Slack channels).
const metricRows = (rows: ReportMetric[]) =>
  rows.flatMap(({ label, value, parts }) => [
    { label, value, part: false },
    ...parts.map((p) => ({ label: p.name, value: p.value, part: true })),
  ]);

const iconText = (icon: string | null) => (icon ? `${icon} ` : "");

function markdown(view: ReportView) {
  // `_` stays: names like D_G_S are common and an underscore inside a word is not emphasis.
  const md = (text: string) => text.replace(/([\\`*[\]<>])/g, "\\$1");
  const withLinks = (e: ReportEntry) => {
    const links = [...e.links.map((url, i) => `[${i + 1}](${url})`), ...(e.more ? [`+${e.more}`] : [])].join(" ");
    return `${md(e.summary)}${links ? ` ${links}` : ""}`;
  };
  const lines = [`# ${md(view.title)}`, "", view.date, ""];
  if (view.empty) lines.push(md(view.empty), "");
  if (view.overview) {
    const { heading, summary, points } = view.overview;
    lines.push(`## ${heading}`, "", md(summary), "");
    if (points) lines.push(`**${md(points.heading)}**`, ...points.items.map((p) => `- ${iconText(p.icon)}${md(p.text)}`), "");
  }
  const section = ({ heading, layout, entries }: ReportSection) => {
    lines.push(`## ${md(heading)}`, "");
    for (const e of entries) {
      if (layout === "block") {
        lines.push(`### ${iconText(e.icon)}${md(e.title)}`, "", withLinks(e), "");
        if (e.quotes.length) lines.push(...e.quotes.map((q) => `> **${md(q.author)}**: ${md(q.text)}  `), "");
      }
      else if (layout === "list") lines.push(`- ${iconText(e.icon)}**${md(e.title)}** ${withLinks(e)}`);
      else lines.push(`- **${md(e.title)}**${e.status ? ` (${e.status})` : ""}`, `  ${withLinks(e)}`);
    }
    if (layout !== "block") lines.push("");
  };
  view.sections.forEach(section);
  if (view.closing) lines.push(`## ${view.closing.heading}`, "", md(view.closing.text), "");
  if (view.members) section(view.members);
  if (view.metrics.rows.length) {
    const [name, count] = view.metrics.columns;
    const cell = (text: string) => md(text).replace(/\|/g, "\\|");
    lines.push(
      `## ${view.metrics.heading}`,
      "",
      `| ${name} | ${count} |`,
      "| --- | ---: |",
      ...metricRows(view.metrics.rows).map((r) => `| ${r.part ? `└ ${cell(r.label)}` : cell(r.label)} | ${r.value} |`),
      "",
    );
  }
  return lines.join("\n");
}

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Apple SD Gothic Neo',sans-serif";

function html(view: ReportView) {
  const h2 = (text: string) =>
    `<h2 style="margin:28px 0 10px;font-size:16px;color:#0D0E10;border-bottom:1px solid #E1E4E8;padding-bottom:6px">${esc(text)}</h2>`;
  const p = (text: string, style = "") => `<p style="margin:0 0 12px;line-height:1.7;${style}">${esc(text)}</p>`;
  const withLinks = (e: ReportEntry) => {
    const links = [
      ...e.links.map((url, i) => `<a href="${esc(url)}" style="color:#5E6AD2;text-decoration:none">[${i + 1}]</a>`),
      ...(e.more ? [`+${e.more}`] : []),
    ].join(" ");
    return `${esc(e.summary)}${links ? ` <span style="font-size:12px;color:#6C6F7E">${links}</span>` : ""}`;
  };
  const body: string[] = [
    `<h1 style="margin:0;font-size:20px;color:#0D0E10">${esc(view.title)}</h1>`,
    `<p style="margin:4px 0 0;color:#6C6F7E;font-size:13px">${esc(view.date)}</p>`,
  ];
  if (view.empty) body.push(p(view.empty, "margin-top:24px"));
  if (view.overview) {
    const { heading, summary, points } = view.overview;
    body.push(h2(heading), p(summary));
    if (points) {
      body.push(
        `<div style="margin:0 0 12px;padding:10px 14px;border:1px solid #E1E4E8;border-radius:8px">`,
        `<div style="margin-bottom:4px;font-size:12px;font-weight:bold;color:#5E6AD2">${esc(points.heading)}</div>`,
        ...points.items.map((item) => `<div style="line-height:1.7">${iconText(item.icon)}${esc(item.text)}</div>`),
        `</div>`,
      );
    }
  }
  const section = ({ heading, layout, entries }: ReportSection) => {
    body.push(h2(heading));
    for (const e of entries) {
      if (layout === "block") {
        body.push(
          `<div style="margin:0 0 16px;padding-left:12px;border-left:3px solid #5E6AD2">`,
          `<div style="margin-bottom:2px;font-size:15px;font-weight:bold;line-height:1.5">${iconText(e.icon)}${esc(e.title)}</div>`,
          `<div style="line-height:1.7">${withLinks(e)}</div>`,
          ...e.quotes.map(
            (q) =>
              `<div style="margin-top:6px;padding:6px 10px;background:#F6F7F9;border-radius:6px;font-size:12px;line-height:1.6;color:#4A4D57"><strong>${esc(q.author)}</strong>: ${esc(q.text)}</div>`,
          ),
          `</div>`,
        );
      } else if (layout === "list") {
        body.push(`<div style="margin:0 0 10px;line-height:1.7">${iconText(e.icon)}<strong>${esc(e.title)}</strong> ${withLinks(e)}</div>`);
      } else {
        const status = e.status
          ? ` <span style="font-size:11px;font-weight:normal;color:#5E6AD2;border:1px solid #5E6AD2;border-radius:8px;padding:0 6px">${esc(e.status)}</span>`
          : "";
        body.push(
          `<div style="margin:0 0 14px">`,
          `<div style="font-weight:bold;line-height:1.5">${esc(e.title)}${status}</div>`,
          `<div style="line-height:1.7">${withLinks(e)}</div>`,
          `</div>`,
        );
      }
    }
  };
  view.sections.forEach(section);
  if (view.closing) body.push(h2(view.closing.heading), p(view.closing.text));
  if (view.members) section(view.members);
  if (view.metrics.rows.length) {
    const [name, count] = view.metrics.columns;
    const th = "padding:6px 8px;border-bottom:2px solid #E1E4E8;font-size:12px;color:#6C6F7E";
    const td = "padding:6px 8px;border-bottom:1px solid #E1E4E8";
    body.push(
      h2(view.metrics.heading),
      `<table style="width:100%;border-collapse:collapse;font-size:14px">`,
      `<tr><th style="${th};text-align:left">${esc(name)}</th><th style="${th};text-align:right">${esc(count)}</th></tr>`,
      ...metricRows(view.metrics.rows).map((r) =>
        r.part
          ? `<tr><td style="${td};padding-left:24px;font-size:12px;color:#6C6F7E">${esc(r.label)}</td><td style="${td};text-align:right;font-size:12px;color:#6C6F7E">${r.value}</td></tr>`
          : `<tr><td style="${td}">${esc(r.label)}</td><td style="${td};text-align:right;font-weight:bold">${r.value}</td></tr>`,
      ),
      `</table>`,
    );
  }
  return [
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`,
    `<body style="margin:0;background:#FFFFFF">`,
    `<div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:${FONT};font-size:14px;color:#0D0E10">`,
    ...body,
    `</div></body></html>`,
  ].join("\n");
}

export function renderDailyReport(core: DailyCoreJson, draft?: ReportDraft) {
  const view = reportView(core, draft);
  return { subject: `${view.title} ${view.date}`, markdown: markdown(view), html: html(view) };
}
