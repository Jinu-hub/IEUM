// Run: npx tsx flue/src/daily-core.check.ts
import assert from "node:assert/strict";
import {
  buildAgentInput,
  buildCoreJson,
  coreStats,
  type DailyCoreOutput,
  dropUnwrittenActors,
  evidenceProblems,
  type Interpretation,
  interpretationProblems,
  interpretationStats,
  resolveStructuring,
  type SourceItem,
  type Structuring,
  structurerInput,
  structuringProblems,
} from "./daily-core.ts";

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
        item("S003", "3.0", "2026-10-09T02:00:00Z", "<@U2> <@U404> <!channel> reply to old", { thread_ref: "1.0" }),
        item("S004", "4.0", "2026-10-09T03:00:00Z", "standalone", { author: { id: "U2", name: "Jinu Son" } }),
        item("S005", "5.0", "2026-10-09T04:00:00Z", "", { thread_ref: "4.0" }),
        item("S006", "6.0", "2026-10-09T05:00:00Z", "[LEAD] Bo updated #12", { author: { name: "redmine" } }),
        item("S009", "9.0", "2026-10-09T05:30:00Z", "Reminder", { author: { id: "USLACKBOT", name: "Slackbot" } }),
        item("S010", "10.0", "2026-10-09T06:00:00Z", "Progress thread", { author: { id: "USLACKBOT", name: "Slackbot" } }),
        item("S011", "11.0", "2026-10-09T06:10:00Z", "did #12", { thread_ref: "10.0" }),
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

assert.deepEqual(input.refs, ["S001", "S003", "S004", "S010", "S011", "S007", "S008"]);
assert.deepEqual(input.contextRefs, ["S001"]);
assert.deepEqual(input.botRefs, ["S010"]);
assert.deepEqual(input.people, ["Aki", "Jinu Son", "takamune-dsl"]);
assert.deepEqual(input.counts, { total: 11, included: 7, dropped: 2, bot_dropped: 2, context: 1, bot: 1, people: 3 });
assert.match(input.text, /\[S001\] \(context, 2026-10-07\) Old: old parent\n {2}↳ \[S003\] 11:00 Aki: @Jinu Son @U404 @channel reply to old/);
assert.match(input.text, /\[S010\] 15:00 Slackbot \(bot notification\): Progress thread\n {2}↳ \[S011\] 15:10 Aki: did #12/);
assert.doesNotMatch(input.text, /S006|S009/);
assert.match(input.text, /\[S007\] 15:00 Jinu Son \(commit\): fix/);
assert.match(input.text, /\(no activity: empty\)/);

const core = (
  refs: string[],
  section: "highlights" | "member_activity" = "highlights",
  title = "Aki",
): DailyCoreOutput => ({
  overview: { summary: "" },
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
assert.deepEqual(problems(core(["S010"])), []);
assert.match(problems(core(["S010"], "member_activity"))[0], /bot notifications/);
assert.deepEqual(problems(core(["S010", "S004", "S007"], "member_activity", "Jinu Son")), []);
assert.match(problems(core(["S004"], "member_activity", "Jinu Son pushed fixes"))[0], /title must be/);
assert.match(problems(core(["S010", "S004"], "member_activity", "Bo"))[0], /title must be/);

const statsOutput = core(["S003", "S004"]);
statsOutput.topics = [{ ...statsOutput.highlights[0], evidence_refs: ["S004", "S010", "S001"] }];
statsOutput.progress_roadmap = [{ ...statsOutput.highlights[0], evidence_refs: ["S010"] }];
statsOutput.member_activity = [{ ...statsOutput.highlights[0], evidence_refs: ["S007"] }];
assert.deepEqual(coreStats(statsOutput, input), {
  items: { highlights: 1, topics: 1, progress_roadmap: 1, member_activity: 1 },
  human_refs: 5,
  human_refs_cited: 3,
  human_refs_in_multiple_sections: 1,
  people: 3,
});

assert.deepEqual(input.authors, { S003: "Aki", S004: "Jinu Son", S011: "Aki", S007: "Jinu Son", S008: "takamune-dsl" });

const interpreted = (refs: string[], actors: string[], key = "ticket-12"): Interpretation["core_items"][number] => ({
  concept_key: key,
  title: "",
  summary: "",
  importance: 3,
  confidence: 0.8,
  roles: ["progress"],
  tags: [],
  classifications: { primary: "", secondary: [] },
  entities: [],
  actors: actors.map((name) => ({ type: "member" as const, name })),
  evidence_refs: refs,
});
const interpretation = (...core_items: Interpretation["core_items"]): Interpretation => ({
  overview_candidate: { summary: "" },
  core_items,
});
const iProblems = (output: Interpretation) => interpretationProblems(output, input);
assert.deepEqual(iProblems(interpretation(interpreted(["S001", "S003", "S010", "S007"], ["Aki", "Jinu Son"]))), []);
assert.match(iProblems(interpretation(interpreted(["S001"], [])))[0], /only context/);
assert.match(iProblems(interpretation(interpreted(["S999", "S003"], [])))[0], /unknown refs S999/);
assert.deepEqual(iProblems(interpretation(interpreted(["S010", "S004"], ["Jinu Son"]))), []);
assert.match(iProblems(interpretation(interpreted(["S010", "S001"], [])))[0], /only bot notifications/);
const withSystem = interpreted(["S003", "S010"], ["Aki", "Bo", "Jinu Son"]);
withSystem.actors.push({ type: "system", name: "redmine" });
const fixed = dropUnwrittenActors(interpretation(withSystem, interpreted(["S004"], ["Jinu Son"], "b")), input.authors);
assert.deepEqual(fixed.dropped, ["ticket-12: Bo", "ticket-12: Jinu Son"]);
assert.deepEqual(
  fixed.output.core_items.map((item) => item.actors.map((actor) => actor.name)),
  [["Aki", "redmine"], ["Jinu Son"]],
);
assert.match(
  iProblems(interpretation(interpreted(["S003"], []), interpreted(["S004"], [])))[0],
  /ticket-12: concept_key is used twice/,
);
assert.deepEqual(
  interpretationStats(interpretation(interpreted(["S003", "S010"], ["Aki"]), interpreted(["S004"], ["Jinu Son"], "b")), input),
  { core_items: 2, human_refs: 5, human_refs_cited: 2, people: 3, people_as_actors: 2 },
);

const coreA = {
  ...interpreted(["S003", "S010"], ["Aki"], "a"),
  importance: 4,
  tags: ["x"],
  classifications: { primary: "fix", secondary: [] },
  entities: [{ type: "ticket", name: "#12" }],
};
const coreB = {
  ...interpreted(["S004", "S007", "S011"], ["Jinu Son"], "b"),
  importance: 2,
  confidence: 0.5,
  tags: ["x", "y"],
  entities: [{ type: "ticket", name: "#12" }, { type: "pr", name: "#5" }],
};
const coreC = interpreted(["S008"], ["takamune-dsl"], "c");
const interpretedDay = interpretation(coreA, coreB, coreC);
const toStructurer = JSON.parse(structurerInput(interpretedDay, input.people));
assert.deepEqual(toStructurer.people, input.people);
assert.deepEqual(toStructurer.core_items[0].members, ["Aki"]);
assert.ok(!("evidence_refs" in toStructurer.core_items[0]));

const placed = (title: string, ids: string[], key = "k") => ({ item_key: key, title, summary: "", core_item_ids: ids });
const structuring = (parts: Partial<Structuring>): Structuring => ({
  overview: { summary: "" },
  highlights: [],
  topics: [],
  progress_roadmap: [],
  member_activity: [],
  ...parts,
});
const structuringEvidence = {
  coreRefs: Object.fromEntries(interpretedDay.core_items.map((item) => [item.concept_key, item.evidence_refs])),
  authors: input.authors,
  people: input.people,
};
const sProblems = (output: Structuring) => structuringProblems(output, structuringEvidence);
const good = structuring({
  highlights: [placed("A and B", ["a", "b"])],
  progress_roadmap: [placed("C", ["c"])],
  member_activity: [placed("Aki", ["a", "b"], "aki"), placed("Jinu Son", ["b"], "jinu")],
});
assert.deepEqual(sProblems(good), []);
assert.match(sProblems(structuring({ highlights: [placed("A", ["a"])], topics: [placed("A", ["a"])] }))[0], /a: placed 2 times \(highlights, topics\)/);
assert.match(sProblems(structuring({ topics: [placed("Z", ["z"])] }))[0], /unknown core_item_ids z/);
assert.match(sProblems(structuring({ member_activity: [placed("Bo", ["a"])] }))[0], /title must be exactly one name/);
assert.match(sProblems(structuring({ member_activity: [placed("Jinu Son", ["c"])] }))[0], /Jinu Son is not a member/);
assert.match(
  sProblems(structuring({ member_activity: [placed("Aki", ["a"], "1"), placed("Aki", ["b"], "2")] }))[0],
  /Aki has several entries/,
);

const resolved = resolveStructuring(good, interpretedDay, input.authors);
assert.deepEqual(resolved.highlights[0], {
  item_key: "k",
  title: "A and B",
  summary: "",
  status: null,
  importance: 0.8,
  confidence: 0.5,
  tags: ["x", "y"],
  classifications: { primary: "fix", secondary: [] },
  entities: [{ type: "ticket", name: "#12" }, { type: "pr", name: "#5" }],
  evidence_refs: ["S003", "S010", "S004", "S007", "S011"],
});
assert.deepEqual(resolved.member_activity.map((item) => item.evidence_refs), [["S003", "S011"], ["S004", "S007"]]);
assert.deepEqual(evidenceProblems(resolved, input), []);

const meta = {
  target_id: "t",
  core_date: "2026-10-09",
  timezone: "Asia/Tokyo",
  language: "ja",
  target_display_name: "Dev",
  target_category: "development",
  window_start_at: "2026-10-08T15:00:00Z",
  window_end_at: "2026-10-09T15:00:00Z",
};
const sources = [
  {
    source_type: "slack_channel",
    source_ident: "#dev",
    collection_status: "success",
    normalized_json: [
      item("S001", "1.0", "2026-10-07T01:00:00Z", "old", { meta: { context_only: true } }),
      item("S003", "3.0", "2026-10-09T02:00:00Z", "hi", { url: "https://slack.com/archives/C1/p30" }),
    ],
  },
  { source_type: "github_repo", source_ident: "LEAD", collection_status: "success", normalized_json: [commit("S007", "a", "A")] },
];
const json = buildCoreJson({ ...meta, workspace_id: "w" } as typeof meta, sources, core(["S001", "S003", "S999"]), ["Aki"]);
assert.deepEqual(json.meta, meta);
assert.deepEqual(json.highlights[0].evidence, [
  { source_type: "slack_channel", source_ident: "#dev", source_item_id: "1.0", occurred_at: "2026-10-07T01:00:00Z", url: null },
  {
    source_type: "slack_channel",
    source_ident: "#dev",
    source_item_id: "3.0",
    occurred_at: "2026-10-09T02:00:00Z",
    url: "https://slack.com/archives/C1/p30",
  },
]);
assert.ok(!("evidence_refs" in json.highlights[0]));
assert.deepEqual(
  json.metrics.map((m) => [m.key, m.value, "dimensions" in m ? m.dimensions.source_ident : null]),
  [
    ["slack_message_count", 1, "#dev"],
    ["github_commit_count", 1, "LEAD"],
    ["active_member_count", 1, null],
  ],
);
assert.equal(json.quality.status, "ready");
assert.equal(buildCoreJson(meta, [{ ...sources[0], normalized_json: [sources[0].normalized_json[0]] }], core(["S001"]), []).quality.status, "empty");

console.log("daily-core checks passed");
