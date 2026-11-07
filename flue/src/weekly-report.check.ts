// Run: npx tsx flue/src/weekly-report.check.ts
import assert from "node:assert/strict";
import { renderWeeklyReport, weeklyBodyProblems, weeklyReportProblems } from "./weekly-report.ts";
import type { WeeklyInput } from "./weekly-input.ts";

const week: WeeklyInput = {
  target_id: "t",
  from: "2026-11-02",
  to: "2026-11-04",
  language: "ja",
  target_display_name: "Team",
  days: [
    {
      date: "2026-11-02",
      core: {
        daily_core_id: "d",
        generation_id: "g",
        generation_no: 1,
        quality_status: "ready",
        highlights: [
          { item_key: "a", title: "Alpha", summary: "did alpha", status: "completed", importance: 1 },
          { item_key: "b", title: null, summary: "no title", status: "blocked", importance: 0.8 },
        ],
        metrics: [],
      },
    },
    { date: "2026-11-03", core: { daily_core_id: "e", generation_id: "h", generation_no: 1, quality_status: "ready", highlights: [], metrics: [] } },
    { date: "2026-11-04", core: null },
  ],
  metrics: [{ key: "slack_message_count", value: 12 }],
  unsummed: [{ key: "active_member_count", by_day: [{ date: "2026-11-02", value: 3 }] }],
  extra_metric_keys: [],
};

const rendered = renderWeeklyReport(week);
assert.deepEqual(weeklyReportProblems(week, rendered.view), []);
assert.match(rendered.markdown, /Team Weekly Report/);
assert.match(rendered.markdown, /Slack メッセージ \| 12/);
assert.match(rendered.markdown, /完了 · Alpha/);
assert.match(rendered.markdown, /#### ブロック · b/);
assert.match(rendered.markdown, /注目の動きはありません/);
assert.match(rendered.markdown, /この日のコアはありません/);
assert.match(rendered.html, /Alpha/);
assert.equal(rendered.view.days[2]?.note !== null, true);
assert.equal(rendered.view.movements, null);

const grouped = renderWeeklyReport(week, [{ ids: ["2026-11-02#2"] }, { ids: ["2026-11-02#1"] }]);
assert.deepEqual(weeklyBodyProblems(week, [{ ids: ["2026-11-02#2"] }, { ids: ["2026-11-02#1"] }], grouped.view), []);
assert.deepEqual(
  grouped.view.movements?.map((item) => item.title),
  ["Alpha", "b"],
);
assert.equal(grouped.view.showDays, false);
assert.doesNotMatch(grouped.markdown, /まだ開いていること/);
assert.doesNotMatch(grouped.markdown, /日付別の注目/);
assert.doesNotMatch(grouped.html, /<details>/);

console.log("weekly-report.check ok");
