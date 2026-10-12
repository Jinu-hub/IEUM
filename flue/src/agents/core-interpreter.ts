"use agent";

import {
  useAgentFinish,
  useDataWriter,
  useInitialData,
  useModel,
  usePersistentState,
  useResponseFinish,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";
import {
  applyRevision,
  dropUnwrittenActors,
  Interpretation,
  interpretationProblems,
  interpretationReview,
  normalizeConceptKeys,
  Revision,
} from "../daily-core.ts";
import { type AgentPrompt, ThinkingLevel } from "../prompts.ts";

// v6: asks for progress.next_step (v5 left it empty on every item; the report uses it).
// v7: next_step is a required top-level field; v6 still left progress null on every item (run 22).
// v8: null is the normal next_step. v7 said "set on every item" and got guesses such as
// "continue if needed (owner not stated)" (run 23).
// v9: written for usefulness to a reader. On gpt-6-luna, v8 (interpreter test v1) kept importance at 3 or
// less with no highlight role, wrote an overview without names or tickets, split child tickets into their
// own items, and still wrote "担当・時期の記載なし" in next_step.
// v10: v9 (test v2) wrote "記載なし" notes 10 times per run (the quoted example primed it, and the summary
// asked for what is left even when nothing was written), gave 8-9 highlights, and one run left out
// matters such as a release request. Positive wording for missing details, highlight cap, coverage first.
// v11: the schema drops tags, classifications, entities, confidence. v10 (test v3) left out the last input
// section (#dev_lead) in both runs, split one person's untracked tasks into one item each, and after a
// rejection resubmitted fewer items. Read to the end, one item per person, resend every item.
// v12: rewritten around work threads instead of tickets (user; tests v11 and v12 ran it still named v11).
// Test v12 split one assignment conversation into three items, retold one message's part in two items,
// cited lines its summary left out, and inferred "continue event preparation" as a next step.
// Not a prompt version: from test v6 a submission with uncited lines or duplicate candidates is answered with
// them, and the model sends only changed items through revise_interpretation (instructions unchanged).
export const CORE_INTERPRETER_PROMPT: AgentPrompt = {
  agentKey: "core-interpreter",
  version: "core-interpreter-v12",
  model: "openai/gpt-6-luna",
  thinkingLevel: "low",
  instructions: `
You turn one team's activity on one local day into a useful daily memory.

A reader should be able to answer:
- What work moved forward or finished?
- What was decided, requested, assigned, or changed?
- What is waiting, blocked, or due next?
- What affected the team's ability to work or review?

The input contains Slack messages and repository events grouped by source.
Each line has a source_ref. Replies appear under their thread parent.
Older lines marked "(context, YYYY-MM-DD)" explain today's replies but are
not today's activity. Bot notifications provide context; they do not by
themselves prove that a person performed work.

## Identify matters

Create one core item for each meaningful work thread.

A work thread is an ongoing goal, problem, request, decision, or piece of
work whose developments belong together. It can have a ticket, several
tickets, a PR, a project name, or no identifier at all.

Use the substance of the work to decide its boundary:
- Merge messages across channels, reports, and repositories when they
  describe the same work and its subsequent developments.
- Keep different requests or changes separate even when they share a
  ticket, screen, person, or Slack thread.
- Do not create a second item merely because a PR and a ticket both name
  the same work.
- A conversation that settles one question, such as who takes which work
  next, is one item even when it names several pieces of work. Those pieces
  get their own items only for their own developments.
- When one message covers several matters, tell each part in its own item.
  Do not retell a part that another item tells.
- Do not fold work that has its own item into a person's "daily tasks" item.
  Tasks a person lists in a daily plan or report that belong to no other
  item (meetings, event preparation, inquiries) form one item for that person.

A ticket or PR number helps identify a matter. It does not define the
matter or determine its importance.

## Decide what to preserve

Preserve developments that help someone understand or continue the work:
- an outcome, implementation, review, release, or concrete progress;
- a decision or change in priority, scope, responsibility, or schedule;
- a request that requires a response or action;
- a dependency, blocker, awaited answer, or deadline;
- a material question and the answer reached that day.

Include useful work without ticket numbers by the same standard.
Small work counts: each task someone reports on (done, in progress, next)
belongs to an item, even at importance 1.

## Cover the day

Every request, question, answer, decision, plan, and progress report a
person wrote is cited by some item. Only greetings, thanks, and
acknowledgements may stay uncited. Coverage comes before long summaries:
on a busy day, write shorter summaries rather than leave work out.
Every name in "People who wrote today" is an actor of at least one item.

Read every source section through its end. Give later sections the same
attention as earlier ones.

## Write each item

title:
  State the matter and today's development. Do not merely repeat a ticket
  title, commit message, or "work was done."

summary:
  Explain what happened, why it matters to the work, and what remains
  relevant. Include a decision, dependency, request, or timing when it
  changes what someone should understand or do next.
  Use 1-3 informative sentences. Prefer specific information over a long
  list of messages.
  Every cited line contributes to the summary: a request, answer, plan, or
  progress it reports. Do not cite a line the summary does not use.

concept_key:
  Use a short, unique key for the work thread. A ticket or PR number may
  appear in the key when it identifies the whole matter. Otherwise use
  its subject, such as "millviv3-subtitles".
  Never create two keys for the same matter.

evidence_refs:
  Cite the lines that support the item's substantive developments.
  Cite at least one line written by a person on this day.
  Context lines and bot notifications may support interpretation but
  cannot be the sole evidence for an item.

actors:
  Include people who actually contributed to the cited work or discussion.
  Use names exactly as they appear in the input. Someone merely mentioned
  or assigned future work is not automatically an actor.

status and progress:
  Describe the state of this matter only when the input establishes it.
  A request, a review, and a completed implementation are different states.

next_step:
  Record a stated next action or deadline that remains relevant after
  today's developments. Keep it null when none is stated.
  A person must have written it. Do not infer that today's work continues.
  Do not turn a completed instruction or a general intention into a
  fabricated next action.

importance:
  Rank the practical value of knowing this matter today, from 1 to 5.
  5 = changes the team's plan or needs action today: a priority or
      assignment decision, a same-day request such as a release, a blocker,
      a deadline at risk.
  4 = work finished or handed to review, a spec change, new work handed
      to someone.
  3 = concrete progress on ongoing work.
  2 = routine status with little new.
  1 = small notices.
  Decisions, dependencies, deadlines, and requests can be more important
  than a completed commit. Do not force any number of high-importance items.

roles:
  Suggest highlight for the 2 to 5 items a reader should notice first,
  chosen from importance 4 and 5,
  topic for a discussion, decision, request, or dependency,
  and progress for concrete work or a state change.
  These are candidate roles; an item may have several.

## Summarize the day

overview_candidate.summary should explain the day's main work and how
the developments connect. Mention shared dependencies, changes in plan,
or constraints affecting several people when present.
Do not build it by listing item titles.

Use only information supported by the input. Keep uncertainty the input
itself states. Never write that something is not written, recorded,
unknown, or unclear; leave it out. Write human-readable text in the requested
language and submit the complete structured result.
`,
};

const SUBMIT = "submit_interpretation";
const REVISE = "revise_interpretation";

const ReviewNote = v.object({
  uncited: v.array(v.string()),
  pairs: v.array(v.string()),
  upserted: v.optional(v.array(v.string())),
  removed: v.optional(v.array(v.string())),
  overviewRewritten: v.optional(v.boolean()),
});

// Uncited lines come with their author and opening text: with ids alone the model skipped some of 16,
// including a same-day release request (test v8-r2, S055).
const reviewRequest = (
  { uncited, pairs }: { uncited: string[]; pairs: string[] },
  { authors, texts }: { authors: Record<string, string>; texts: Record<string, string> },
) =>
  [
    "Submission received. Code found:",
    ...(uncited.length
      ? [
          "- Lines a person wrote that no item cites:",
          ...uncited.map((ref) => `  - [${ref}] ${authors[ref] ?? "?"}: ${(texts[ref] ?? "").slice(0, 80)}`),
        ]
      : []),
    ...(pairs.length ? ["- Items that may be one matter:", ...pairs.map((pair) => `  - ${pair}`)] : []),
    `Call ${REVISE} once with only the items that change:`,
    "- An uncited request, answer, plan, or progress report: add its ref to the item for its matter",
    "  (resend that item in full in upsert), or add a new item. Leave greetings and acknowledgements uncited.",
    "- A pair that describes the same work: rewrite the kept item in full in upsert, merging refs, actors,",
    "  and summary, and put the other key in remove. Leave pairs that are different work as they are.",
    "- If a new or merged item belongs in the overview (importance 4 or 5), send the whole overview rewritten.",
    "If nothing needs to change, call it with empty arrays.",
  ].join("\n");

const InitialData = v.object({
  refs: v.array(v.string()),
  contextRefs: v.array(v.string()),
  botRefs: v.array(v.string()),
  authors: v.record(v.string(), v.string()),
  texts: v.record(v.string(), v.string()),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function CoreInterpreter() {
  const { language, model, thinkingLevel, instructions, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("interpretation", { schema: Interpretation });
  const writeDroppedActors = useDataWriter("droppedActors", { schema: v.array(v.string()) });
  const writeReview = useDataWriter("review", { schema: ReviewNote });
  // Renders start fresh every turn, so the first submission waits for its revision in persistent state.
  const [draft, setDraft] = usePersistentState<Interpretation | null>("draft", null);
  const [nudged, setNudged] = usePersistentState("reviseNudged", false);

  // Checks keys before normalizing, so a key the model used twice is still rejected.
  const accept = (data: Interpretation) => {
    const problems = interpretationProblems(data, evidence);
    if (problems.length) throw new Error(problems.join("\n"));
    const { output, dropped } = dropUnwrittenActors(normalizeConceptKeys(data), evidence.authors);
    write(output);
    writeDroppedActors(dropped);
    return output;
  };

  useTool({
    name: SUBMIT,
    description: "Submit the interpreted core items. Call exactly once. Errors list what to fix.",
    input: Interpretation,
    run({ data }) {
      // Written now so the first submission stands if the revision never comes.
      const output = accept(data);
      const review = interpretationReview(output, evidence);
      writeReview(review);
      if (!review.uncited.length && !review.pairs.length) return { output: "accepted", terminate: true };
      setDraft(output);
      return { output: reviewRequest(review, evidence) };
    },
  });

  useTool({
    name: REVISE,
    description: `Change the items accepted by ${SUBMIT}: send only new or changed items. Call once.`,
    input: Revision,
    run({ data }) {
      if (!draft) throw new Error(`Call ${SUBMIT} first.`);
      accept(applyRevision(draft, data));
      writeReview({
        ...interpretationReview(draft, evidence),
        upserted: data.upsert.map((item) => item.concept_key),
        removed: data.remove,
        overviewRewritten: !!data.overview,
      });
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    const done = (tool: string) => response.toolCalls.some((call) => call.tool === tool && !call.isError);
    if (done(REVISE)) return;
    if (!done(SUBMIT)) {
      append({
        kind: "signal",
        type: "missing_submission",
        body: `Call ${SUBMIT} with the core items. Do not answer in plain text.`,
      });
    } else if (draft && !nudged) {
      // One reminder only; after that the first submission stands.
      setNudged(true);
      append({ kind: "signal", type: "missing_revision", body: `Call ${REVISE} once. Do not answer in plain text.` });
    }
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.
- If ${SUBMIT} answers with lines no item cites or items that may be one matter, call ${REVISE} once.`;
}

CoreInterpreter.initialData = InitialData;
