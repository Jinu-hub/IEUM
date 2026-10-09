// Run: npx tsx flue/src/daily-core.check.ts
import assert from "node:assert/strict";
import { buildAgentInput, type DailyCoreOutput, evidenceProblems, type SourceItem } from "./daily-core.ts";

const item = (ref: string, id: string, at: string, content: string, extra: Partial<SourceItem> = {}) => ({
  source_ref: ref,
  source_type: "slack_channel",
  source_ident: "#dev",
  source_item_id: id,
  occurred_at: at,
  author: { id: "U1", name: "Aki" },
  content,
  ...extra,
});
const commit = (ref: string, login: string, name: string) =>
  item(ref, ref, "2026-10-09T06:00:00Z", "fix", {
    source_type: "github_repo",
    source_ident: "LEAD",
    author: { id: login, name },
    meta: { kind: "commit" },
  });

const input = buildAgentInput(
  [
    {
      source_type: "slack_channel",
      source_ident: "#dev",
      collection_status: "success",
      normalized_json: [
        item("S001", "1.0", "2026-10-07T01:00:00Z", "old parent", {
          author: { id: "U9", name: "Old" },
          meta: { context_only: true },
        }),
        item("S002", "2.0", "2026-10-09T01:00:00Z", "", { meta: { kind: "app" } }),
        item("S003", "3.0", "2026-10-09T02:00:00Z", "reply to old", { thread_ref: "1.0" }),
        item("S004", "4.0", "2026-10-09T03:00:00Z", "standalone", { author: { id: "U2", name: "Jinu Son" } }),
        item("S005", "5.0", "2026-10-09T04:00:00Z", "", { thread_ref: "4.0" }),
        item("S006", "6.0", "2026-10-09T05:00:00Z", "[LEAD] Bo updated #12", { author: { name: "redmine" } }),
        item("S009", "9.0", "2026-10-09T05:30:00Z", "Reminder", { author: { id: "USLACKBOT", name: "Slackbot" } }),
      ],
    },
    {
      source_type: "github_repo",
      source_ident: "LEAD",
      collection_status: "success",
      normalized_json: [commit("S007", "jinuSon", "Jinwoo Song"), commit("S008", "takamune-dsl", "takamune-dsl")],
    },
    { source_type: "github_repo", source_ident: "EMPTY", collection_status: "empty", normalized_json: [] },
  ],
  "Asia/Tokyo",
);

assert.deepEqual(input.refs, ["S001", "S003", "S004", "S006", "S009", "S007", "S008"]);
assert.deepEqual(input.contextRefs, ["S001"]);
assert.deepEqual(input.botRefs, ["S006", "S009"]);
assert.deepEqual(input.people, ["Aki", "Jinu Son", "takamune-dsl"]);
assert.deepEqual(input.counts, { total: 9, included: 7, dropped: 2, context: 1, bot: 2, people: 3 });
assert.match(input.text, /\[S001\] \(context, 2026-10-07\) Old: old parent\n {2}↳ \[S003\] 11:00 Aki: reply to old/);
assert.match(input.text, /\[S006\] 14:00 redmine \(bot notification\): \[LEAD\] Bo updated #12/);
assert.match(input.text, /\[S007\] 15:00 Jinu Son \(commit\): fix/);
assert.match(input.text, /\(no activity: empty\)/);

const core = (
  refs: string[],
  section: "highlights" | "member_activity" = "highlights",
  title = "Aki",
): DailyCoreOutput => ({
  overview: { summary: "", key_points: [] },
  highlights: [],
  topics: [],
  progress_roadmap: [],
  member_activity: [],
  [section]: [
    {
      item_key: "x",
      title,
      summary: "",
      tags: [],
      classifications: { primary: "", secondary: [] },
      entities: [],
      evidence_refs: refs,
    },
  ],
});
const problems = (output: DailyCoreOutput) => evidenceProblems(output, input);
assert.deepEqual(problems(core(["S001", "S003"])), []);
assert.match(problems(core(["S001"]))[0], /only context/);
assert.match(problems(core(["S999"]))[0], /unknown refs S999/);
assert.deepEqual(problems(core(["S006"])), []);
assert.match(problems(core(["S006"], "member_activity"))[0], /bot notifications/);
assert.deepEqual(problems(core(["S006", "S004", "S007"], "member_activity", "Jinu Son")), []);
assert.match(problems(core(["S004"], "member_activity", "Jinu Son pushed fixes"))[0], /title must be/);
assert.match(problems(core(["S006", "S004"], "member_activity", "Bo"))[0], /title must be/);

console.log("daily-core checks passed");
