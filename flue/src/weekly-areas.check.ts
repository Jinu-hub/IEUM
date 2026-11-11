// Run: npx tsx flue/src/weekly-areas.check.ts
import assert from "node:assert/strict";
import { areaItems, areasProblems } from "./weekly-areas.ts";
import { assembleWeeklyInput } from "./weekly-input.ts";

const row = (key: string, type: string, importance: number, entities: { type: string; name: string }[] = []) => ({
  generation_id: "g",
  item_type: type,
  item_key: key,
  title: key,
  summary: `${key} 西村さん #23243`,
  status: "in_progress",
  importance,
  entities_json: entities,
});
const week = assembleWeeklyInput(
  "t",
  "2026-11-02",
  "2026-11-02",
  [{ daily_core_id: "d", core_date: "2026-11-02", current_generation_no: 1, quality_status: "ready", language: "ja", target_display_name: "Team" }],
  [{ generation_id: "g", daily_core_id: "d", generation_no: 1, quality_status: "ready" }],
  [
    row("h", "highlight", 1, [{ type: "project", name: "LEAD" }]),
    row("m", "member_activity", 1, [{ type: "project", name: "LEAD" }]),
    row("t", "topic", 0.3, [{ type: "service", name: "MillviV3" }, { type: "ticket", name: "No.1" }]),
    row("p", "progress_roadmap", 0.9, [{ type: "component", name: "ミルビィV3" }]),
    row("x", "topic", 0.1),
  ],
  [],
);
const items = areaItems(week);
assert.deepEqual(
  items.map((item) => [item.id, item.kind, item.entities]),
  [
    ["2026-11-02/1", "progress", ["ミルビィV3"]],
    ["2026-11-02/2", "topic", ["MillviV3"]],
    ["2026-11-02/3", "topic", []],
  ],
);
assert.deepEqual(week.days[0]!.core!.highlights.map((item) => item.item_key), ["h"]);

const ok = { areas: [{ name: "MillviV3", ids: ["2026-11-02/1", "2026-11-02/2"], text: "西村さんが #23243 を進めた。" }] };
assert.deepEqual(areasProblems(ok, items), []);
const bad = (areas: typeof ok.areas) => areasProblems({ areas }, items).join("\n");
assert.match(bad([]), /no areas/);
assert.match(bad([{ ...ok.areas[0]!, name: "Millvi" }]), /not an entity of its items; pick one of: ミルビィV3, MillviV3/);
assert.match(bad([{ ...ok.areas[0]!, ids: ["2026-11-02#1"] }]), /unknown id 2026-11-02#1/);
assert.match(bad([ok.areas[0]!, { name: "MillviV3", ids: ["2026-11-02/2"], text: "a" }]), /in area 1 and area 2/);
assert.match(bad([{ ...ok.areas[0]!, text: "孫さんが No.999 を終えた。" }]), /ticket numbers not in the input: No\.999[\s\S]*names not in the input: 孫さん/);
assert.match(bad(Array.from({ length: 7 }, () => ({ name: "MillviV3", ids: [], text: "a" }))), /areas 7 > 6/);

console.log("weekly-areas.check ok");
