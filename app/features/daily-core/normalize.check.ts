// npx tsx app/features/daily-core/normalize.check.ts
import assert from "node:assert/strict";
import { fetchDaysFor, keepInWindow, missingThreadParents, normalizeSlackMessages, resolveDailyWindow } from "./normalize";

assert.deepEqual(resolveDailyWindow("2026-08-17", "Asia/Tokyo"), {
  windowStartAt: "2026-08-16T15:00:00.000Z",
  windowEndAt: "2026-08-17T15:00:00.000Z",
});
assert.deepEqual(resolveDailyWindow("2026-10-09", "Asia/Seoul"), {
  windowStartAt: "2026-10-08T15:00:00.000Z",
  windowEndAt: "2026-10-09T15:00:00.000Z",
});
// DST day is 23 hours long.
assert.deepEqual(resolveDailyWindow("2026-03-08", "America/New_York"), {
  windowStartAt: "2026-03-08T05:00:00.000Z",
  windowEndAt: "2026-03-09T04:00:00.000Z",
});

assert.equal(fetchDaysFor("2026-10-09", "Asia/Seoul", Date.parse("2026-10-09T12:58:00Z")), 1);
assert.equal(fetchDaysFor("2026-10-09", "Asia/Seoul", Date.parse("2026-10-10T01:00:00Z")), 2);

const ts = (iso: string) => String(Date.parse(iso) / 1000);
const items = normalizeSlackMessages("#dev", "C1", [
  { ts: ts("2026-10-09T15:00:00Z"), text: "end is excluded" },
  { ts: ts("2026-10-09T03:00:00Z"), text: "inside" },
  { ts: ts("2026-10-08T15:00:00Z"), text: "start is included" },
  { ts: ts("2026-10-08T14:59:59Z"), text: "before" },
]);
const kept = keepInWindow(items, "2026-10-08T15:00:00.000Z", "2026-10-09T15:00:00.000Z");
assert.deepEqual(kept.map((i) => i.content), ["start is included", "inside"]);

const thread = normalizeSlackMessages("#dev", "C1", [
  { ts: "100.0", thread_ts: "100.0", reply_count: 1, text: "root in data" },
  { ts: "101.0", thread_ts: "100.0", text: "reply to root in data" },
  { ts: "201.0", thread_ts: "50.0", text: "reply to old root" },
  { ts: "202.0", thread_ts: "50.0", text: "another reply to old root" },
  { ts: "300.0", text: "plain message" },
]);
assert.deepEqual(missingThreadParents(thread), ["50.0"]);

console.log("normalize.check ok");
