// Run: npx tsx flue/src/weekly-input.check.ts
import assert from "node:assert/strict";
import { assembleWeeklyInput, eachDate, weeklyInputProblems } from "./weekly-input.ts";

const core = (date: string, no: number | null, id = date) => ({
  daily_core_id: id,
  core_date: date,
  current_generation_no: no,
  quality_status: "ready",
  language: "ja",
  target_display_name: "Team",
});
const generation = (id: string, no: number, gid = `g-${id}`) => ({
  generation_id: gid,
  daily_core_id: id,
  generation_no: no,
  quality_status: "ready" as string | null,
});
const highlight = (gid: string, key: string, importance: number | null = 1) => ({
  generation_id: gid,
  item_type: "highlight",
  item_key: key,
  title: key,
  summary: key,
  status: "completed",
  importance,
});
const metric = (gid: string, key: string, value: number, hint = "sum", source: string | null = "#dev") => ({
  generation_id: gid,
  metric_key: key,
  metric_value: value,
  rollup_hint: hint,
  dimensions_json: source ? { source_ident: source } : {},
});

assert.deepEqual(eachDate("2026-10-30", "2026-11-02"), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);

const week = assembleWeeklyInput(
  "t",
  "2026-10-06",
  "2026-10-08",
  [core("2026-10-06", 2), core("2026-10-08", null), { ...core("2026-10-07", 1, "d7"), quality_status: "empty" }],
  [generation("2026-10-06", 2), generation("2026-10-06", 1, "old"), generation("d7", 1, "g7")],
  [
    highlight("g-2026-10-06", "b", 0.4),
    highlight("g-2026-10-06", "a", 0.9),
    highlight("old", "stale"),
    { ...highlight("g-2026-10-06", "topic"), item_type: "topic" },
    highlight("g7", "none"),
  ],
  [
    metric("g-2026-10-06", "slack_message_count", 3, "sum", "#a"),
    metric("g-2026-10-06", "slack_message_count", 2, "sum", "#b"),
    metric("g7", "slack_message_count", 4),
    metric("g-2026-10-06", "active_member_count", 5, "none", null),
    metric("g7", "active_member_count", 1, "none", null),
    metric("old", "github_commit_count", 9),
    metric("g-2026-10-06", "github_release_count", 1),
  ],
);

assert.deepEqual(
  week.days.map((day) => [day.date, day.core?.generation_id ?? null, day.core?.highlights.map((item) => item.item_key) ?? null]),
  [
    ["2026-10-06", "g-2026-10-06", ["a", "b"]],
    ["2026-10-07", "g7", ["none"]],
    ["2026-10-08", null, null],
  ],
);
assert.equal(week.days[1].core?.quality_status, "ready");
assert.deepEqual(week.metrics, [{ key: "slack_message_count", value: 9 }]);
assert.deepEqual(week.unsummed, [
  { key: "active_member_count", by_day: [{ date: "2026-10-06", value: 5 }, { date: "2026-10-07", value: 1 }] },
]);
assert.deepEqual(week.extra_metric_keys, ["github_release_count"]);
assert.deepEqual(weeklyInputProblems(week), ["metric outside daily six: github_release_count"]);

const over = assembleWeeklyInput(
  "t",
  "2026-10-06",
  "2026-10-06",
  [core("2026-10-06", 1)],
  [generation("2026-10-06", 1)],
  ["a", "b", "c", "d", "e", "f"].map((key) => highlight("g-2026-10-06", key)),
  [],
);
assert.deepEqual(weeklyInputProblems(over), ["2026-10-06: highlights 6 > 5"]);
assert.equal(over.target_display_name, "Team");
assert.equal(over.language, "ja");

console.log("weekly-input.check ok");
