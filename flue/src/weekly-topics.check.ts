// Run: npx tsx flue/src/weekly-topics.check.ts
import assert from "node:assert/strict";
import { assembleWeeklyInput } from "./weekly-input.ts";
import { renderWeeklyReport } from "./weekly-report.ts";
import { topicGroups, topicItems, topicsProblems } from "./weekly-topics.ts";

const row = (key: string, type: string, importance: number, primary?: string) => ({
  generation_id: "g",
  item_type: type,
  item_key: key,
  title: key,
  summary: `${key} 西村さん #23243`,
  status: "in_progress",
  importance,
  classifications_json: primary ? { primary } : null,
});
const week = assembleWeeklyInput(
  "t",
  "2026-11-02",
  "2026-11-02",
  [{ daily_core_id: "d", core_date: "2026-11-02", current_generation_no: 1, quality_status: "ready", language: "ja", target_display_name: "Team" }],
  [{ generation_id: "g", daily_core_id: "d", generation_no: 1, quality_status: "ready" }],
  [
    row("h", "highlight", 1, "bugfix"),
    row("m", "member_activity", 1, "bugfix"),
    row("t", "topic", 0.3, "bugfix"),
    row("p", "progress_roadmap", 0.9, "coordination"),
    row("r", "topic", 0.2, "release"),
    row("x", "topic", 0.1),
  ],
  [],
);
const items = topicItems(week);
assert.deepEqual(
  items.map((item) => [item.id, item.kind, item.category]),
  [
    ["2026-11-02/1", "progress", "coordination"],
    ["2026-11-02/2", "topic", "bugfix"],
    ["2026-11-02/3", "topic", "other"],
    ["2026-11-02/4", "topic", "other"],
  ],
);
assert.deepEqual(topicGroups(items).map((group) => [group.key, group.items.length]), [["bugfix", 1], ["coordination", 1], ["other", 2]]);

const ok = {
  categories: [
    { key: "bugfix", ids: ["2026-11-02/2"], text: "西村さんが #23243 を直した。" },
    { key: "coordination", ids: ["2026-11-02/1"], text: "方針が決まった。" },
    { key: "other", ids: ["2026-11-02/3"], text: "リリース準備。" },
  ],
};
assert.deepEqual(topicsProblems(ok, items), []);
const bad = (categories: typeof ok.categories) => topicsProblems({ categories }, items).join("\n");
assert.match(bad(ok.categories.slice(0, 2)), /categories not covered: other/);
assert.match(bad([...ok.categories, { key: "feature", ids: ["2026-11-02/2"], text: "a" }]), /unknown category feature/);
assert.match(bad([{ ...ok.categories[0]!, ids: ["2026-11-02/1"] }, ...ok.categories.slice(1)]), /2026-11-02\/1 is not in category bugfix/);
assert.match(bad([{ ...ok.categories[0]!, text: "孫さんが No.999 を直した。" }, ...ok.categories.slice(1)]), /No\.999[\s\S]*孫さん/);

const md = renderWeeklyReport(week, undefined, undefined, ok.categories).markdown;
assert.match(md, /## 🧭 トピック\n\n\*\*🐛 Bugfix\*\* \(1\)\n西村さんが/);
assert.ok(md.indexOf("📋 Decision") < md.indexOf("🧰 Other** (2)"));

console.log("weekly-topics.check ok");
