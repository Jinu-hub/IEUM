import * as v from "valibot";
import { type buildCoreJson, deriveEvidenceUrl, plainSlackText } from "./daily-core.ts";

export type DailyCoreJson = ReturnType<typeof buildCoreJson>;
type CoreItem = DailyCoreJson["highlights"][number];

export const REPORT_FORMAT_VERSION = "daily-report-code-v3";

// Entries with more evidence than this show the first links and a count of the rest.
const MAX_LINKS = 3;

// Reading tier (1-6 P2): not a new item_type. Highlights stay as Core refined them.
// Topic/progress main = importance ≥ 0.8 (Interpreter 4–5), capped per section; the rest fold as others.
export const REPORT_MAIN_MIN_IMPORTANCE = 0.8;
export const REPORT_MAX_MAIN_PROGRESS = 8;
export const REPORT_MAX_MAIN_TOPICS = 5;

const ICON = { completed: "✅", in_progress: "🚧", blocked: "⛔", planned: "📅" } as const;
type Status = keyof typeof ICON;

const LABELS = {
  ja: {
    overview: "👋 今日の概要",
    points: "今日の要点",
    highlights: "✨ 注目の動き",
    progress_roadmap: "🔄 進捗と今後の予定",
    topics: "🤝 議論と調整",
    closing: "🎯 次のフォーカス",
    member_activity: "🧑‍💻 メンバー別の動き",
    others: "🗂️ その他の動き",
    more_members: (n: number) => `ほか${n}名`,
    metrics: "📊 今日の活動指標",
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
    points: "오늘의 요점",
    highlights: "✨ 주목할 움직임",
    progress_roadmap: "🔄 진행 상황과 향후 일정",
    topics: "🤝 논의와 조정",
    closing: "🎯 다음 초점",
    member_activity: "🧑‍💻 멤버별 활동",
    others: "🗂️ 그 밖의 움직임",
    more_members: (n: number) => `외 ${n}명`,
    metrics: "📊 오늘의 활동 지표",
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
    points: "Today's key points",
    highlights: "✨ Notable updates",
    progress_roadmap: "🔄 Progress & upcoming plans",
    topics: "🤝 Discussions & coordination",
    closing: "🎯 Next focus",
    member_activity: "🧑‍💻 Activity by member",
    others: "🗂️ Other updates",
    more_members: (n: number) => `+${n} more`,
    metrics: "📊 Today's activity metrics",
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

function splitSectionMain(
  items: CoreItem[],
  maxMain: number,
): { main: CoreItem[]; other: CoreItem[] } {
  const ranked = byImportance(items);
  const eligible = ranked.filter((item) => (item.importance ?? 0) >= REPORT_MAIN_MIN_IMPORTANCE);
  const main = eligible.slice(0, maxMain);
  const mainKeys = new Set(main.map((item) => item.item_key));
  return { main, other: ranked.filter((item) => !mainKeys.has(item.item_key)) };
}

// Highlights: all (already capped in Core). Topic/progress: importance floor + per-section cap.
export function partitionReportItems(core: DailyCoreJson) {
  const progress = splitSectionMain(core.progress_roadmap, REPORT_MAX_MAIN_PROGRESS);
  const topics = splitSectionMain(core.topics, REPORT_MAX_MAIN_TOPICS);
  return {
    main: {
      highlights: byImportance(core.highlights),
      progress_roadmap: progress.main,
      topics: topics.main,
    },
    other: [...progress.other, ...topics.other],
  };
}

// Writer / Finalizer / draft evidence: main items only (others are rendered folded by code).
export function eventItems(core: DailyCoreJson) {
  const { main } = partitionReportItems(core);
  return EVENT_SECTIONS.flatMap((section) =>
    main[section].map((item, i) => ({ id: `${ID_PREFIX[section]}${i + 1}`, section, item })),
  );
}

const MAX_QUOTES = 3;
// Shorter lines are acknowledgements; longer ones are reports, not remarks (and may be cut at 200).
const QUOTE_CHARS = { min: 15, max: 120 };
export type Quote = { id: string; author: string; text: string };

type EvidenceEntry = NonNullable<DailyCoreJson["evidence"]>[string];
// What quote and link rendering needs from one evidence entry, whichever core_json shape stored it.
type ResolvedEvidence = { url: string | null; author: string | null; excerpt: string | null; occurred_at: string };

// A kept URL wins (v1 items inline it; v2 keeps it only when the link cannot be rebuilt).
export function evidenceUrl(core: DailyCoreJson, e: EvidenceEntry): string | null {
  return deriveEvidenceUrl(core.sources ?? {}, e);
}

// v1 items carry their evidence inline; v2 items name refs into core.evidence.
function itemEvidence(core: DailyCoreJson, item: CoreItem): ResolvedEvidence[] {
  const inline = (item as { evidence?: (EvidenceEntry & { author?: string | null; excerpt?: string | null })[] }).evidence;
  if (inline) {
    return inline.map((e) => ({ url: e.url ?? null, author: e.author ?? null, excerpt: e.excerpt ?? null, occurred_at: e.occurred_at }));
  }
  return item.evidence_refs.flatMap((ref) => {
    const e = core.evidence?.[ref];
    return e ? [{ url: evidenceUrl(core, e), author: e.author ?? null, excerpt: e.excerpt ?? null, occurred_at: e.occurred_at }] : [];
  });
}

// Daily status posts ("【本日の作業予定】 #123 →開発 【体調】 普通", "・No.1 ⇒ 完了 ・No.2 …") are forms,
// not something someone said.
const isStatusForm = (text: string) =>
  /^\s*【[^】]*】/.test(text) || (text.match(/【[^】]*】/g) ?? []).length >= 2 || (text.match(/・/g) ?? []).length >= 2;

// Quote candidates: lines people wrote that day (author is null for bots and context lines).
// The longest few carry the most substance; they are offered in time order.
// Excerpts stored before generation 8 still carry emoji codes and URL labels.
export function itemQuotes(core: DailyCoreJson, item: CoreItem, itemId: string): Quote[] {
  const seen = new Set<string>();
  const lines = itemEvidence(core, item).flatMap((e) => {
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
    quotes: itemQuotes(core, item, id),
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
  const items = eventItems(core).map(({ id, section, item }) => ({ id, section, item, quotes: itemQuotes(core, item, id) }));
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
  // tone picks the HTML badge color; markdown keeps the icon.
  tone: Status | null;
  status: string | null;
  summary: string;
  links: string[];
  more: number;
  quotes: { author: string; text: string }[];
};
// block: entries with their own heading; list: one line each; members: name, then summary.
export type ReportSection = {
  heading: string;
  layout: "block" | "list" | "members";
  entries: ReportEntry[];
  // Folded by default in HTML (<details>); markdown still lists under the heading.
  collapsed?: boolean;
  // One line shown on a folded card; when absent, HTML shows status counts.
  preview?: string;
};
export type ReportMetric = { label: string; value: number; parts: { name: string; value: number }[] };
export type ReportView = {
  title: string;
  date: string;
  overview: { heading: string; summary: string; points: { heading: string; items: { icon: string | null; tone: Status | null; status: string | null; text: string }[] } | null } | null;
  sections: ReportSection[];
  closing: { heading: string; text: string } | null;
  members: ReportSection | null;
  metrics: { heading: string; columns: readonly [string, string]; rows: ReportMetric[] };
  empty: string | null;
};

const LAYOUT = { highlights: "block", progress_roadmap: "list", topics: "list" } as const;

const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

function links(core: DailyCoreJson, items: CoreItem[]) {
  const urls = [...new Set(items.flatMap((item) => itemEvidence(core, item).map((e) => e.url)).filter(isHttp))];
  return { links: urls.slice(0, MAX_LINKS), more: Math.max(0, urls.length - MAX_LINKS) };
}

// A merged entry shows a status only when every cited item has it.
function commonStatus(items: CoreItem[]): Status | null {
  const statuses = new Set(items.map((item) => item.status));
  const [only] = statuses;
  return statuses.size === 1 && only && only in ICON ? (only as Status) : null;
}

function entry(core: DailyCoreJson, title: string, summary: string, items: CoreItem[], labels: Labels, quotes: Quote[] = []): ReportEntry {
  const status = commonStatus(items);
  return {
    title,
    icon: status && ICON[status],
    tone: status,
    status: status && labels.status[status],
    summary,
    ...links(core, items),
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
  const quoteById = new Map(events.flatMap(({ id, item }) => itemQuotes(core, item, id).map((q) => [q.id, q] as const)));
  const cite = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);

  const { main, other } = partitionReportItems(core);
  const sections = EVENT_SECTIONS.map((key): ReportSection => {
    const entries = story
      ? story.entries
          .filter((e) => e.section === key)
          .map((e) => entry(core, e.headline, e.text, cite(e.item_ids), labels, e.quote_ids.flatMap((q) => quoteById.get(q) ?? [])))
      : main[key].map((item) => entry(core, item.title, item.summary, [item], labels));
    return { heading: labels[key], layout: LAYOUT[key], entries: key === "progress_roadmap" ? blockedFirst(entries) : entries };
  });
  if (other.length) {
    sections.push({
      heading: labels.others,
      layout: "list",
      collapsed: true,
      entries: byImportance(other).map((item) => entry(core, item.title, item.summary, [item], labels)),
    });
  }
  const summary = story ? story.opening : core.overview.summary;
  const points = (story?.points ?? []).map((p) => {
    const status = commonStatus(cite(p.item_ids));
    return { icon: status && ICON[status], tone: status, status: status && labels.status[status], text: p.text };
  });
  const names = core.member_activity.map((item) => item.title);
  const members: ReportSection = {
    heading: labels.member_activity,
    layout: "members",
    collapsed: true,
    preview: [names.slice(0, 3).join(", "), ...(names.length > 3 ? [labels.more_members(names.length - 3)] : [])].join(" "),
    entries: core.member_activity.map((item) => entry(core, item.title, item.summary, [item], labels)),
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
  const section = ({ heading, layout, entries, collapsed }: ReportSection) => {
    lines.push(`## ${md(heading)}${collapsed ? ` (${entries.length})` : ""}`, "");
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
  view.sections.filter((s) => !s.collapsed).forEach(section);
  if (view.closing) lines.push(`## ${view.closing.heading}`, "", md(view.closing.text), "");
  view.sections.filter((s) => s.collapsed).forEach(section);
  if (view.members) section(view.members);
  return lines.join("\n");
}

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Apple SD Gothic Neo',sans-serif";

// Look: warm paper, ink text, one deep-teal accent, blue links, small letter-spaced labels, dashed rules, one dark block.
// Inline styles only (mail clients drop <style> and web fonts); colors live here so the accent is one edit.
const C = {
  paper: "#F1EDE3",
  card: "#FFFEFB",
  line: "#DDD6C6",
  dash: "#CFC8B6",
  ink: "#16150F",
  body: "#3A372F",
  muted: "#6F6A5F",
  accent: "#0F6B66",
  link: "#1D5FD1",
};
const MONO = "'SF Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
// Badge colors per status. Markdown keeps the emoji icons.
const TONE: Record<Status, { fg: string; bg: string; line: string }> = {
  completed: { fg: "#2F6B2F", bg: "#E4F0DF", line: "#BCD6B3" },
  in_progress: { fg: "#FFFFFF", bg: C.ink, line: C.ink },
  blocked: { fg: "#B3261E", bg: "#FCE9E7", line: "#F0BDB8" },
  planned: { fg: "#6B665B", bg: "transparent", line: "#CFC9BA" },
};
const KPI_COLUMNS = 3;

// Heading emoji drawn as Fluent Emoji 3D (MIT) in HTML; markdown keeps the emoji. PNG because Gmail drops SVG and data: URIs.
// ponytail: hotlinked from jsDelivr at a pinned commit; self-host if the CDN ever becomes a concern.
const FLUENT = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/assets";
const ILLUSTRATION: Record<string, string> = {
  "👋": `${FLUENT}/Waving%20hand/Default/3D/waving_hand_3d_default.png`,
  "✨": `${FLUENT}/Sparkles/3D/sparkles_3d.png`,
  "🔄": `${FLUENT}/Counterclockwise%20arrows%20button/3D/counterclockwise_arrows_button_3d.png`,
  "🤝": `${FLUENT}/Handshake/3D/handshake_3d.png`,
  "🎯": `${FLUENT}/Bullseye/3D/bullseye_3d.png`,
  "🧑‍💻": `${FLUENT}/Technologist/Default/3D/technologist_3d_default.png`,
  "🗂️": `${FLUENT}/Card%20index%20dividers/3D/card_index_dividers_3d.png`,
  "📊": `${FLUENT}/Bar%20chart/3D/bar_chart_3d.png`,
};

// width/height keep the layout when a client blocks images; alt is empty because the heading text stays.
function headingHtml(text: string, size: number) {
  const [emoji, ...rest] = text.split(" ");
  const src = ILLUSTRATION[emoji!];
  if (!src) return esc(text);
  return `<img src="${src}" width="${size}" height="${size}" alt="" style="display:inline-block;margin-right:8px;border:0;vertical-align:middle">${esc(rest.join(" "))}`;
}

function html(view: ReportView) {
  const badge = (tone: Status | null, label: string | null) => {
    if (!tone || !label) return "";
    const t = TONE[tone];
    return `<span style="display:inline-block;margin-right:8px;padding:0 9px;border:1px solid ${t.line};border-radius:10px;background:${t.bg};color:${t.fg};font-size:11px;font-weight:bold;letter-spacing:.04em;line-height:18px;white-space:nowrap;vertical-align:middle">${esc(label)}</span>`;
  };
  const h2 = (text: string) =>
    `<h2 style="margin:52px 0 16px;padding-top:14px;border-top:2px solid ${C.ink};font-size:16px;font-weight:800;letter-spacing:.04em;line-height:1.4;color:${C.ink}">${headingHtml(text, 28)}</h2>`;
  const p = (text: string, style = "") => `<p style="margin:0 0 12px;line-height:1.85;color:${C.body};${style}">${esc(text)}</p>`;
  const withLinks = (e: ReportEntry) => {
    const links = [
      ...e.links.map((url, i) => `<a href="${esc(url)}" style="color:${C.link};text-decoration:none">[${i + 1}]</a>`),
      ...(e.more ? [`+${e.more}`] : []),
    ].join(" ");
    return `${esc(e.summary)}${links ? ` <span style="font-family:${MONO};font-size:12px;color:${C.muted}">${links}</span>` : ""}`;
  };
  const body: string[] = [
    `<div style="width:28px;height:3px;background:${C.accent};margin-bottom:14px"></div>`,
    `<h1 style="margin:0;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.3;color:${C.ink}">${esc(view.title)}</h1>`,
    `<p style="margin:8px 0 0;font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${C.muted}">${esc(view.date)}</p>`,
  ];
  if (view.empty) body.push(p(view.empty, "margin-top:24px"));
  if (view.overview) {
    const { heading, summary, points } = view.overview;
    body.push(h2(heading), p(summary, `font-size:16px;color:${C.ink}`));
    if (points) {
      body.push(
        `<div style="margin:16px 0 0;padding:6px 18px 8px;background:${C.card};border:1px solid ${C.line};border-radius:10px">`,
        `<div style="padding:10px 0 4px;font-size:11px;font-weight:bold;letter-spacing:.12em;color:${C.accent}">${esc(points.heading)}</div>`,
        ...points.items.map(
          (item, i) =>
            `<div style="padding:9px 0;${i ? `border-top:1px dashed ${C.dash};` : ""}line-height:1.7;color:${C.ink}">${badge(item.tone, item.status)}${esc(item.text)}</div>`,
        ),
        `</div>`,
      );
    }
  }
  // KPI tiles: a table of KPI_COLUMNS cells per row (no flex/grid in mail clients); the wrapper's negative
  // margin cancels the table's outer border-spacing so tiles line up with the text.
  if (view.metrics.rows.length) {
    const tile = (r?: ReportMetric) =>
      r
        ? `<td width="33%" valign="top" style="padding:12px 14px;background:${C.card};border:1px solid ${C.line};border-radius:10px"><div style="font-size:11px;letter-spacing:.04em;color:${C.muted}">${esc(r.label)}</div><div style="margin-top:4px;font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:${C.ink}">${r.value}</div>${
            r.parts.length
              ? `<div style="margin-top:6px;font-family:${MONO};font-size:11px;line-height:1.5;color:${C.muted}">${r.parts.map((part) => `${esc(part.name)} ${part.value}`).join(" · ")}</div>`
              : ""
          }</td>`
        : `<td width="33%"></td>`;
    const rows: string[] = [];
    for (let i = 0; i < view.metrics.rows.length; i += KPI_COLUMNS) {
      const cells = Array.from({ length: KPI_COLUMNS }, (_, j) => tile(view.metrics.rows[i + j]));
      rows.push(`<tr>${cells.join("")}</tr>`);
    }
    body.push(
      h2(view.metrics.heading),
      `<div style="margin:0 -8px"><table role="presentation" width="100%" style="width:100%;border-collapse:separate;border-spacing:8px">${rows.join("")}</table></div>`,
    );
  }
  // rule: inside a card the divider goes on top, so the last entry does not double the card's border.
  const entryHtml = (e: ReportEntry, layout: ReportSection["layout"], rule: "top" | "bottom" = "bottom") => {
    if (layout === "block") {
      const status = badge(e.tone, e.status);
      return [
        `<div style="margin:0 0 12px;padding:16px 18px;background:${C.card};border:1px solid ${C.line};border-left:3px solid ${C.accent};border-radius:10px">`,
        ...(status ? [`<div style="margin-bottom:8px">${status}</div>`] : []),
        `<div style="margin-bottom:6px;font-size:17px;font-weight:bold;letter-spacing:-.01em;line-height:1.5;color:${C.ink}">${esc(e.title)}</div>`,
        `<div style="line-height:1.85;color:${C.body}">${withLinks(e)}</div>`,
        ...e.quotes.map(
          (q) =>
            `<div style="margin-top:10px;padding:10px 12px;background:${C.paper};border:1px solid ${C.line};border-radius:8px;font-size:13px;line-height:1.7;color:${C.body}"><div style="margin-bottom:2px;font-size:11px;font-weight:bold;letter-spacing:.06em;color:${C.accent}">${esc(q.author)}</div>${esc(q.text)}</div>`,
        ),
        `</div>`,
      ].join("");
    }
    return [
      `<div style="padding:12px 0;border-${rule}:1px dashed ${C.dash}">`,
      `<div style="font-weight:bold;line-height:1.6;color:${C.ink}">${badge(e.tone, e.status)}${esc(e.title)}</div>`,
      `<div style="margin-top:2px;line-height:1.8;color:${C.body}">${withLinks(e)}</div>`,
      `</div>`,
    ].join("");
  };
  // Status counts in the order the badges read, for a folded card without its own preview.
  const statusCounts = (entries: ReportEntry[]) =>
    (Object.keys(TONE) as Status[]).flatMap((tone) => {
      const hit = entries.filter((e) => e.tone === tone);
      return hit.length ? [badge(tone, `${hit[0]!.status} ${hit.length}`)] : [];
    }).join("");
  // Folded cards after the closing: an appendix. The summary keeps one preview line so the card says
  // what is inside before it is opened. Muted summary color greys the native marker; the title stays ink.
  // Gmail drops <details>/<summary> with their styles and shows everything open, so the card box and
  // spacing live on a wrapping <div>.
  const section = ({ heading, layout, entries, collapsed, preview }: ReportSection) => {
    if (collapsed) {
      const gap = body.at(-1) === "</div></details></div>" ? 20 : 52;
      const line = preview ? esc(preview) : statusCounts(entries);
      body.push(
        `<div style="margin:${gap}px 0 0;padding:14px 18px;background:${C.card};border:1px solid ${C.line};border-radius:10px">`,
        `<details>`,
        `<summary style="cursor:pointer;line-height:1.5;color:${C.muted};list-style-position:inside">`,
        `<span style="font-size:14px;font-weight:bold;color:${C.ink}">${headingHtml(heading, 22)}</span><span style="margin-left:8px;font-family:${MONO};font-size:12px;color:${C.muted}">${entries.length}</span>`,
        line ? `<div style="margin:6px 0 0 30px;font-size:12px;line-height:1.6;color:${C.muted}">${line}</div>` : "",
        `</summary>`,
        `<div style="margin-top:14px">`,
        ...entries.map((e) => entryHtml(e, layout, "top")),
        `</div></details></div>`,
      );
      return;
    }
    body.push(h2(heading));
    for (const e of entries) body.push(entryHtml(e, layout));
  };
  view.sections.filter((s) => !s.collapsed).forEach(section);
  // The closing is the one dark block, like a takeaway; folded others come after it.
  if (view.closing) {
    body.push(
      `<div style="margin:52px 0 0;padding:20px 22px;background:${C.ink};border-radius:10px">`,
      `<div style="margin-bottom:6px;font-size:11px;font-weight:bold;letter-spacing:.12em;color:#8FD3CB">${headingHtml(view.closing.heading, 22)}</div>`,
      `<div style="font-size:15px;line-height:1.85;color:${C.paper}">${esc(view.closing.text)}</div>`,
      `</div>`,
    );
  }
  view.sections.filter((s) => s.collapsed).forEach(section);
  if (view.members) section(view.members);
  return [
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>`,
    `<body style="margin:0;background:${C.paper}">`,
    `<div style="max-width:640px;margin:0 auto;padding:36px 16px 48px;font-family:${FONT};font-size:14px;color:${C.ink}">`,
    ...body,
    `</div></body></html>`,
  ].join("\n");
}

export function renderDailyReport(core: DailyCoreJson, draft?: ReportDraft) {
  const view = reportView(core, draft);
  return { subject: `${view.title} ${view.date}`, markdown: markdown(view), html: html(view) };
}
