// Run: npx tsx flue/src/daily-report.check.ts
import assert from "node:assert/strict";
import { type DailyCoreJson, renderDailyReport, reportView } from "./daily-report.ts";

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
assert.deepEqual(view.overview, { heading: "今日の概要", summary: "A & B moved." });
// Empty topics are dropped; sections keep the fixed order.
assert.deepEqual(view.sections.map((s) => s.key), ["highlights", "progress_roadmap", "member_activity"]);
assert.deepEqual(view.sections[0].entries.map((e) => e.title), ["High", "Mid", "Low"]);
assert.deepEqual(view.sections[2].entries.map((e) => e.title), ["Zed", "Aki"]);
assert.equal(view.sections[0].entries[0].status, "完了");
assert.equal(view.sections[1].entries[0].status, null);
assert.equal(view.sections[0].entries[0].links.length, 5);
assert.equal(view.sections[0].entries[0].more, 2);
// Non-http and duplicate URLs are not linked.
assert.deepEqual(view.sections[0].entries[1].links, [urls(1)[0]]);
assert.deepEqual(
  view.metrics.rows.map((r) => [r.label, r.value, r.parts.length]),
  [
    ["Slack メッセージ", 5, 2],
    ["コミット", 4, 1],
    ["活動メンバー", 2, 0],
  ],
);
assert.equal(view.empty, null);

const report = renderDailyReport(core);
assert.equal(report.subject, "Dev <Team> Daily Report 2026-10-09");
assert.match(report.markdown, /^# Dev \\<Team\\> Daily Report\n\n2026-10-09\n/);
assert.match(report.markdown, /- \*\*High\*\* \(完了\)\n {2}High summary \[1\]\(https:\/\/slack\.com\/archives\/C1\/p0\) .* \+2\n/);
assert.match(report.markdown, /- Slack メッセージ: 5 \(#a 3, #b 2\)\n- コミット: 4\n/);
assert.ok(report.html.includes("Dev &lt;Team&gt; Daily Report"));
assert.ok(report.html.includes("A &amp; B moved."));
assert.ok(!report.html.includes("javascript:"));
assert.equal(report.html.match(/<a /g)?.length, 6);

const empty = reportView({ ...core, overview: { summary: " " }, highlights: [], progress_roadmap: [], member_activity: [], quality: { status: "empty" } });
assert.equal(empty.overview, null);
assert.deepEqual(empty.sections, []);
assert.equal(empty.empty, "この日の活動はありませんでした。");
assert.equal(reportView({ ...core, meta: { ...core.meta, language: "fr" } }).overview?.heading, "Overview");

console.log("daily-report checks passed");
