// Run: npx tsx flue/src/weekly-writer.check.ts
import assert from "node:assert/strict";
import { movementKey } from "./weekly-report.ts";
import { writerProblems } from "./weekly-writer.ts";
import type { WeeklyInput } from "./weekly-input.ts";

const week: WeeklyInput = {
  target_id: "t",
  from: "2026-11-02",
  to: "2026-11-02",
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
          { item_key: "a", title: "No.291", summary: "西村さんが依頼。#23243", status: "in_progress", importance: 1 },
          { item_key: "b", title: "B", summary: "Jinu Son が完了", status: "completed", importance: 0.5 },
        ],
        others: [],
        metrics: [],
      },
    },
  ],
  metrics: [{ key: "github_commit_count", value: 3 }],
  unsummed: [],
  extra_metric_keys: [],
};
const groups = [{ ids: ["2026-11-02#1"] }, { ids: ["2026-11-02#2"] }];
const id = (ids: string[]) => movementKey(ids);
const ok = {
  opening: "今週は No.291 と #23243。",
  entries: [
    { id: id(["2026-11-02#1"]), text: "西村さんが No.291 を依頼した。" },
    { id: id(["2026-11-02#2"]), text: "Jinu Son が終えた。" },
  ],
  closing: "",
};
assert.deepEqual(writerProblems(ok, week, groups), []);
assert.match(writerProblems({ ...ok, opening: "" }, week, groups).join("\n"), /opening is empty/);
assert.match(writerProblems({ ...ok, entries: ok.entries.slice(0, 1) }, week, groups).join("\n"), /movements not covered/);
assert.match(
  writerProblems({ ...ok, entries: [{ id: id(["2026-11-02#1"]), text: "No.999 を追加" }, ok.entries[1]!] }, week, groups).join("\n"),
  /ticket numbers not in the input: No\.999/,
);
assert.match(
  writerProblems({ ...ok, entries: [ok.entries[0]!, { id: id(["2026-11-02#2"]), text: "孫さんが終えた。" }] }, week, groups).join("\n"),
  /names not in the input: 孫さん/,
);

console.log("weekly-writer.check ok");
