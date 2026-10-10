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
import { Structuring, structuringProblems } from "../daily-core.ts";

export const CORE_STRUCTURER_PROMPT_VERSION = "core-structurer-v1";

const SUBMIT = "submit_daily_core";

const InitialData = v.object({
  coreRefs: v.record(v.string(), v.array(v.string())),
  authors: v.record(v.string(), v.string()),
  people: v.array(v.string()),
  language: v.string(),
  model: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function CoreStructurer() {
  const { language, model, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel: "low" });
  const write = useDataWriter("structuring", { schema: Structuring });

  useTool({
    name: SUBMIT,
    description: "Submit the finished Daily Core. Call exactly once. Errors list what to fix.",
    input: Structuring,
    run({ data }) {
      const problems = structuringProblems(data, evidence);
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the Daily Core. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `You build a Daily Core: the structured record of one team's activity on one local day.
The day was already read and merged into core items, one per event. You decide where each goes.

Input JSON: people (everyone who wrote that day), overview_candidate, and core_items with
concept_key, title, summary, importance (1-5), roles (candidate placements), status, progress,
and members (people who did the work).

Rules:
- Every entry lists core_item_ids: the concept_key values it is built from.
  Write title and summary only from those core items. Never add facts.
- Put each core item in at most one entry of highlights, topics, or progress_roadmap.
  Never repeat a core item across or within these arrays.
  - highlights: the 3-5 most important outcomes or decisions of the day.
  - topics: discussions and themes (at most 8).
  - progress_roadmap: concrete work moving forward, such as tickets, PRs, and releases, with status.
  - Closely related core items may share one entry. Unimportant ones may be left out.
- member_activity: one entry per person who appears in members of some core item,
  summarizing what they did. The title is only the person's name, exactly as in people.
  Its core_item_ids are the core items listing that person in members; they may also appear in the arrays above.
- overview.summary: 2-4 sentences, refined from overview_candidate.
- item_key: kebab-case, unique within its array.
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

CoreStructurer.initialData = InitialData;
