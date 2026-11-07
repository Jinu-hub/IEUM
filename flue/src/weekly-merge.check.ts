// Run: npx tsx flue/src/weekly-merge.check.ts
import assert from "node:assert/strict";
import { mergeItems, mergeProblems } from "./weekly-merge.ts";
import type { WeeklyInput } from "./weekly-input.ts";

const items = [{ id: "2026-11-02#1" }, { id: "2026-11-02#2" }, { id: "2026-11-04#1" }];
assert.deepEqual(
  mergeProblems({ groups: [{ ids: ["2026-11-02#1", "2026-11-04#1"] }, { ids: ["2026-11-02#2"] }] }, items),
  [],
);
assert.match(mergeProblems({ groups: [{ ids: ["nope"] }] }, items).join("\n"), /unknown id nope/);
assert.match(
  mergeProblems({ groups: [{ ids: ["2026-11-02#1"] }, { ids: ["2026-11-02#1"] }] }, items).join("\n"),
  /2026-11-02#1 is in group 1 and group 2/,
);
assert.match(mergeProblems({ groups: [{ ids: ["2026-11-02#1"] }] }, items).join("\n"), /highlights not covered: 2026-11-02#2, 2026-11-04#1/);
assert.match(mergeProblems({ groups: [{ ids: [] }, { ids: ["2026-11-02#1", "2026-11-02#2", "2026-11-04#1"] }] }, items).join("\n"), /group 1 is empty/);

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
          { item_key: "a", title: "A", summary: "sa", status: "completed", importance: 1 },
          { item_key: "b", title: "B", summary: "sb", status: null, importance: 0.5 },
        ],
        metrics: [],
      },
    },
    { date: "2026-11-03", core: null },
    {
      date: "2026-11-04",
      core: {
        daily_core_id: "e",
        generation_id: "h",
        generation_no: 1,
        quality_status: "ready",
        highlights: [{ item_key: "a", title: "A2", summary: "s2", status: "in_progress", importance: 1 }],
        metrics: [],
      },
    },
  ],
  metrics: [],
  unsummed: [],
  extra_metric_keys: [],
};
assert.deepEqual(
  mergeItems(week).map((item) => [item.id, item.date, item.item_key]),
  [
    ["2026-11-02#1", "2026-11-02", "a"],
    ["2026-11-02#2", "2026-11-02", "b"],
    ["2026-11-04#1", "2026-11-04", "a"],
  ],
);

console.log("weekly-merge.check ok");
