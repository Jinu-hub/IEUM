"use agent";

import {
  useAgentFinish,
  useDataWriter,
  useInitialData,
  useModel,
  useResponseFinish,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";
import { dropUnwrittenActors, Interpretation, interpretationProblems } from "../daily-core.ts";

export const CORE_INTERPRETER_PROMPT_VERSION = "core-interpreter-v4";

const SUBMIT = "submit_interpretation";

const InitialData = v.object({
  refs: v.array(v.string()),
  contextRefs: v.array(v.string()),
  botRefs: v.array(v.string()),
  authors: v.record(v.string(), v.string()),
  language: v.string(),
  model: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function CoreInterpreter() {
  const { language, model, ...evidence }: InitialData = useInitialData();
  useModel(model);
  const write = useDataWriter("interpretation", { schema: Interpretation });
  const writeDroppedActors = useDataWriter("droppedActors", { schema: v.array(v.string()) });

  useTool({
    name: SUBMIT,
    description: "Submit the interpreted core items. Call exactly once. Errors list what to fix.",
    input: Interpretation,
    run({ data }) {
      const problems = interpretationProblems(data, evidence);
      if (problems.length) throw new Error(problems.join("\n"));
      const { output, dropped } = dropUnwrittenActors(data, evidence.authors);
      write(output);
      writeDroppedActors(dropped);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the core items. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `You read one team's activity on one local day and turn it into core items: one item per event.
A later step decides which items become highlights, topics, or progress, so here you only find and merge events.

Input: messages and repository events grouped by source. Each line is
[source_ref] HH:MM author (kind): text
Replies are indented under their thread parent with "↳".
Lines marked "(context, YYYY-MM-DD)" are older thread parents shown only to explain replies.
They did not happen on this day.
Lines marked "(bot notification)" are posted by integrations such as Redmine.
A name inside such a line (e.g. "X updated #123") is not the author, and is often not a team member.
They only show that a ticket changed that day, not what changed.

Rules:
- Use only facts in the input. Never invent names, numbers, or outcomes.
- One core item is one event or matter: a ticket, PR, request, decision, problem, or plan.
  Merge every line about the same matter into one item, across channels, threads, and repositories
  (e.g. Slack discussion of #23163 and the commit for #23163 are one item).
  Do not split one matter into several items. Do not put unrelated matters into one item.
- concept_key: kebab-case and unique. Use the ticket or PR number when there is one (ticket-23163, pr-555).
- evidence_refs: source_ref ids from the input. Each item must cite at least one ref that is not a context line.
- actors: who did the work. A member actor must be the author of at least one cited line, with the name exactly as written in the input.
  People who are only mentioned or asked by others go in the summary, not in actors.
- Bot notifications are supporting evidence only. Every item must cite at least one line a person wrote on this day;
  a ticket that only appears in bot notifications is not an item.
- importance: 1 to 5. 5 = the most important outcomes or decisions of the day.
- roles: candidate placements. highlight = key outcome or decision, topic = discussion or theme,
  progress = concrete work moving forward with a status. An item may have several.
- status and progress (from, to, next_step) only when the input states them.
- Cover the day: every line with a fact should belong to some item. Greetings and acknowledgements can be left out.
- overview_candidate.summary: 2-4 sentences about the whole day.
- If the day has no meaningful activity, return no items and say so in the overview.
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

CoreInterpreter.initialData = InitialData;
