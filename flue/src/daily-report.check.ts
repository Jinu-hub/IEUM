// Run: npx tsx flue/src/daily-report.check.ts
import assert from "node:assert/strict";
import * as v from "valibot";
import {
  coverageProblems,
  type DailyCoreJson,
  draftEvidence,
  draftProblems,
  draftStats,
  eventItems,
  finalizerInput,
  labelProblems,
  ReportDraft,
  renderDailyReport,
  reportView,
  revisionStats,
  withoutStrayQuotes,
  writerInput,
} from "./daily-report.ts";

type Item = DailyCoreJson["highlights"][number];
const evidence = (url: string | null) => ({
  source_type: "slack_channel",
  source_ident: "#dev",
  source_item_id: "1.0",
  occurred_at: "2026-10-09T01:00:00Z",
  url,
});
const item = (title: string, importance: number, urls: (string | null)[] = [], status: Item["status"] = null): Item => ({
  item_key: title.toLowerCase(),
  title,
  summary: `${title} summary`,
  status,
  importance,
  confidence: 1,
  tags: [],
  classifications: { primary: "", secondary: [] },
  entities: [],
  evidence: urls.map(evidence),
  payload: {},
});
const metric = (key: string, value: number, source_ident?: string) => ({
  key,
  value,
  unit: "count",
  origin: "computed" as const,
  rollup_hint: source_ident ? ("sum" as const) : ("none" as const),
  ...(source_ident ? { dimensions: { source_ident } } : {}),
});

const urls = (n: number) => Array.from({ length: n }, (_, i) => `https://slack.com/archives/C1/p${i}`);
const core = {
  schema_version: "daily-core-v1",
  meta: {
    target_id: "t",
    core_date: "2026-10-09",
    timezone: "Asia/Tokyo",
    language: "ja",
    target_display_name: "Dev <Team>",
    target_category: "development",
    window_start_at: "2026-10-08T15:00:00Z",
    window_end_at: "2026-10-09T15:00:00Z",
  },
  overview: { summary: "A & B moved." },
  highlights: [item("Low", 0.4), item("High", 1, urls(7), "completed"), item("Mid", 0.8, [null, "javascript:x", urls(1)[0], urls(1)[0]])],
  topics: [],
  progress_roadmap: [item("Unknown status", 0.6, [], "unknown")],
  member_activity: [item("Zed", 0.4), item("Aki", 1)],
  metrics: [
    metric("slack_message_count", 3, "#a"),
    metric("slack_message_count", 2, "#b"),
    metric("github_commit_count", 4, "LEAD"),
    metric("github_issue_opened_count", 0, "LEAD"),
    metric("active_member_count", 2),
  ],
  quality: { status: "ready" as const },
} as DailyCoreJson;

const view = reportView(core);
assert.equal(view.title, "Dev <Team> Daily Report");
assert.deepEqual(view.overview, { heading: "👋 今日の概要", summary: "A & B moved.", points: null });
// Empty topics are dropped; sections keep the fixed order.
assert.deepEqual(view.sections.map((s) => [s.heading, s.layout]), [["✨ 注目の動き", "block"], ["🔄 進捗と今後の予定", "list"]]);
assert.deepEqual(view.sections[0].entries.map((e) => e.title), ["High", "Mid", "Low"]);
assert.deepEqual(view.members?.entries.map((e) => e.title), ["Zed", "Aki"]);
assert.equal(view.members?.layout, "members");
assert.equal(view.closing, null);
assert.deepEqual([view.sections[0].entries[0].icon, view.sections[0].entries[0].status], ["✅", "完了"]);
assert.deepEqual([view.sections[1].entries[0].icon, view.sections[1].entries[0].status], [null, null]);
assert.equal(view.sections[0].entries[0].links.length, 3);
assert.equal(view.sections[0].entries[0].more, 4);
// Non-http and duplicate URLs are not linked.
assert.deepEqual(view.sections[0].entries[1].links, [urls(1)[0]]);
assert.deepEqual(
  view.metrics.rows.map((r) => [r.label, r.value, r.parts.length]),
  [
    ["Slack メッセージ", 5, 2],
    ["コミット", 4, 0],
    ["活動メンバー", 2, 0],
  ],
);
assert.equal(view.empty, null);

const report = renderDailyReport(core);
assert.equal(report.subject, "Dev <Team> Daily Report 2026-10-09");
assert.match(report.markdown, /^# Dev \\<Team\\> Daily Report\n\n2026-10-09\n/);
assert.match(report.markdown, /### ✅ High\n\nHigh summary \[1\]\(https:\/\/slack\.com\/archives\/C1\/p0\) .* \+4\n/);
assert.match(report.markdown, /## 🔄 進捗と今後の予定\n\n- \*\*Unknown status\*\* Unknown status summary\n/);
assert.match(report.markdown, /- \*\*Aki\*\*\n {2}Aki summary\n/);
assert.match(
  report.markdown,
  /\| 指標 \| 件数 \|\n\| --- \| ---: \|\n\| Slack メッセージ \| 5 \|\n\| └ #a \| 3 \|\n\| └ #b \| 2 \|\n\| コミット \| 4 \|\n\| 活動メンバー \| 2 \|\n/,
);
assert.equal(report.html.match(/font-size:28px/g)?.length, 3); // one KPI tile per metric
assert.ok(report.html.indexOf("font-size:28px") < report.html.indexOf("High summary")); // KPI sits above the sections
assert.ok(report.html.includes("Dev &lt;Team&gt; Daily Report"));
assert.ok(report.html.includes("A &amp; B moved."));
assert.ok(!report.html.includes("javascript:"));
assert.equal(report.html.match(/<a /g)?.length, 4);

const progress = reportView({
  ...core,
  progress_roadmap: [item("Moving", 1, [], "in_progress"), item("Stuck", 0.5, [], "blocked")],
}).sections[1].entries;
assert.deepEqual(progress.map((e) => [e.title, e.icon]), [["Stuck", "⛔"], ["Moving", "🚧"]]);

const empty = reportView({ ...core, overview: { summary: " " }, highlights: [], progress_roadmap: [], member_activity: [], quality: { status: "empty" } });
assert.equal(empty.overview, null);
assert.deepEqual(empty.sections, []);
assert.equal(empty.empty, "この日の活動はありませんでした。");
assert.equal(reportView({ ...core, meta: { ...core.meta, language: "fr" } }).overview?.heading, "👋 Overview");

// Writer draft. Ids follow importance order within each array.
const withTicket = { ...core, topics: [item("Topic #23163", 0.5, [urls(1)[0]])] } as DailyCoreJson;
assert.deepEqual(
  eventItems(withTicket).map((e) => [e.id, e.item.title]),
  [["H1", "High"], ["H2", "Mid"], ["H3", "Low"], ["P1", "Unknown status"], ["T1", "Topic #23163"]],
);
const input = JSON.parse(writerInput(withTicket));
assert.deepEqual(Object.keys(input.items[0]), [
  "id",
  "section",
  "title",
  "summary",
  "status",
  "importance",
  "owners",
  "next_steps",
  "quotes",
]);
// Old core_json has an empty payload.
assert.deepEqual([input.items[0].owners, input.items[0].next_steps, input.items[0].quotes], [[], [], []]);
const evidenceSets = draftEvidence(withTicket);
assert.deepEqual(evidenceSets, {
  ids: ["H1", "H2", "H3", "P1", "T1"],
  required: ["H1", "H2", "H3"],
  tickets: ["#23163"],
  quotes: { H1: [], H2: [], H3: [], P1: [], T1: [] },
});

type Section = ReportDraft["entries"][number]["section"];
const draft = (entries: [Section, string[], string[]?][], text = "ok", closing = "", points = [["H1"]]): ReportDraft => ({
  opening: "Opening.",
  points: points.map((item_ids, i) => ({ text: `Point ${i + 1}`, item_ids })),
  entries: entries.map(([section, item_ids, quote_ids = []], i) => ({ section, headline: `Head ${i + 1}`, text, item_ids, quote_ids })),
  closing,
});
const highlightsOnly: [Section, string[]][] = [["highlights", ["H1", "H2", "H3"]]];
assert.deepEqual(draftProblems(draft([["highlights", ["H1", "H2"]], ["highlights", ["H3", "T1"]]], "#23163 moved"), evidenceSets), []);
assert.match(draftProblems(draft([["highlights", ["H1", "H2", "H3", "X9"]]]), evidenceSets)[0], /unknown item_ids X9/);
assert.match(draftProblems(draft(highlightsOnly, "ok", "", [["Z1"]]), evidenceSets)[0], /unknown item_ids Z1/);
// An entry may merge items from other sections but must cite one of its own.
assert.deepEqual(draftProblems(draft([...highlightsOnly, ["topics", ["T1", "P1"]]]), evidenceSets), []);
assert.match(
  draftProblems(draft([...highlightsOnly, ["topics", ["P1"]]]), evidenceSets)[0],
  /entries citing no item of their section: "Head 2" \(topics\)/,
);
assert.match(draftProblems(draft([["highlights", ["H1"]]]), evidenceSets)[0], /highlights not covered: H2, H3/);
// Points do not count as covering a highlight.
assert.match(draftProblems(draft([["highlights", ["H1", "H2"]]], "ok", "", [["H3"]]), evidenceSets)[0], /highlights not covered: H3/);
assert.match(draftProblems(draft(highlightsOnly, "#99999 done"), evidenceSets)[0], /ticket numbers not in the input: #99999/);
assert.equal(v.safeParse(ReportDraft, draft(highlightsOnly, "ok", "", [["H1"], ["H2"], ["H3"], ["T1"]])).success, false);
assert.equal(v.safeParse(ReportDraft, draft(highlightsOnly, "ok", "", [])).success, false);
assert.deepEqual(draftStats(draft(highlightsOnly), evidenceSets), {
  items: 5,
  items_used: 3,
  unused: ["P1", "T1"],
  points: 1,
  entries: { highlights: 1, progress_roadmap: 0, topics: 0 },
  quotes: 0,
  chars: "Opening.\nPoint 1\nHead 1\nok\n".length,
});

// Quotes: lines people wrote, longest 3 in time order, without bots, repeats, too short or too long
// lines, or status forms.
const said = (author: string | null, excerpt: string, at: string) => ({ ...evidence(null), occurred_at: at, author, excerpt });
const quotedItem = {
  ...item("Quoted", 2, [], "completed"),
  evidence: [
    said("Aki", "thanks!", "2026-10-09T01:00:00Z"),
    said("Bo", "the longest line of all #4242", "2026-10-09T03:00:00Z"),
    said(null, "a bot notification that is long", "2026-10-09T02:00:00Z"),
    said("Aki", "a fairly long line", "2026-10-09T04:00:00Z"),
    said("Bo", "the longest line of all #4242", "2026-10-09T05:00:00Z"),
    said("Cy", "a mid-size line", "2026-10-09T00:30:00Z"),
    said("Cy", "x".repeat(121), "2026-10-09T06:00:00Z"),
    said("Dee", "【本日の作業予定】 #4242 →開発", "2026-10-09T07:00:00Z"),
    said("Dee", "today: ・No.1 done ・No.2 in progress", "2026-10-09T07:30:00Z"),
    said("Eve", "a short note, but enough", "2026-10-09T08:00:00Z"),
  ],
  payload: { owners: ["Aki", "Bo"], next_steps: ["release #5151 on Monday"] },
} as Item;
const withQuotes = { ...withTicket, highlights: [...withTicket.highlights, quotedItem] } as DailyCoreJson;
const quotedInput = JSON.parse(writerInput(withQuotes)).items[0];
assert.deepEqual(quotedInput.quotes, [
  { id: "H1.1", author: "Bo", text: "the longest line of all #4242" },
  { id: "H1.2", author: "Aki", text: "a fairly long line" },
  { id: "H1.3", author: "Eve", text: "a short note, but enough" },
]);
assert.deepEqual([quotedInput.owners, quotedInput.next_steps], [["Aki", "Bo"], ["release #5151 on Monday"]]);
const quoteSets = draftEvidence(withQuotes);
assert.deepEqual(quoteSets.quotes.H1, ["H1.1", "H1.2", "H1.3"]);
// Tickets in quotes and next steps may be written.
assert.ok(quoteSets.tickets.includes("#4242") && quoteSets.tickets.includes("#5151"));
const allHighlights: [Section, string[], string[]?] = ["highlights", ["H1", "H2", "H3", "H4"], ["H1.1"]];
assert.deepEqual(draftProblems(draft([allHighlights]), quoteSets), []);
assert.match(
  draftProblems(draft([["highlights", ["H2", "H3", "H4"], ["H1.1"]], ["highlights", ["H1"]]]), quoteSets)[0],
  /quote_ids not offered by the entry's items: H1\.1/,
);
assert.match(
  draftProblems(draft([allHighlights, ["topics", ["T1", "H1"], ["H1.1"]]]), quoteSets)[0],
  /quotes outside highlights: "Head 2"/,
);
assert.equal(v.safeParse(ReportDraft, draft([["highlights", ["H1"], ["H1.1", "H1.2", "H1.3"]]])).success, false);
const quotedView = reportView(withQuotes, draft([allHighlights]));
assert.deepEqual(quotedView.sections[0].entries[0].quotes, [{ author: "Bo", text: "the longest line of all #4242" }]);
const quotedReport = renderDailyReport(withQuotes, draft([allHighlights]));
assert.match(quotedReport.markdown, /\n> \*\*Bo\*\*: the longest line of all #4242 {2}\n/);
assert.ok(quotedReport.html.includes(">Bo</div>the longest line of all #4242"));

// Finalizer: entries may be merged, split or reordered as long as every drafted item stays.
const written = draft([["highlights", ["H1", "H2"]], ["topics", ["T1"]]], "ok", "Next.", [["H1"], ["H2"]]);
const reworded: ReportDraft = {
  ...written,
  opening: "New opening.",
  entries: written.entries.map((e) => ({ ...e, text: `${e.text}!` })),
};
assert.deepEqual(coverageProblems(written, reworded), []);
assert.deepEqual(revisionStats(written, reworded), {
  texts_before: 8,
  texts_after: 8,
  changed: 3,
  chars_before: "Opening.Point 1Point 2Head 1okHead 2okNext.".length,
  chars_after: "New opening.Point 1Point 2Head 1ok!Head 2ok!Next.".length,
});
const reshaped: ReportDraft = {
  ...reworded,
  points: reworded.points.slice(1),
  entries: [reworded.entries[1], { ...reworded.entries[0], item_ids: ["H1"] }, { ...reworded.entries[0], item_ids: ["H2"] }],
};
assert.deepEqual(coverageProblems(written, reshaped), []);
assert.equal(revisionStats(written, reshaped).texts_after, 9);
assert.deepEqual(coverageProblems(written, { ...reworded, entries: reworded.entries.slice(0, 1) }), [
  "items dropped: T1; every item the draft covers stays in some entry",
]);
const strayQuote = { ...reworded, entries: [reworded.entries[0], { ...reworded.entries[1], quote_ids: ["T1.1"] }] };
assert.deepEqual(withoutStrayQuotes(strayQuote).entries[1].quote_ids, []);
assert.deepEqual(withoutStrayQuotes({ ...reworded, entries: [{ ...reworded.entries[0], quote_ids: ["H1.1"] }] }).entries[0].quote_ids, ["H1.1"]);
assert.deepEqual(labelProblems(reworded), []);
const labeled = { ...reworded, entries: [{ ...reworded.entries[0], headline: "【進行中】#23163 done" }, reworded.entries[1]] };
assert.match(labelProblems(labeled)[0], /remove leading labels or brackets: "【進行中】#23163 done"/);
assert.equal(labelProblems({ ...reworded, points: [{ text: "[Done] x", item_ids: ["H1"] }] }).length, 1);
const finalizerPayload = JSON.parse(finalizerInput(withTicket, written));
assert.deepEqual(Object.keys(finalizerPayload), ["target", "date", "items", "draft"]);
assert.deepEqual(finalizerPayload.items, input.items);

// Draft order is ignored: entries go to the fixed sections.
const story = reportView(withTicket, draft([["topics", ["T1"]], ["highlights", ["H1", "T1"]], ["highlights", ["H2", "H3"]]], "Para", "Next."));
assert.deepEqual(story.overview, {
  heading: "👋 今日の概要",
  summary: "Opening.",
  points: { heading: "今日の要点", items: [{ icon: "✅", tone: "completed", status: "完了", text: "Point 1" }] },
});
assert.deepEqual(story.sections.map((s) => [s.heading, s.entries.map((e) => e.title)]), [
  ["✨ 注目の動き", ["Head 2", "Head 3"]],
  ["💬 議論と調整", ["Head 1"]],
]);
// Merged links: High has 7, the topic repeats High's first URL. Mixed statuses show no icon.
assert.deepEqual(story.sections[0].entries[0], {
  title: "Head 2",
  icon: null,
  tone: null,
  status: null,
  summary: "Para",
  links: urls(3),
  more: 4,
  quotes: [],
});
assert.deepEqual(story.closing, { heading: "🎯 次のフォーカス", text: "Next." });
assert.deepEqual(story.members?.entries.map((e) => e.title), ["Zed", "Aki"]);
const storyReport = renderDailyReport(withTicket, draft([["highlights", ["H1"]], ["highlights", ["H2", "H3"]]], "Para <b>", "Next."));
assert.match(
  storyReport.markdown,
  /## 👋 今日の概要\n\nOpening\.\n\n\*\*今日の要点\*\*\n- ✅ Point 1\n\n## 📊 今日の活動指標\n\n\| 指標 \| 件数 \|/,
);
assert.match(storyReport.markdown, /\n## ✨ 注目の動き\n\n### ✅ Head 1\n\nPara \\<b\\> \[1\]/);
assert.match(storyReport.markdown, /\n## 🎯 次のフォーカス\n\nNext\.\n\n## 👥 メンバー別の動き\n\n- \*\*Zed\*\*/);
assert.match(storyReport.markdown, /\n## 📊 今日の活動指標\n\n\| 指標 \| 件数 \|/);
assert.ok(storyReport.html.includes("Para &lt;b&gt;"));
assert.ok(storyReport.html.includes(">完了</span>")); // status badge in HTML
assert.ok(storyReport.html.includes("border-left:3px solid #0F6B66"));
// An empty day ignores the draft.
assert.equal(reportView({ ...withTicket, quality: { status: "empty" } }, draft(highlightsOnly)).overview?.summary, "A & B moved.");

console.log("daily-report checks passed");
