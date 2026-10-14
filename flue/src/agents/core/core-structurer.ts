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
import { Structuring, structuringProblems } from "../../daily-core.ts";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";

// v2: the Daily Core keeps every core item. v1 ("Unimportant ones may be left out", topics at most 8,
// "Closely related core items may share one entry") dropped items such as 5-5 No342 and No.77 on 10-09,
// left No.8 only in member_activity, and merged three people's daily work into one entry.
// Items it still leaves out are placed by code (placeLeftovers).
export const CORE_STRUCTURER_PROMPT: AgentPrompt = {
  agentKey: "core-structurer",
  version: "core-structurer-v2",
  model: "openai/gpt-5.4-mini",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You build a Daily Core: the structured record of one team's activity on one local day.
Later steps write the daily report and other content from it, so it keeps every piece of work.
The day was already read and merged into core items, one per event. You decide where each goes.

Input JSON: people (everyone who wrote that day), overview_candidate, and core_items with
concept_key, title, summary, importance (1-5), roles (candidate placements), status, progress,
and members (people who did the work).

Rules:
- Every entry lists core_item_ids: the concept_key values it is built from.
  Write title and summary only from those core items. Never add facts.
- Put each core item in exactly one entry of highlights, topics, or progress_roadmap.
  Never repeat a core item across or within these arrays, and never leave one out:
  importance decides the highlights and the order, not whether an item is kept.
  - highlights: the 3-5 most important outcomes or decisions of the day.
  - topics: discussions, decisions, requests, and coordination.
  - progress_roadmap: concrete work moving forward, such as tickets, PRs, and releases, with status.
  - Core items share one entry only when they are the same work (the same ticket, a follow-up,
    a cause and its fix), not because they share a theme or a person.
  - Within each array, put the most important entry first.
- member_activity: one entry per person who appears in members of some core item,
  summarizing what they did. The title is only the person's name, exactly as in people.
  Its core_item_ids are the core items listing that person in members; they may also appear in the arrays above.
- overview.summary: 2-4 sentences, refined from overview_candidate.
- item_key: kebab-case, unique within its array.`,
};

const SUBMIT = "submit_daily_core";

const InitialData = v.object({
  coreRefs: v.record(v.string(), v.array(v.string())),
  authors: v.record(v.string(), v.string()),
  people: v.array(v.string()),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function CoreStructurer() {
  const { language, model, thinkingLevel, instructions, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
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

  return `${instructions.trim()}
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

CoreStructurer.initialData = InitialData;
